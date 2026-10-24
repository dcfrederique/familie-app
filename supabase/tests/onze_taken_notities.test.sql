-- Tests voor Onze taken en Notities: alleen de ouders, nooit een tablet. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000801'), ('00000000-0000-0000-0000-000000000802'),
                              ('00000000-0000-0000-0000-000000000803'), ('00000000-0000-0000-0000-000000000804');
set role authenticated;

-- Gezin met twee ouders (An op 701, Bert op 702) en een tablet (703).
select pg_temp.als('00000000-0000-0000-0000-000000000801', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.mijn_ouder() as an \gset
select id as bert from public.gebruikers where naam = 'Bert' \gset
select public.koppelcode_maken('ouder', :'bert') as code_bert \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-000000000802', false);
select public.koppelen(:'code_bert');
select pg_temp.als('00000000-0000-0000-0000-000000000803', true);
select public.koppelen(:'code_tablet');

\echo '1. Een ouder maakt een taak voor de partner en vinkt een herhalende taak af'
select pg_temp.als('00000000-0000-0000-0000-000000000801', false);
insert into public.ouder_taken (gezin_id, titel, wie) values (:'gezin', 'Schoolreis betalen', :'bert');
insert into public.ouder_taken (gezin_id, titel, datum, herhaling) values (:'gezin', 'Vuilnis buiten', '2026-10-27', 'wekelijks')
  returning id as vuilnis \gset
select pg_temp.fout(format('insert into public.ouder_taken (gezin_id, titel, herhaling) values (%L, %L, %L)', :'gezin', 'Zonder datum', 'wekelijks'), 'check');
select pg_temp.fout(format('insert into public.ouder_taken (gezin_id, titel, wie) values (%L, %L, (select id from public.gebruikers where naam = %L))', :'gezin', 'Kind', 'Lies'), 'row-level security');
select public.ouder_taak_afvinken(:'vuilnis', true);
select pg_temp.gelijk((select gedaan_door from public.ouder_taken where id = :'vuilnis'), :'an'::uuid, 'gedaan door An');
select pg_temp.gelijk((select datum from public.ouder_taken where vorige_id = :'vuilnis'), '2026-11-03'::date, 'volgende week erbij');
select public.ouder_taak_afvinken(:'vuilnis', true);
select pg_temp.gelijk((select count(*) from public.ouder_taken where titel = 'Vuilnis buiten'), 2::bigint, 'twee keer afvinken maakt er geen derde bij');
select public.ouder_taak_afvinken(:'vuilnis', false);
select pg_temp.gelijk((select count(*) from public.ouder_taken where titel = 'Vuilnis buiten'), 1::bigint, 'terugzetten haalt de volgende weg');

\echo '2. De partner ziet de taken; de tablet ziet niets'
select pg_temp.als('00000000-0000-0000-0000-000000000802', false);
select pg_temp.gelijk((select count(*) from public.ouder_taken), 2::bigint, 'Bert ziet onze taken');
select pg_temp.als('00000000-0000-0000-0000-000000000803', true);
select pg_temp.gelijk((select count(*) from public.ouder_taken), 0::bigint, 'tablet ziet geen ouder-taken');
select pg_temp.fout(format('insert into public.ouder_taken (gezin_id, titel) values (%L, %L)', :'gezin', 'Stiekem'), 'row-level security');
select pg_temp.fout(format('select public.ouder_taak_afvinken(%L, true)', :'vuilnis'), 'niet gevonden');

\echo '3. Notities: gedeeld voor beide ouders, privé alleen voor de eigenaar'
select pg_temp.als('00000000-0000-0000-0000-000000000801', false);
insert into public.notities (gezin_id, eigenaar, titel, tekst) values (:'gezin', :'an', 'Maten', 'Lies 122');
insert into public.notities (gezin_id, eigenaar, titel, tekst, gedeeld) values (:'gezin', :'an', 'Cadeau Bert', 'Boek', false);
insert into public.notities (gezin_id, eigenaar, titel, lijst) values (:'gezin', :'an', 'Inpakken', '[{"t": "jas", "af": false}]');
select pg_temp.fout(format('insert into public.notities (gezin_id, eigenaar, titel) values (%L, %L, %L)', :'gezin', :'bert', 'Namens Bert'), 'row-level security');
select pg_temp.fout(format('insert into public.notities (gezin_id, eigenaar, lijst) values (%L, %L, %L)', :'gezin', :'an', '{"t": 1}'), 'check');
select pg_temp.als('00000000-0000-0000-0000-000000000802', false);
select pg_temp.gelijk((select count(*) from public.notities), 2::bigint, 'Bert ziet enkel de gedeelde');
update public.notities set tekst = 'Lies 124' where titel = 'Maten';
select pg_temp.gelijk((select tekst from public.notities where titel = 'Maten'), 'Lies 124', 'partner past gedeelde aan');
select pg_temp.fout($$update public.notities set gedeeld = false where titel = 'Maten'$$, 'row-level security');
select pg_temp.fout($$update public.notities set eigenaar = public.mijn_ouder() where titel = 'Maten'$$, 'permission denied');
delete from public.notities where titel = 'Cadeau Bert';
select pg_temp.als('00000000-0000-0000-0000-000000000801', false);
select pg_temp.gelijk((select count(*) from public.notities), 3::bigint, 'privé notitie blijft');
select pg_temp.als('00000000-0000-0000-0000-000000000803', true);
select pg_temp.gelijk((select count(*) from public.notities), 0::bigint, 'tablet ziet geen notities');

\echo '4. Een ander gezin ziet niets'
select pg_temp.als('00000000-0000-0000-0000-000000000804', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]');
select pg_temp.gelijk((select count(*) from public.ouder_taken), 0::bigint, 'ander gezin taken');
select pg_temp.gelijk((select count(*) from public.notities), 0::bigint, 'ander gezin notities');

reset role;
