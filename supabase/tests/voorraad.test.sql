-- Tests voor Voorraad: de koppelingen met Boodschappen en het weekmenu, en wie erbij mag. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000a1f01'), ('00000000-0000-0000-0000-0000000a1f02'),
                              ('00000000-0000-0000-0000-0000000a1f03'), ('00000000-0000-0000-0000-0000000a1f04');
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-0000000a1f01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-0000000a1f03', true);
select public.koppelen(:'code_tablet');
select pg_temp.als('00000000-0000-0000-0000-0000000a1f01', false);

\echo '1. Artikelen en bijstellen: nooit onder 0, alles in het log'
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal, minimum, aankoop_aantal, plaats)
  values (:'gezin', 'Cola', 'fles', 4, 2, 6, 'Kelder') returning id as cola \gset
select pg_temp.fout(format('insert into public.voorraad_artikelen (gezin_id, naam) values (%L, %L)', :'gezin', ' cola'), 'duplicate key');
select pg_temp.fout(format('insert into public.voorraad_artikelen (gezin_id, naam, aantal) values (%L, %L, -1)', :'gezin', 'Min'), 'check');
select pg_temp.gelijk(public.voorraad_bijstellen(:'cola', 1, 'handmatig'), 5::numeric, 'erbij');
select pg_temp.gelijk(public.voorraad_bijstellen(:'cola', 100, 'telling', null, true), 100::numeric, 'tellen');
select pg_temp.gelijk(public.voorraad_bijstellen(:'cola', -500, 'handmatig'), 0::numeric, 'niet onder nul');
select pg_temp.gelijk((select verschil from public.voorraad_log order by id desc limit 1), -100::numeric, 'log toont wat echt veranderde');

\echo '2. Onder het minimum komt het artikel vanzelf op de lijst, maar niet twee keer'
select pg_temp.gelijk((select count(*) from public.boodschappen where naam = 'Cola' and gekocht_op is null), 1::bigint, 'cola op de lijst');
select public.voorraad_bijstellen(:'cola', 3, 'handmatig');
select public.voorraad_bijstellen(:'cola', -2, 'handmatig');
select pg_temp.gelijk((select count(*) from public.boodschappen where naam = 'Cola' and gekocht_op is null), 1::bigint, 'geen dubbel');

\echo '3. Afvinken telt een aankoop bij (pak van 6), terugzetten haalt het er weer af'
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'cola'), 1::numeric, 'startaantal');
update public.boodschappen set gekocht_op = now() where naam = 'Cola' and gekocht_op is null;
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'cola'), 7::numeric, 'een pak erbij');
update public.boodschappen set gekocht_op = null where naam = 'Cola';
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'cola'), 1::numeric, 'terug');
update public.boodschappen set gekocht_op = now() where naam = 'Cola';
update public.boodschappen set gekocht_op = now() where naam = 'Cola';
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'cola'), 7::numeric, 'niet dubbel geteld');
insert into public.boodschappen (gezin_id, naam, aantal, gekocht_op) values (:'gezin', ' COLA', 2, now());
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'cola'), 19::numeric, 'afrekenen met aantal 2 = 12 flessen');
insert into public.boodschappen (gezin_id, naam, gekocht_op) values (:'gezin', 'Onbekend artikel', now());

\echo '4. Recept en weekmenu: gekookt trekt van de voorraad af, omgerekend naar de eters'
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Gehakt', 'kg', 2) returning id as gehakt \gset
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Pasta', 'pak', 3) returning id as pasta \gset
insert into public.recepten (gezin_id, naam, personen) values (:'gezin', 'Spaghetti bolognese', 4) returning id as recept \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'recept', :'gehakt', 0.4), (:'gezin', :'recept', :'pasta', 0.8);
insert into public.weekmenu (gezin_id, dag, gerecht) values (:'gezin', '2026-10-27', 'spaghetti Bolognese '), (:'gezin', '2026-10-28', 'Stoofvlees');
select pg_temp.fout('select public.voorraad_gekookt(''2026-10-29'')', 'niets op het weekmenu');
select pg_temp.fout('select public.voorraad_gekookt(''2026-10-28'')', 'geen recept');
-- Standaard 6 eters bij een recept voor 4: 0,4 kg × 6 / 4 = 0,6 kg.
select pg_temp.gelijk(public.voorraad_gekookt('2026-10-27'), 2, 'twee ingrediënten');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 1.4::numeric, 'gehakt omlaag');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'pasta'), 1.8::numeric, 'pasta omlaag');
select pg_temp.fout('select public.voorraad_gekookt(''2026-10-27'')', 'al afgeboekt');
select public.voorraad_gekookt('2026-10-28', true);
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 1.4::numeric, 'overslaan laat de voorraad staan');
insert into public.voorraad_instellingen (gezin_id, eters) values (:'gezin', 2);
insert into public.weekmenu (gezin_id, dag, gerecht) values (:'gezin', '2026-10-29', 'Spaghetti bolognese');
select public.voorraad_gekookt('2026-10-29');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 1.2::numeric, 'twee eters: 0,2 kg');

\echo '5. Een recept kan geen artikel van een ander gezin gebruiken'
select pg_temp.als('00000000-0000-0000-0000-0000000a1f04', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]') as buren \gset
select pg_temp.gelijk((select count(*) from public.voorraad_artikelen), 0::bigint, 'ander gezin ziet niets');
select pg_temp.fout(format('select public.voorraad_bijstellen(%L, 1, %L)', :'cola', 'handmatig'), 'bestaat niet');
insert into public.recepten (gezin_id, naam) values (:'buren', 'Soep') returning id as soep \gset
select pg_temp.fout(format('insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (%L, %L, %L, 1)', :'buren', :'soep', :'cola'), 'row-level security');

\echo '6. De tablet ziet en doet niets'
select pg_temp.als('00000000-0000-0000-0000-0000000a1f03', true);
select pg_temp.gelijk((select count(*) from public.voorraad_artikelen), 0::bigint, 'tablet ziet geen voorraad');
select pg_temp.fout(format('select public.voorraad_bijstellen(%L, 1, %L)', :'cola', 'handmatig'), 'Alleen een ouder');
select pg_temp.fout('select public.voorraad_gekookt(''2026-10-27'')', 'Alleen een ouder');
select pg_temp.fout(format('insert into public.voorraad_artikelen (gezin_id, naam) values (%L, %L)', :'gezin', 'Snoep'), 'row-level security');
\echo 'voorraad: alles goed'
