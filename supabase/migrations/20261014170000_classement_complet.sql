-- =====================================================================
-- Classement des jeux : liste complète (podium affiché, le reste à dérouler)
-- Plafonnée à 200 lignes pour rester légère.
-- (à exécuter une fois dans Supabase → SQL Editor)
-- =====================================================================

create or replace function public.classement_complet(p_jeu text)
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
    limit 200
  ) t;
$$;

revoke all on function public.classement_complet(text) from public;
grant execute on function public.classement_complet(text) to anon, authenticated;
