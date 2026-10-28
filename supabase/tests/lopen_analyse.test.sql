-- Tests voor Lopen-analyse: doelen, schoenen en schema zijn privé per ouder. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000009c1'), ('00000000-0000-0000-0000-0000000009c2'), ('00000000-0000-0000-0000-0000000009c3');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000009c1', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.mijn_ouder() as an \gset
select id as bert from public.gebruikers where naam = 'Bert' \gset
select public.koppelcode_maken('ouder', :'bert') as code_bert \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-0000000009c2', false);
select public.koppelen(:'code_bert');
select pg_temp.als('00000000-0000-0000-0000-0000000009c3', true);
select public.koppelen(:'code_tablet');

\echo '1. De ouder beheert doelen, schoenen en schema'
select pg_temp.als('00000000-0000-0000-0000-0000000009c1', false);
insert into public.loopdoelen (gezin_id, eigenaar, soort, waarde) values (:'gezin', :'an', 'km_maand', 60);
select pg_temp.fout(format('insert into public.loopdoelen (gezin_id, eigenaar, soort, waarde) values (%L, %L, %L, 80)', :'gezin', :'an', 'km_maand'), 'duplicate key');
select pg_temp.fout(format('insert into public.loopdoelen (gezin_id, eigenaar, soort, waarde) values (%L, %L, %L, 80)', :'gezin', :'an', 'onzin'), 'check');
update public.loopdoelen set waarde = 70;
insert into public.loopschoenen (gezin_id, eigenaar, naam) values (:'gezin', :'an', 'Ghost 15') returning id as schoen \gset
insert into public.loopschemas (ouder_id, gezin_id, doel_km, per_week, start_dag, start_km) values (:'an', :'gezin', 21.1, 3, '2026-11-02', 9);
select pg_temp.fout(format('insert into public.loopschemas (ouder_id, gezin_id, doel_km, per_week, start_dag, start_km) values (%L, %L, 10, 7, %L, 5)', :'bert', :'gezin', '2026-11-02'), 'row-level security');
insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, schoen_id) values (:'gezin', :'an', '2026-10-20', 5000, 1650, :'schoen');

\echo '2. Een loop kan alleen een eigen schoen hebben'
select pg_temp.als('00000000-0000-0000-0000-0000000009c2', false);
insert into public.loopschoenen (gezin_id, eigenaar, naam) values (:'gezin', :'bert', 'Pegasus') returning id as schoen_bert \gset
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, schoen_id) values (%L, %L, %L, 5000, 1650, %L)', :'gezin', :'bert', '2026-10-21', :'schoen'), 'schoen hoort niet');

\echo '3. De partner en de tablet zien niets'
select pg_temp.gelijk((select count(*) from public.loopdoelen), 0::bigint, 'Bert ziet de doelen niet');
select pg_temp.gelijk((select count(*) from public.loopschemas), 0::bigint, 'Bert ziet het schema niet');
select pg_temp.gelijk((select count(*) from public.loopschoenen), 1::bigint, 'Bert ziet enkel zijn schoen');
select pg_temp.als('00000000-0000-0000-0000-0000000009c3', true);
select pg_temp.gelijk((select count(*) from public.loopdoelen) + (select count(*) from public.loopschoenen) + (select count(*) from public.loopschemas), 0::bigint, 'tablet ziet niets');

\echo '4. Een schoen verwijderen laat de lopen staan'
select pg_temp.als('00000000-0000-0000-0000-0000000009c1', false);
delete from public.loopschoenen;
select pg_temp.gelijk((select count(*) from public.loopsessies where schoen_id is null), 1::bigint, 'loop zonder schoen');

reset role;
