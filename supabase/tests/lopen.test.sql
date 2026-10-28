-- Tests voor Lopen: alleen de ouder zelf, niet de partner en nooit een tablet. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000009a1'), ('00000000-0000-0000-0000-0000000009a2'),
                              ('00000000-0000-0000-0000-0000000009a3'), ('00000000-0000-0000-0000-0000000009a4');
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-0000000009a1', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.mijn_ouder() as an \gset
select id as bert from public.gebruikers where naam = 'Bert' \gset
select public.koppelcode_maken('ouder', :'bert') as code_bert \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-0000000009a2', false);
select public.koppelen(:'code_bert');
select pg_temp.als('00000000-0000-0000-0000-0000000009a3', true);
select public.koppelen(:'code_tablet');

\echo '1. De ouder beheert de eigen loopsessies'
select pg_temp.als('00000000-0000-0000-0000-0000000009a1', false);
insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, notitie) values (:'gezin', :'an', '2026-10-20', 5000, 1650, 'Rustig rondje');
insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, bron, externe_id) values (:'gezin', :'an', '2026-10-22', 8000, 2700, 'strava', '123');
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, bron, externe_id) values (%L, %L, %L, 8000, 2700, %L, %L)', :'gezin', :'an', '2026-10-22', 'strava', '123'), 'duplicate key');
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s) values (%L, %L, %L, 5000, 1650)', :'gezin', :'bert', '2026-10-21'), 'row-level security');
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s) values (%L, %L, %L, 5, 1650)', :'gezin', :'an', '2026-10-21'), 'check');
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s, gevoel) values (%L, %L, %L, 5000, 1650, 9)', :'gezin', :'an', '2026-10-21'), 'check');
update public.loopsessies set afstand_m = 5200 where dag = '2026-10-20';
select pg_temp.fout($$update public.loopsessies set eigenaar = gen_random_uuid()$$, 'permission denied');
select pg_temp.fout($$update public.loopsessies set bron = 'strava'$$, 'permission denied');

\echo '2. De partner ziet niets'
select pg_temp.als('00000000-0000-0000-0000-0000000009a2', false);
select pg_temp.gelijk((select count(*) from public.loopsessies), 0::bigint, 'Bert ziet de lopen van An niet');
delete from public.loopsessies;
insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s) values (:'gezin', :'bert', '2026-10-20', 10000, 3600);
select pg_temp.gelijk((select count(*) from public.loopsessies), 1::bigint, 'Bert ziet enkel zijn eigen');

\echo '3. De tablet ziet niets en kan niets schrijven'
select pg_temp.als('00000000-0000-0000-0000-0000000009a3', true);
select pg_temp.gelijk((select count(*) from public.loopsessies), 0::bigint, 'tablet ziet geen lopen');
select pg_temp.fout(format('insert into public.loopsessies (gezin_id, eigenaar, dag, afstand_m, duur_s) values (%L, %L, %L, 5000, 1650)', :'gezin', :'an', '2026-10-23'), 'row-level security');

\echo '4. An heeft nog alles; een ander gezin ziet niets'
select pg_temp.als('00000000-0000-0000-0000-0000000009a1', false);
select pg_temp.gelijk((select count(*) from public.loopsessies), 2::bigint, 'lopen van An blijven');
select pg_temp.gelijk((select afstand_m from public.loopsessies where dag = '2026-10-20'), 5200, 'aangepaste afstand');
select pg_temp.als('00000000-0000-0000-0000-0000000009a4', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]');
select pg_temp.gelijk((select count(*) from public.loopsessies), 0::bigint, 'ander gezin lopen');

reset role;
