-- Tests voor het gezinsdoel van de week (glinsters tellen voor het hele gezin). Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

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

insert into auth.users values ('00000000-0000-0000-0000-0000000002a1');
-- dinsdag 10 november 2026
select set_config('app.nu', '2026-11-10 16:00+01', false);
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000002a1', false);
select public.gezin_aanmaken('Samen', 'Ouder', '[{"naam": "Mo"}, {"naam": "Zoë"}]') as gezin \gset
select id as mo from public.gebruikers where naam = 'Mo' \gset
select id as zoe from public.gebruikers where naam = 'Zoë' \gset

\echo '1. Glinsters tellen per kind, het gezin ziet de som van de week'
select public.wereld_glinster(:'mo'); select public.wereld_glinster(:'mo'); select public.wereld_glinster(:'zoe');
select pg_temp.gelijk((public.wereld_gezinsdoel() ->> :'mo')::int, 2, 'Mo vond er twee');
select pg_temp.gelijk((public.wereld_gezinsdoel() ->> :'zoe')::int, 1, 'Zoë vond er één');

\echo '2. Zondag telt nog mee, maandag begint een nieuwe week'
reset role;
select set_config('app.nu', '2026-11-15 19:00+01', false);
set role authenticated;
select public.wereld_glinster(:'zoe');
select pg_temp.gelijk((public.wereld_gezinsdoel() ->> :'zoe')::int, 2, 'zondag hoort bij dezelfde week');
reset role;
select set_config('app.nu', '2026-11-16 08:00+01', false);
set role authenticated;
select pg_temp.gelijk(public.wereld_gezinsdoel(), '{}'::jsonb, 'nieuwe week, nieuw doel');

\echo '3. Hoogstens 60 per kind per dag'
select count(public.wereld_glinster(:'mo')) from generate_series(1, 70);
select pg_temp.gelijk((public.wereld_gezinsdoel() ->> :'mo')::int, 60, 'plafond per dag');

\echo '4. Een ander gezin ziet en telt niets'
reset role;
insert into auth.users values ('00000000-0000-0000-0000-0000000002a2');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000002a2', false);
select pg_temp.gelijk(public.wereld_gezinsdoel(), '{}'::jsonb, 'ander gezin ziet niets');
select pg_temp.gelijk((select count(*) from public.wereld_glinsters), 0::bigint, 'ook de tabel niet');

\echo 'wereld gezinsdoel: ok'
