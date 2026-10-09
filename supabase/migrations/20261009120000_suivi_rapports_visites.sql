-- =====================================================================
-- Suivi des devis signés, rapport du vendredi et mesure d'audience anonyme
-- (à exécuter une fois dans Supabase → SQL Editor)
-- =====================================================================

-- 1. Mesure d'audience anonyme : une ligne par page vue, sans cookie, sans IP, sans identifiant
create table if not exists public.visites (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  chemin text not null check (char_length(chemin) between 1 and 200),
  source text not null default 'direct' check (char_length(source) between 1 and 40)
);
alter table public.visites enable row level security;
drop policy if exists "visites_depot_public" on public.visites;
create policy "visites_depot_public" on public.visites for insert to anon with check (true);
revoke all on public.visites from anon, authenticated;
grant insert (chemin, source) on public.visites to anon;
grant select, insert, delete on public.visites to service_role;

-- 2. Devis Pennylane déjà signalés comme signés (pour n'envoyer chaque alerte qu'une fois)
create table if not exists public.pennylane_suivi (
  devis_id bigint primary key,
  numero text,
  client text,
  montant_ht text,
  statut text,
  signe_le timestamptz not null default now(),
  alerte_envoyee boolean not null default false,
  client_remercie boolean not null default false
);
alter table public.pennylane_suivi enable row level security;
revoke all on public.pennylane_suivi from anon, authenticated;
grant select, insert, update, delete on public.pennylane_suivi to service_role;

-- 3. Rapports hebdomadaires déjà envoyés (un seul par semaine)
create table if not exists public.rapports_hebdo (
  semaine date primary key,
  envoye_le timestamptz not null default now()
);
alter table public.rapports_hebdo enable row level security;
revoke all on public.rapports_hebdo from anon, authenticated;
grant select, insert, delete on public.rapports_hebdo to service_role;

-- 4. Tâches planifiées
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobname) from cron.job where jobname in ('copanier-signatures', 'copanier-rapport', 'copanier-purge-visites');

-- toutes les 15 minutes : devis signés dans Pennylane → alerte sur contact@copanier.fr
select cron.schedule('copanier-signatures', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://eykdcoqdhllbigxujgsl.supabase.co/functions/v1/copanier-devis',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "signatures"}'::jsonb
  );
$$);

-- vendredi 10 h 30 (heure de Paris : 8 h 30 UTC en été, 9 h 30 UTC en hiver ; la fonction ne garde que 10 h à Paris)
select cron.schedule('copanier-rapport', '30 8,9 * * 5', $$
  select net.http_post(
    url := 'https://eykdcoqdhllbigxujgsl.supabase.co/functions/v1/copanier-devis',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "rapport"}'::jsonb
  );
$$);

-- le 1er de chaque mois : on ne garde que 13 mois de statistiques de visites
select cron.schedule('copanier-purge-visites', '0 3 1 * *', $$
  delete from public.visites where created_at < now() - interval '13 months';
$$);
