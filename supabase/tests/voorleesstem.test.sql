-- Tests voor de keuze van de voorleesstem. Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.fout(sql text, verwacht text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'verwachtte fout "%" maar het lukte: %', verwacht, sql;
exception when others then
  if sqlerrm not like '%' || verwacht || '%' then
    raise exception 'verwachtte fout "%" maar kreeg "%" bij: %', verwacht, sqlerrm, sql;
  end if;
end $$;

create function pg_temp.gelijk(echt anyelement, verwacht anyelement, wat text) returns void language plpgsql as $$
begin
  if echt is distinct from verwacht then
    raise exception '%: verwachtte %, kreeg %', wat, verwacht, echt;
  end if;
end $$;

create function pg_temp.als(p_user text, p_anoniem boolean) returns void language sql as $$
  select set_config('request.jwt.claim.sub', p_user, false),
         set_config('request.jwt.claims', json_build_object('is_anonymous', p_anoniem)::text, false);
$$;

insert into auth.users values ('00000000-0000-0000-0000-000000000401'), ('00000000-0000-0000-0000-000000000402');
select set_config('app.nu', '2026-10-24 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000401', false);
select public.gezin_aanmaken('Stemmen', 'Ouder', '[{"naam": "Lies"}]') as gezin \gset
select id as lies from public.gebruikers where naam = 'Lies' \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000402', true);
select public.koppelen(:'code');

\echo '1. Standaard afwisselend'
select pg_temp.gelijk((select voorleesstem from public.gebruikers where id = :'lies'), 'afwisselend', 'standaard');

\echo '2. De tablet mag de stem niet kiezen'
update public.gebruikers set voorleesstem = 'arnaud' where id = :'lies';
select pg_temp.gelijk((select voorleesstem from public.gebruikers where id = :'lies'), 'afwisselend', 'tablet mag niet');

\echo '3. Een ouder kiest, alleen bekende waarden'
select pg_temp.als('00000000-0000-0000-0000-000000000401', false);
update public.gebruikers set voorleesstem = 'arnaud' where id = :'lies';
select pg_temp.gelijk((select voorleesstem from public.gebruikers where id = :'lies'), 'arnaud', 'ouder kiest');
select pg_temp.fout(format('update public.gebruikers set voorleesstem = %L where id = %L', 'robot', :'lies'), 'check');

reset role;
