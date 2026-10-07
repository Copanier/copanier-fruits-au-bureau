-- =====================================================================
-- Durcissement sécurité (recommandations du Security Advisor de Supabase)
-- =====================================================================

-- 1. Règle d'ajout : plus de « with check (true) » → une demande doit contenir un e-mail ou un téléphone
drop policy if exists "devis_copanier_depot_public" on public.devis_copanier;
create policy "devis_copanier_depot_public" on public.devis_copanier
  for insert to anon
  with check (coalesce(trim(email), '') <> '' or coalesce(trim(telephone), '') <> '');

-- 2. Fonctions internes : personne ne peut les appeler directement depuis l'API
--    (le déclencheur continue de fonctionner : le droit d'exécution n'est vérifié qu'à sa création)
revoke execute on function public.limiter_devis_copanier() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'rls_auto_enable' and n.nspname = 'public') then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
