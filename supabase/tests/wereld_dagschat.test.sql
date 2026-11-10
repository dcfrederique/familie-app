-- Tests voor de dagschat van het Dorpsbord (één gratis stuk per kind per dag). Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000001f7');
select set_config('app.nu', '2026-11-10 16:00+01', false);
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000001f7', false);
select public.gezin_aanmaken('Dorp', 'Ouder', '[{"naam": "Lex"}]') as gezin \gset
select id as lex from public.gebruikers where naam = 'Lex' \gset

\echo '1. De dagschat: een gratis stuk uit de winkel van het kind'
select public.wereld_dagschat(:'lex', array['hoofd:kroon']) as h \gset
select pg_temp.gelijk(:'h'::jsonb -> 'cadeau' ->> 'sleutel', 'kroon', 'stuk uit de kandidaten');
select pg_temp.gelijk((select prijs from public.aankopen where kind_id = :'lex' and soort = 'hoofd' and sleutel = 'kroon'), 0, 'gratis aankoop');
select pg_temp.gelijk((select count(*) from public.puntenlog where kind_id = :'lex'), 0::bigint, 'niets in het puntenlog');

\echo '2. Dezelfde dag nog eens: niets'
select pg_temp.gelijk(public.wereld_dagschat(:'lex') is null, true, 'maar één keer per dag');

\echo '3. Volgende dag weer, maar nooit iets wat het kind al heeft'
reset role;
select set_config('app.nu', '2026-11-11 09:00+01', false);
set role authenticated;
select pg_temp.gelijk(coalesce(public.wereld_dagschat(:'lex', array['hoofd:kroon']) -> 'cadeau', 'null'::jsonb), 'null'::jsonb, 'al van het kind');

\echo '4. Een ander gezin ziet de dagschat niet'
reset role;
insert into auth.users values ('00000000-0000-0000-0000-0000000001f8');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000001f8', false);
select pg_temp.gelijk((select count(*) from public.wereld_dagschat), 0::bigint, 'ander gezin ziet niets');

\echo 'wereld dagschat: ok'
