-- Tests voor Gewicht: alleen de ouder zelf, niet de partner en nooit een tablet. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000a01'), ('00000000-0000-0000-0000-000000000a02'),
                              ('00000000-0000-0000-0000-000000000a03'), ('00000000-0000-0000-0000-000000000a04');
set role authenticated;

-- Gezin met twee ouders (An op a01, Bert op a02) en een tablet (a03).
select pg_temp.als('00000000-0000-0000-0000-000000000a01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.mijn_ouder() as an \gset
select id as bert from public.gebruikers where naam = 'Bert' \gset
select public.koppelcode_maken('ouder', :'bert') as code_bert \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-000000000a02', false);
select public.koppelen(:'code_bert');
select pg_temp.als('00000000-0000-0000-0000-000000000a03', true);
select public.koppelen(:'code_tablet');

\echo '1. Een ouder bewaart een profiel en wegingen, een per dag'
select pg_temp.als('00000000-0000-0000-0000-000000000a01', false);
insert into public.gezondheid_profielen (ouder_id, gezin_id, geboortedatum, lengte_cm, doelgewicht_kg)
  values (:'an', :'gezin', '1988-05-12', 168, 64);
update public.gezondheid_profielen set doelgewicht_kg = 63.5;
select pg_temp.gelijk((select doelgewicht_kg from public.gezondheid_profielen), 63.5::numeric, 'doel aangepast');
select pg_temp.fout(format('insert into public.gezondheid_profielen (ouder_id, gezin_id) values (%L, %L)', :'bert', :'gezin'), 'row-level security');
select pg_temp.fout(format('update public.gezondheid_profielen set lengte_cm = 20 where ouder_id = %L', :'an'), 'check');
insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (:'gezin', :'an', '2026-10-01', 70.2), (:'gezin', :'an', '2026-10-20', 68.9);
select pg_temp.fout(format('insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (%L, %L, %L, 69)', :'gezin', :'an', '2026-10-20'), 'duplicate key');
select pg_temp.fout(format('insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (%L, %L, %L, 69)', :'gezin', :'bert', '2026-10-21'), 'row-level security');
select pg_temp.fout(format('insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (%L, %L, %L, 5)', :'gezin', :'an', '2026-10-22'), 'check');
update public.wegingen set gewicht_kg = 68.7 where dag = '2026-10-20';
select pg_temp.fout($$update public.wegingen set eigenaar = gen_random_uuid()$$, 'permission denied');

\echo '2. De partner ziet niets en kan niets aanpassen'
select pg_temp.als('00000000-0000-0000-0000-000000000a02', false);
select pg_temp.gelijk((select count(*) from public.wegingen), 0::bigint, 'Bert ziet de wegingen van An niet');
select pg_temp.gelijk((select count(*) from public.gezondheid_profielen), 0::bigint, 'Bert ziet het profiel van An niet');
delete from public.wegingen;
insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (:'gezin', :'bert', '2026-10-20', 82.4);
select pg_temp.gelijk((select count(*) from public.wegingen), 1::bigint, 'Bert ziet enkel zijn eigen');

\echo '3. De tablet ziet niets en kan niets schrijven'
select pg_temp.als('00000000-0000-0000-0000-000000000a03', true);
select pg_temp.gelijk((select count(*) from public.wegingen), 0::bigint, 'tablet ziet geen wegingen');
select pg_temp.gelijk((select count(*) from public.gezondheid_profielen), 0::bigint, 'tablet ziet geen profielen');
select pg_temp.fout(format('insert into public.wegingen (gezin_id, eigenaar, dag, gewicht_kg) values (%L, %L, %L, 60)', :'gezin', :'an', '2026-10-23'), 'row-level security');

\echo '4. An heeft nog alles; een ander gezin ziet niets'
select pg_temp.als('00000000-0000-0000-0000-000000000a01', false);
select pg_temp.gelijk((select count(*) from public.wegingen), 2::bigint, 'wegingen van An blijven');
select pg_temp.gelijk((select gewicht_kg from public.wegingen where dag = '2026-10-20'), 68.7::numeric, 'aangepaste weging');
select pg_temp.als('00000000-0000-0000-0000-000000000a04', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]');
select pg_temp.gelijk((select count(*) from public.wegingen), 0::bigint, 'ander gezin wegingen');

reset role;
