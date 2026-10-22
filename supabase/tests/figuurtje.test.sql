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
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'kroon')), 'nog niet vrijgespeeld');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'tovenaarshoed')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('shirtKleur', 'goud')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('haarKleur', 'jeans')), 'onbekend stuk');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() - 'extra'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() || '{"x": "y"}'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig() || '{"extra": 5}'), 'ongeldig figuurtje');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'ouder', pg_temp.fig()), 'kind niet gevonden');

\echo '3. Ooit verdiende sterren spelen stukken vrij; uitgeven telt niet af'
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'lex', 160, 'test', 'correctie', now()), (:'gezin', :'lex', -60, 'Extra tijd', 'tijdverzoek', now());
set role authenticated;
select pg_temp.gelijk(public.verdiend_totaal(:'lex'), 160, 'verdiend');
select pg_temp.gelijk(public.saldo(:'lex'), 100, 'saldo blijft');
select pg_temp.gelijk((select verdiend from public.kind_verdiend where kind_id = :'lex'), 160, 'view');
select public.figuurtje_bewaren(:'lex', pg_temp.fig('hoofd', 'helm'));
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lex', pg_temp.fig('hoofd', 'kroon')), 'nog niet vrijgespeeld');
select pg_temp.gelijk(public.saldo(:'lex'), 100, 'vrijspelen kost geen sterren');

\echo '4. Wie niet leest heeft een vijfde van de drempel nodig'
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'pim', 30, 'test', 'correctie', now());
set role authenticated;
select public.figuurtje_bewaren(:'pim', pg_temp.fig('extra', 'toverstaf'));
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig('extra', 'cape')), 'nog niet vrijgespeeld');

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

\echo '7. Andere gezinnen zien niets'
reset role;
insert into auth.users values ('00000000-0000-0000-0000-000000000303');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-000000000303', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Bo"}]');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'pim', pg_temp.fig()), 'kind niet gevonden');
select pg_temp.gelijk((select count(*) from public.kind_verdiend where kind_id = :'lex'), 0::bigint, 'view afgeschermd');
select pg_temp.gelijk((select count(*) > 60 from public.figuurtje_stukken), true, 'catalogus leesbaar');

reset role;
\echo 'Alle figuurtjetests geslaagd.'
