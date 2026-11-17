-- =====================================================================
-- Boutique sapins & boissons : entreprises autorisées et commandes
-- (à exécuter une fois dans Supabase → SQL Editor)
-- Le public n'a AUCUN accès à ces tables : seule la fonction « copanier-boutique »
-- (clé de service) les lit et les écrit.
-- =====================================================================

-- Entreprises et codes (remplie avec outils/sapins/entreprises.local.sql, fichier privé)
create table if not exists public.sapins_entreprises (
  reference  text primary key,          -- code entreprise normalisé, ex. SYM1277
  entreprise text not null,
  adresse    text,
  contact    text
);
alter table public.sapins_entreprises enable row level security;
revoke all on public.sapins_entreprises from anon, authenticated;
grant select, insert, update, delete on public.sapins_entreprises to service_role;

-- Commandes (une ligne par paiement Stripe)
create table if not exists public.commandes_boutique (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  session_id    text unique not null,   -- session Stripe Checkout
  payment_intent text,
  statut        text not null default 'en_attente' check (statut in ('en_attente', 'payee', 'expiree', 'remboursee')),
  reference     text not null,          -- code entreprise
  entreprise    text,
  adresse       text,
  vague         text not null,          -- V1 / V2
  livraison     text,                   -- date de livraison en clair
  articles      jsonb not null,         -- [{id, nom, quantite, prix_unitaire, sans_pied}]
  total_ttc     numeric(10,2) not null,
  client_prenom text,
  client_nom    text,
  client_email  text,
  client_tel    text,
  service       text,
  payee_le      timestamptz
);
create index if not exists commandes_boutique_vague on public.commandes_boutique (vague, statut, reference);
alter table public.commandes_boutique enable row level security;
revoke all on public.commandes_boutique from anon, authenticated;
grant select, insert, update on public.commandes_boutique to service_role;

-- Récapitulatif des commandes envoyé sur contact@copanier.fr le vendredi à 8 h (heure de Paris),
-- avant la commande fournisseur de midi : vague 1 le 27 novembre, vague 2 le 4 décembre.
select cron.unschedule(jobname) from cron.job where jobname in ('copanier-recap-sapins-v1', 'copanier-recap-sapins-v2');
select cron.schedule('copanier-recap-sapins-v1', '0 7 27 11 *', $$
  select net.http_post(url := 'https://eykdcoqdhllbigxujgsl.supabase.co/functions/v1/copanier-boutique',
    headers := '{"Content-Type": "application/json"}'::jsonb, body := '{"action": "recap", "vague": "V1"}'::jsonb);
$$);
select cron.schedule('copanier-recap-sapins-v2', '0 7 4 12 *', $$
  select net.http_post(url := 'https://eykdcoqdhllbigxujgsl.supabase.co/functions/v1/copanier-boutique',
    headers := '{"Content-Type": "application/json"}'::jsonb, body := '{"action": "recap", "vague": "V2"}'::jsonb);
$$);
