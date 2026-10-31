-- Tests voor weekmenu-momenten, standaardmaaltijden en deelrecepten. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000a2f01'), ('00000000-0000-0000-0000-0000000a2f03');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000a2f01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-0000000a2f03', true);
select public.koppelen(:'code_tablet');
select pg_temp.als('00000000-0000-0000-0000-0000000a2f01', false);

\echo '1. Momenten: per dag meerdere maaltijden, de oude rij blijft de avond'
insert into public.weekmenu (gezin_id, dag, gerecht) values (:'gezin', '2026-10-27', 'Spaghetti bolognese');
insert into public.weekmenu (gezin_id, dag, moment, gerecht) values (:'gezin', '2026-10-27', 'ontbijt', 'Boterhammen');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, moment, gerecht) values (%L, %L, %L, %L)', :'gezin', '2026-10-27', 'ontbijt', 'Dubbel'), 'duplicate key');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, moment, gerecht) values (%L, %L, %L, %L)', :'gezin', '2026-10-27', 'nacht', 'x'), 'check');
select pg_temp.gelijk((select moment from public.weekmenu where gerecht = 'Spaghetti bolognese'), 'avond', 'standaard avond');

\echo '2. Afboeken per moment, met een standaardmaaltijd en een eigen aantal eters voor het vieruurtje'
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Brood', 'stuk', 10) returning id as brood \gset
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Fruit', 'stuk', 20) returning id as fruit \gset
insert into public.recepten (gezin_id, naam, personen) values (:'gezin', 'Boterhammen', 2) returning id as r_brood \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'r_brood', :'brood', 1);
insert into public.recepten (gezin_id, naam, personen) values (:'gezin', 'Fruit', 1) returning id as r_fruit \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'r_fruit', :'fruit', 1);
-- 6 eters: 1 brood × 6 / 2 = 3.
select pg_temp.gelijk(public.voorraad_gekookt_moment('2026-10-27', 'ontbijt'), 1, 'ontbijt');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'brood'), 7::numeric, 'brood omlaag');
select pg_temp.fout('select public.voorraad_gekookt_moment(''2026-10-27'', ''ontbijt'')', 'al afgeboekt');
select pg_temp.fout('select public.voorraad_gekookt_moment(''2026-10-28'', ''ontbijt'')', 'niets op het weekmenu');
-- Standaard: elke dag fruit als vieruurtje, op woensdag (3) iets anders.
insert into public.weekmenu_standaard (gezin_id, moment, weekdag, gerecht) values (:'gezin', 'vieruurtje', 0, 'fruit'), (:'gezin', 'vieruurtje', 3, 'Boterhammen');
select pg_temp.fout(format('insert into public.weekmenu_standaard (gezin_id, moment, weekdag, gerecht) values (%L, %L, 0, %L)', :'gezin', 'vieruurtje', 'dubbel'), 'duplicate key');
select pg_temp.fout(format('insert into public.weekmenu_standaard (gezin_id, moment, weekdag, gerecht) values (%L, %L, 0, %L)', :'gezin', 'avond', 'x'), 'check');
-- 2026-10-27 is een dinsdag: de standaard "elke dag"; 4 eters voor het vieruurtje.
select public.voorraad_gekookt_moment('2026-10-27', 'vieruurtje');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'fruit'), 16::numeric, 'fruit voor 4 eters');
-- 2026-10-28 is een woensdag: de vaste weekdag wint.
select public.voorraad_gekookt_moment('2026-10-28', 'vieruurtje');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'brood'), 5::numeric, 'woensdag: boterhammen voor 4 eters (2 stuks)');
-- Overslaan boekt niets af.
select public.voorraad_gekookt_moment('2026-10-29', 'vieruurtje', true);
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'fruit'), 16::numeric, 'overslaan');
-- De oude functie blijft de avond afboeken.
insert into public.recepten (gezin_id, naam, personen) values (:'gezin', 'Spaghetti bolognese', 6) returning id as r_spa \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'r_spa', :'brood', 1);
select pg_temp.gelijk(public.voorraad_gekookt('2026-10-27'), 1, 'oude functie');
select pg_temp.gelijk((select count(*) from public.voorraad_gekookt where moment = 'avond'), 1::bigint, 'avond geboekt');

\echo '3. Deelrecepten: een portie uit de diepvries, anders vers maken of op de lijst'
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal, plaats) values (:'gezin', 'Bolognaisesaus', 'portie', 1, 'Diepvries') returning id as saus_art \gset
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Gehakt', 'kg', 5) returning id as gehakt \gset
insert into public.voorraad_artikelen (gezin_id, naam, eenheid, aantal) values (:'gezin', 'Pasta', 'pak', 10) returning id as pasta \gset
insert into public.recepten (gezin_id, naam, personen, artikel_id, opbrengst) values (:'gezin', 'Bolognaisesaus', 4, :'saus_art', 4) returning id as saus \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'saus', :'gehakt', 2);
insert into public.recepten (gezin_id, naam, personen) values (:'gezin', 'Spaghetti met saus', 6) returning id as spa \gset
insert into public.recept_ingredienten (gezin_id, recept_id, artikel_id, hoeveelheid) values (:'gezin', :'spa', :'pasta', 1);
insert into public.recept_delen (gezin_id, recept_id, deel_id, porties) values (:'gezin', :'spa', :'saus', 1);
select pg_temp.fout(format('insert into public.recept_delen (gezin_id, recept_id, deel_id) values (%L, %L, %L)', :'gezin', :'saus', :'saus'), 'check');
insert into public.weekmenu (gezin_id, dag, gerecht) values (:'gezin', '2026-11-02', 'Spaghetti met saus'), (:'gezin', '2026-11-03', 'Spaghetti met saus'), (:'gezin', '2026-11-04', 'Spaghetti met saus');
-- 6 eters, recept voor 6: factor 1. Er is 1 portie saus: die gaat uit de diepvries.
select public.voorraad_gekookt('2026-11-02');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'saus_art'), 0::numeric, 'portie uit de diepvries');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 5::numeric, 'gehakt onaangeroerd');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'pasta'), 9::numeric, 'pasta af');
-- De saus is op: vers maken (opbrengst 4 porties voor 2 kg gehakt, nodig 1 portie = 0,5 kg).
select public.voorraad_gekookt('2026-11-03');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 4.5::numeric, 'vers gemaakt');
-- Op de lijst zetten: er gaat niets af, het artikel komt op de boodschappenlijst (één keer).
update public.recept_delen set als_op = 'lijst' where recept_id = :'spa';
select public.voorraad_gekookt('2026-11-04');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 4.5::numeric, 'gehakt blijft');
select pg_temp.gelijk((select count(*) from public.boodschappen where naam = 'Bolognaisesaus' and gekocht_op is null), 1::bigint, 'saus op de lijst');

\echo '4. Een deelrecept koken: ingrediënten eraf, porties erbij'
select pg_temp.gelijk(public.deelrecept_gekookt(:'saus'), 1, 'een ingrediënt');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'gehakt'), 2.5::numeric, 'gehakt af');
select pg_temp.gelijk((select aantal from public.voorraad_artikelen where id = :'saus_art'), 4::numeric, 'porties erbij');
select pg_temp.fout(format('select public.deelrecept_gekookt(%L)', :'spa'), 'geen deelrecept');

\echo '5. De tablet ziet en doet niets'
select pg_temp.als('00000000-0000-0000-0000-0000000a2f03', true);
select pg_temp.gelijk((select count(*) from public.weekmenu_standaard), 0::bigint, 'tablet ziet geen standaarden');
select pg_temp.gelijk((select count(*) from public.recept_delen), 0::bigint, 'tablet ziet geen deelrecepten');
select pg_temp.fout('select public.voorraad_gekookt_moment(''2026-10-27'', ''middag'')', 'Alleen een ouder');
select pg_temp.fout(format('select public.deelrecept_gekookt(%L)', :'saus'), 'Alleen een ouder');
\echo 'weekmenu momenten: alles goed'
