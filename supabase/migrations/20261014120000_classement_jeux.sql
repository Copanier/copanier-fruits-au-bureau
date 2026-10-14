-- =====================================================================
-- Classement des jeux (« Attrape les fruits », « Le saut de la pomme »)
-- Le public n'a AUCUN accès direct à la table : il passe par deux fonctions
-- contrôlées (enregistrer un score, lire le top 10).
-- =====================================================================

create table if not exists public.classement_jeux (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  jeu text not null check (jeu in ('attrape', 'saut')),
  prenom text not null check (char_length(prenom) between 2 and 20),
  score integer not null check (score between 1 and 100000)
);
create index if not exists classement_jeux_jeu_score on public.classement_jeux (jeu, score desc, created_at);
alter table public.classement_jeux enable row level security;
revoke all on public.classement_jeux from anon, authenticated;
grant select, insert, delete on public.classement_jeux to service_role;

-- Top 10 d'un jeu
create or replace function public.top_scores(p_jeu text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(t), '[]'::json)
  from (
    select prenom, score
    from public.classement_jeux
    where jeu = p_jeu
    order by score desc, created_at asc
    limit 10
  ) t;
$$;

-- Enregistre un score et renvoie le rang, le nombre de joueurs et le top 10
create or replace function public.enregistrer_score(p_jeu text, p_prenom text, p_score integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prenom text;
  v_max integer;
  v_rang integer;
  v_total integer;
  v_mots text[] := array['con','conne','connard','connasse','merde','pute','putain','salope','salaud','encule','enculé',
                         'nique','niquer','bite','couille','couilles','fdp','pd','batard','bâtard','enfoire','enfoiré',
                         'cul','chier','foutre','abruti','debile','débile','nazi','hitler','sexe','porno'];
begin
  if p_jeu not in ('attrape', 'saut') then
    raise exception 'jeu inconnu';
  end if;

  -- Prénom ou pseudo : lettres, espace, tiret, apostrophe ; 2 à 20 caractères
  v_prenom := initcap(btrim(regexp_replace(coalesce(p_prenom, ''), '\s+', ' ', 'g')));
  if v_prenom !~ '^[A-Za-zÀ-ÖØ-öø-ÿ'' -]{2,20}$' then
    raise exception 'prénom invalide';
  end if;
  if exists (select 1 from unnest(v_mots) m where lower(v_prenom) ~ ('(^|[ ''-])' || m || '($|[ ''-])')) then
    raise exception 'prénom refusé';
  end if;

  -- Scores plafonnés (au-delà, c'est forcément une triche)
  v_max := case p_jeu when 'attrape' then 1000 else 50000 end;
  if p_score is null or p_score < 1 or p_score > v_max then
    raise exception 'score invalide';
  end if;

  -- Anti-abus : pas plus de 30 scores par minute pour tout le site
  if (select count(*) from public.classement_jeux where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'trop de scores en même temps, réessayez dans un instant';
  end if;

  insert into public.classement_jeux (jeu, prenom, score) values (p_jeu, v_prenom, p_score);

  select count(*) + 1 into v_rang from public.classement_jeux where jeu = p_jeu and score > p_score;
  select count(*) into v_total from public.classement_jeux where jeu = p_jeu;

  return json_build_object('rang', v_rang, 'total', v_total, 'prenom', v_prenom, 'top', public.top_scores(p_jeu));
end;
$$;

revoke all on function public.top_scores(text) from public;
revoke all on function public.enregistrer_score(text, text, integer) from public;
grant execute on function public.top_scores(text) to anon, authenticated;
grant execute on function public.enregistrer_score(text, text, integer) to anon, authenticated;

-- Les scores sont conservés 12 mois (purge le 2 de chaque mois)
select cron.unschedule(jobname) from cron.job where jobname = 'copanier-purge-classement';
select cron.schedule('copanier-purge-classement', '0 3 2 * *', $$
  delete from public.classement_jeux where created_at < now() - interval '12 months';
$$);
