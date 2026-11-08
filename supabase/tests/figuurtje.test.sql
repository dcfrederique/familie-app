-- Tests voor het figuurtje en het vrijspelen van stukken. Draaien met scripts/test-db.sh.
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

-- Figuurtje met één stuk anders dan het basisfiguurtje.
create function pg_temp.fig(veld text default 'huid', waarde text default 'licht') returns jsonb language sql as $$
  select jsonb_build_object('huid', 'licht', 'gezicht', 'lach', 'haar', 'kort', 'haarKleur', 'bruin', 'hoofd', 'geen',
    'shirt', 'tshirt', 'shirtKleur', 'blauw', 'broek', 'lang', 'broekKleur', 'jeans', 'schoenen', 'sport',
    'schoenKleur', 'wit', 'extra', 'geen') || jsonb_build_object(veld, waarde)
$$;

insert into auth.users values ('00000000-0000-0000-0000-000000000301'), ('00000000-0000-0000-0000-000000000302');
select set_config('app.nu', '2026-10-22 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000301', false);
select public.gezin_aanmaken('Figuren', 'Ouder', '[{"naam": "Lex"}, {"naam": "Pim", "kan_lezen": false}]') as gezin \gset
select id as lex from public.gebruikers where naam = 'Lex' \gset
select id as pim from public.gebruikers where naam = 'Pim' \gset
select id as ouder from public.gebruikers where naam = 'Ouder' \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000302', true);
select public.koppelen(:'code');

\echo '1. Basisstukken mag een kind meteen kiezen, vanaf de tablet'
select public.figuurtje_bewaren(:'lex', pg_temp.fig('haar', 'stekels'));
select pg_temp.gelijk((select figuurtje ->> 'haar' from public.gebruikers where id = :'lex'), 'stekels', 'bewaard');

\echo '2. Stukken op slot en onbekende stukken worden geweigerd'
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'kroon')), 'nog niet gekocht');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'tovenaarshoed')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('shirtKleur', 'goud')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('haarKleur', 'jeans')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() - 'extra'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() || '{"x": "y"}'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() || '{"extra": 5}'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'ouder', pg_temp.fig()), 'kind niet gevonden');

\echo '3. Stukken koop je met sterren van het vrije saldo'
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'lex', 160, 'test', 'correctie', now()), (:'gezin', :'lex', -60, 'Extra tijd', 'tijdverzoek', now());
set role authenticated;
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'helm')), 'nog niet gekocht');
select pg_temp.gelijk(public.kopen(:'lex', 'hoofd', 'helm', 'Racehelm'), 75, 'helm kost 25');
select public.figuurtje_bewaren(:'lex', pg_temp.fig('hoofd', 'helm'));
select pg_temp.gelijk(public.kopen(:'lex', 'hoofd', 'helm', 'Racehelm'), 75, 'twee keer kopen kost niets');
select pg_temp.gelijk(public.kopen(:'lex', 'haar', 'stekels'), 75, 'gratis stuk kost niets');
select pg_temp.gelijk((select count(*) from public.aankopen where kind_id = :'lex'), 1::bigint, 'een aankoop');
select pg_temp.gelijk((select reden || ' ' || delta || ' ' || bron from public.puntenlog where kind_id = :'lex' order by id desc limit 1),
                      'Gekocht: Racehelm -25 aankoop', 'log');
select pg_temp.gelijk(public.kopen(:'lex', 'hoofd', 'kroon', 'Kroontje'), 40, 'kroon kost 35');
select pg_temp.fout(format('select public.kopen(%L, ''extra'', ''cape'')', :'lex'), 'niet genoeg sterren');
select pg_temp.fout(format('select public.kopen(%L, ''hoofd'', ''tovenaarshoed'')', :'lex'), 'onbekend stuk');
select pg_temp.fout(format('select public.kopen(%L, ''kleur'', ''rood'')', :'lex'), 'aankopen_soort_check');
-- Sterren die voor extra tijd gereserveerd zijn, kun je niet uitgeven.
select public.tijd_aanvragen(:'lex', 30);
select pg_temp.fout(format('select public.kopen(%L, ''extra'', ''voetbal'')', :'lex'), 'niet genoeg sterren');
select pg_temp.gelijk(public.kopen(:'lex', 'extra', 'bril', 'Bril'), 0, 'bril kost 10, 30 gereserveerd');

\echo '4. Wie niet leest betaalt de helft'
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'pim', 30, 'test', 'correctie', now());
set role authenticated;
select pg_temp.gelijk(public.kopen(:'pim', 'extra', 'toverstaf'), 17, 'toverstaf 25 wordt 13');
select public.figuurtje_bewaren(:'pim', pg_temp.fig('extra', 'toverstaf'));
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig('extra', 'cape')), 'nog niet gekocht');

\echo '4b. Spelletjes koop je ook'
select pg_temp.gelijk(public.kopen(:'pim', 'spel', 'racen', 'Racen'), 7, 'racen 20 wordt 10');
select pg_temp.gelijk(public.kopen(:'pim', 'spel', 'memory'), 7, 'memory is gratis');
select pg_temp.fout(format('select public.kopen(%L, ''spel'', ''schaken'')', :'pim'), 'onbekend stuk');
select pg_temp.gelijk((select string_agg(sleutel, ',') from public.aankopen where kind_id = :'pim' and soort = 'spel'), 'racen', 'gekocht spel');

\echo '5. Alles vrij: alleen een ouder zet het aan'
update public.gebruikers set figuurtje_alles_vrij = true where id = :'pim';
select pg_temp.gelijk((select figuurtje_alles_vrij from public.gebruikers where id = :'pim'), false, 'tablet mag niet');
select pg_temp.fout(format('update public.gebruikers set figuurtje = %L where id = %L', pg_temp.fig(), :'lex'), 'permission denied');
select pg_temp.als('00000000-0000-0000-0000-000000000301', false);
update public.gebruikers set figuurtje_alles_vrij = true where id = :'pim';
select public.figuurtje_bewaren(:'pim', pg_temp.fig('extra', 'cape'));

\echo '6. Terugzetten met null'
select public.figuurtje_bewaren(:'lex', null);
select pg_temp.gelijk((select figuurtje from public.gebruikers where id = :'lex'), null::jsonb, 'teruggezet');

\echo '6b. Soorten figuurtjes: kind zonder soort of met soort, de rest pas na vrijgave'
select public.figuurtje_bewaren(:'pim', pg_temp.fig('soort', 'kind'));
select pg_temp.gelijk((select figuurtje ->> 'soort' from public.gebruikers where id = :'pim'), 'kind', 'soort bewaard');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig('soort', 'robot')), 'nog niet in de winkel');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig('soort', 'spook')), 'onbekend stuk');
select pg_temp.gelijk((select string_agg(sleutel || ':' || prijs, ',' order by sleutel) from public.figuurtje_stukken where soort = 'soort'),
                      'astronaut:50,draak:60,kat:30,kind:0,ridder:40,robot:40', 'soorten in de catalogus');

\echo '7. Andere gezinnen zien niets'
reset role;
insert into auth.users values ('00000000-0000-0000-0000-000000000303');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-000000000303', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Bo"}]');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig()), 'kind niet gevonden');
select pg_temp.gelijk((select count(*) from public.kind_verdiend where kind_id = :'lex'), 0::bigint, 'view afgeschermd');
select pg_temp.gelijk((select count(*) from public.aankopen), 0::bigint, 'aankopen afgeschermd');
select pg_temp.fout(format('select public.kopen(%L, ''spel'', ''racen'')', :'pim'), 'kind niet gevonden');
select pg_temp.gelijk((select count(*) >= 9 from public.spel_prijzen), true, 'prijzen leesbaar');
select pg_temp.gelijk((select count(*) > 60 from public.figuurtje_stukken), true, 'catalogus leesbaar');

reset role;
\echo 'Alle figuurtjetests geslaagd.'
