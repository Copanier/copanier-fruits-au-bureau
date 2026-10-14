-- =====================================================================
-- Demandes de devis gérées comme un petit CRM + sauvegardes
--   • chaque demande a un statut commercial (nouveau → contacté → devis envoyé → signé / perdu),
--     des notes et une date de relance ;
--   • le statut passe automatiquement à « signé » / « perdu » d'après Pennylane ;
--   • une vue « crm_demandes » lisible dans Supabase (Table Editor) ;
--   • crm_client_id servira à relier la demande au client de la plateforme de livraisons.
-- (à exécuter une fois dans Supabase → SQL Editor)
-- =====================================================================

alter table public.devis_copanier
  add column if not exists statut text not null default 'nouveau',
  add column if not exists statut_maj_le timestamptz,
  add column if not exists notes text,
  add column if not exists relance_le date,
  add column if not exists crm_client_id uuid,
  add column if not exists crm_importe_le timestamptz;

alter table public.devis_copanier drop constraint if exists devis_copanier_statut_check;
alter table public.devis_copanier add constraint devis_copanier_statut_check
  check (statut in ('nouveau', 'contacte', 'devis_envoye', 'signe', 'perdu'));

-- Date de dernière modification du statut, tenue à jour automatiquement
create or replace function public.devis_copanier_statut_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.statut is distinct from old.statut then
    new.statut_maj_le := now();
  end if;
  return new;
end;
$$;
revoke execute on function public.devis_copanier_statut_date() from public, anon, authenticated;
drop trigger if exists devis_copanier_statut_date on public.devis_copanier;
create trigger devis_copanier_statut_date
  before update on public.devis_copanier
  for each row execute function public.devis_copanier_statut_date();

-- Le site ne peut toujours rien remplir d'autre que la demande elle-même
create or replace function public.limiter_devis_copanier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(new.email), '') = '' and coalesce(trim(new.telephone), '') = '' then
    raise exception 'Coordonnées manquantes';
  end if;
  if coalesce(trim(new.email), '') <> '' and new.email !~* '^[^[:space:]@<>,;]+@[^[:space:]@<>,;]+\.[a-z]{2,}$' then
    raise exception 'E-mail invalide';
  end if;
  if length(coalesce(new.message, '')) > 5000
     or length(coalesce(new.entreprise, '') || coalesce(new.role, '') || coalesce(new.prenom, '') || coalesce(new.nom, '') || coalesce(new.adresse_entreprise, '')) > 1500
     or length(new.adresses_livraison::text) > 6000 then
    raise exception 'Demande trop longue';
  end if;
  if jsonb_typeof(new.adresses_livraison) <> 'array' or jsonb_array_length(new.adresses_livraison) > 20 then
    raise exception 'Adresses de livraison invalides';
  end if;
  if new.personnes is not null and (new.personnes < 1 or new.personnes > 100000) then
    raise exception 'Nombre de personnes invalide';
  end if;
  if coalesce(trim(new.email), '') <> '' and (
       select count(*) from public.devis_copanier
       where lower(email) = lower(new.email) and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Trop de demandes pour cette adresse';
  end if;
  if (select count(*) from public.devis_copanier where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Trop de demandes, réessayez plus tard';
  end if;
  -- les champs de suivi et du CRM ne peuvent pas être remplis par le site
  new.created_at := now();
  new.notifie := false;
  new.accuse_envoye := false;
  new.pennylane_client_id := null;
  new.pennylane_devis_id := null;
  new.pennylane_devis_numero := null;
  new.pennylane_erreur := null;
  new.statut := 'nouveau';
  new.statut_maj_le := now();
  new.notes := null;
  new.relance_le := null;
  new.crm_client_id := null;
  new.crm_importe_le := null;
  return new;
end;
$$;
revoke execute on function public.limiter_devis_copanier() from public, anon, authenticated;

-- Vue « CRM » : une ligne par demande, colonnes en clair, la plus récente en haut
create or replace view public.crm_demandes
with (security_invoker = true) as
select
  d.created_at                                         as recue_le,
  case d.statut
    when 'nouveau' then '1 · Nouveau'
    when 'contacte' then '2 · Contacté'
    when 'devis_envoye' then '3 · Devis envoyé'
    when 'signe' then '4 · Signé'
    when 'perdu' then '5 · Perdu'
  end                                                  as statut,
  d.relance_le,
  coalesce(nullif(d.entreprise, ''), '(particulier)')  as entreprise,
  nullif(concat_ws(' ', d.prenom, d.nom), '')          as contact,
  d.role                                               as fonction,
  d.email,
  d.telephone,
  case when d.rappel then coalesce('Oui — ' || d.creneau, 'Oui') else 'Non' end as rappel_demande,
  d.personnes,
  d.formule,
  d.adresse_entreprise,
  (select string_agg(a, ' | ') from jsonb_array_elements_text(d.adresses_livraison) a) as adresses_livraison,
  d.message,
  d.pennylane_devis_numero                             as devis_pennylane,
  d.pennylane_erreur                                   as probleme_pennylane,
  d.notes,
  d.page                                               as page_du_site,
  d.crm_client_id,
  d.id
from public.devis_copanier d
order by d.created_at desc;

revoke all on public.crm_demandes from anon, authenticated;
grant select on public.crm_demandes to service_role;
grant select, insert, update on public.devis_copanier to service_role;

-- Sauvegardes envoyées (pour n'en envoyer qu'une par heure à la demande)
create table if not exists public.sauvegardes_crm (
  id bigint generated always as identity primary key,
  envoyee_le timestamptz not null default now(),
  motif text not null default 'hebdo',
  nb_demandes integer not null default 0
);
alter table public.sauvegardes_crm enable row level security;
revoke all on public.sauvegardes_crm from anon, authenticated;
grant select, insert, delete on public.sauvegardes_crm to service_role;

-- Statut des demandes déjà reçues : d'après les devis signés connus
update public.devis_copanier d
set statut = 'signe'
from public.pennylane_suivi s
where d.pennylane_devis_id = s.devis_id and d.statut <> 'signe';
