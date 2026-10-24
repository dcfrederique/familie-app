-- Tests voor het winkelaanbod: vrijgeven per gezin en verbergen per kind. Draaien met scripts/test-db.sh.
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

create function pg_temp.fig(veld text default 'huid', waarde text default 'licht') returns jsonb language sql as $$
  select jsonb_build_object('huid', 'licht', 'gezicht', 'lach', 'haar', 'kort', 'haarKleur', 'bruin', 'hoofd', 'geen',
    'shirt', 'tshirt', 'shirtKleur', 'blauw', 'broek', 'lang', 'broekKleur', 'jeans', 'schoenen', 'sport',
    'schoenKleur', 'wit', 'extra', 'geen') || jsonb_build_object(veld, waarde)
$$;

insert into auth.users values ('00000000-0000-0000-0000-000000000c01'), ('00000000-0000-0000-0000-000000000c02'),
                              ('00000000-0000-0000-0000-000000000c03');
select set_config('app.nu', '2026-10-24 16:00+02', false);
-- Een spelletje dat er na de migratie bijkomt, zoals de nachtelijke bouw doet.
insert into public.spel_prijzen (sleutel, prijs) values ('ballonnen', 15);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000c01', false);
select public.gezin_aanmaken('Aanbod', 'Ouder', '[{"naam": "Lex"}, {"naam": "Pim"}]') as gezin \gset
select id as lex from public.gebruikers where naam = 'Lex' \gset
select id as pim from public.gebruikers where naam = 'Pim' \gset
select public.koppelcode_maken('tablet') as code \gset
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'lex', 100, 'test', 'correctie', now()), (:'gezin', :'pim', 100, 'test', 'correctie', now());
set role authenticated;

\echo '1. Wat er al was ligt in de winkel, wat erbij komt nog niet'
select pg_temp.gelijk(public.in_aanbod(:'lex', 'spel', 'basket'), true, 'basket vrij');
select pg_temp.gelijk(public.in_aanbod(:'lex', 'hoofd', 'kroon'), true, 'kroon vrij');
select pg_temp.gelijk(public.in_aanbod(:'lex', 'spel', 'ballonnen'), false, 'nieuw spel dicht');
select pg_temp.fout(format('select public.kopen(%L, ''spel'', ''ballonnen'')', :'lex'), 'nog niet in de winkel');

\echo '2. Een ouder geeft vrij; daarna kan het kind kopen'
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (:'gezin', 'spel', 'ballonnen', true);
select pg_temp.gelijk(public.kopen(:'lex', 'spel', 'ballonnen', 'Ballonnen'), 85, 'ballonnen kost 15');

\echo '3. Terug uit de winkel: niet meer te koop, wel van wie het al kocht'
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (:'gezin', 'hoofd', 'kroon', false);
select pg_temp.fout(format('select public.kopen(%L, ''hoofd'', ''kroon'')', :'pim'), 'nog niet in de winkel');
update public.aanbod set vrijgegeven = false where sleutel = 'ballonnen';
select pg_temp.gelijk(public.kopen(:'lex', 'spel', 'ballonnen', 'Ballonnen'), 85, 'gekocht blijft gekocht');

\echo '4. Verbergen per kind'
insert into public.aanbod_verborgen (gezin_id, kind_id, soort, sleutel) values (:'gezin', :'pim', 'spel', 'basket');
select pg_temp.gelijk(public.in_aanbod(:'pim', 'spel', 'basket'), false, 'basket weg voor Pim');
select pg_temp.gelijk(public.in_aanbod(:'lex', 'spel', 'basket'), true, 'basket nog voor Lex');
select pg_temp.fout(format('select public.kopen(%L, ''spel'', ''basket'')', :'pim'), 'nog niet in de winkel');
select pg_temp.gelijk(public.kopen(:'lex', 'spel', 'basket', 'Basket'), 45, 'Lex koopt basket');

\echo '5. Alles vrij: alleen wat in de winkel ligt, of wat het kind al droeg'
update public.gebruikers set figuurtje_alles_vrij = true where id = :'pim';
select pg_temp.als('00000000-0000-0000-0000-000000000c02', true);
select public.koppelen(:'code');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig('hoofd', 'kroon')), 'nog niet in de winkel');
select public.figuurtje_bewaren(:'pim', pg_temp.fig('hoofd', 'helm'));
select pg_temp.als('00000000-0000-0000-0000-000000000c01', false);
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (:'gezin', 'hoofd', 'helm', false);
select pg_temp.als('00000000-0000-0000-0000-000000000c02', true);
select public.figuurtje_bewaren(:'pim', pg_temp.fig('hoofd', 'helm') || '{"shirtKleur": "rood"}');

\echo '6. Alleen een ouder-account beheert het aanbod'
select pg_temp.fout(format('insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (%L, ''spel'', ''koken'', false)', :'gezin'),
                    'row-level security');
delete from public.aanbod_verborgen;
select pg_temp.gelijk((select count(*) from public.aanbod_verborgen), 1::bigint, 'tablet wist niets');
select pg_temp.gelijk((select count(*) from public.aanbod), 3::bigint, 'tablet leest het aanbod');

\echo '8. De ouders stellen de prijs in'
select pg_temp.als('00000000-0000-0000-0000-000000000c01', false);
update public.gebruikers set figuurtje_alles_vrij = false, kan_lezen = false where id = :'pim';
select pg_temp.gelijk(public.in_aanbod(:'lex', 'spel', 'koken'), true, 'koken vrij');
insert into public.aanbod (gezin_id, soort, sleutel, prijs) values (:'gezin', 'spel', 'koken', 5);
select pg_temp.gelijk(public.in_aanbod(:'lex', 'spel', 'koken'), true, 'alleen een prijs laat het vrijgegeven');
select pg_temp.gelijk(public.kopen(:'lex', 'spel', 'koken', 'Koken'), 40, 'koken kost 5 in plaats van 25');
select pg_temp.gelijk(public.kopen(:'pim', 'spel', 'koken', 'Koken'), 97, 'Pim betaalt de helft van 5, naar boven afgerond (3)');
insert into public.aanbod (gezin_id, soort, sleutel, prijs) values (:'gezin', 'extra', 'cape', 0)
  on conflict (gezin_id, soort, sleutel) do update set prijs = excluded.prijs;
select pg_temp.fout(format('update public.aanbod set prijs = -1 where sleutel = ''koken'''), 'aanbod_prijs_check');
select pg_temp.gelijk(public.kopen(:'pim', 'extra', 'cape', 'Cape'), 97, 'cape gratis gezet');
select pg_temp.als('00000000-0000-0000-0000-000000000c02', true);
select pg_temp.fout(format('update public.aanbod set prijs = 1 where sleutel = ''koken'''), 'row-level security');
select pg_temp.gelijk((select prijs from public.aanbod where sleutel = 'koken'), 5, 'tablet wijzigt niets');

\echo '7. Andere gezinnen zien en wijzigen niets'
select pg_temp.als('00000000-0000-0000-0000-000000000c03', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Bo"}]');
select pg_temp.gelijk((select count(*) from public.aanbod), 0::bigint, 'aanbod afgeschermd');
select pg_temp.fout(format('insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (%L, ''spel'', ''koken'', false)', :'gezin'),
                    'row-level security');
select pg_temp.fout(format('insert into public.aanbod_verborgen (gezin_id, kind_id, soort, sleutel) values (public.mijn_gezin(), %L, ''spel'', ''koken'')', :'lex'),
                    'row-level security');

reset role;
\echo 'Alle winkelaanbodtests geslaagd.'
