-- =====================================================================
-- CoPanier de fruits au bureau — table des demandes de devis
-- Projet Supabase DÉDIÉ à CoPanier (indépendant de Foncier Stratégie).
-- À exécuter UNE FOIS : SQL Editor → New query → coller tout ce fichier → Run
-- =====================================================================

create table if not exists public.devis_copanier (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  entreprise             text,
  role                   text,
  prenom                 text,
  nom                    text,
  email                  text,
  telephone              text,
  rappel                 boolean not null default false,
  creneau                text,
  adresse_entreprise     text,
  adresses_livraison     jsonb not null default '[]'::jsonb,
  personnes              integer,
  formule                text,
  message                text,
  page                   text,
  -- suivi du traitement (rempli par la fonction copanier-devis)
  notifie                boolean not null default false,   -- fiche envoyée à contact@copanier.fr
  accuse_envoye          boolean not null default false,   -- accusé de réception envoyé au client
  pennylane_client_id    bigint,                           -- client trouvé ou créé dans Pennylane
  pennylane_devis_id     bigint,                           -- brouillon de devis créé dans Pennylane
  pennylane_devis_numero text,
  pennylane_erreur       text                              -- message si le brouillon n'a pas pu être créé
);

comment on table public.devis_copanier is 'Demandes de devis du site www.copanier.fr (formulaire « Demander un devis »)';

-- Sécurité : le public peut seulement DÉPOSER une demande (ni lire, ni modifier, ni supprimer)
alter table public.devis_copanier enable row level security;

drop policy if exists "devis_copanier_depot_public" on public.devis_copanier;
create policy "devis_copanier_depot_public" on public.devis_copanier
  for insert to anon
  with check (true);

-- Droits au strict nécessaire (le projet n'expose pas les tables automatiquement) :
--   le public (anon) peut seulement ajouter une ligne ; la fonction (service_role) lit et met à jour.
revoke all on public.devis_copanier from anon, authenticated;
grant usage on schema public to anon, service_role;
grant insert on public.devis_copanier to anon;
grant select, insert, update on public.devis_copanier to service_role;

-- Anti-abus et nettoyage avant chaque nouvelle demande
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
  -- les champs de suivi ne peuvent pas être remplis par le site
  new.created_at := now();
  new.notifie := false;
  new.accuse_envoye := false;
  new.pennylane_client_id := null;
  new.pennylane_devis_id := null;
  new.pennylane_devis_numero := null;
  new.pennylane_erreur := null;
  return new;
end;
$$;

drop trigger if exists limiter_devis_copanier on public.devis_copanier;
create trigger limiter_devis_copanier
  before insert on public.devis_copanier
  for each row execute function public.limiter_devis_copanier();
