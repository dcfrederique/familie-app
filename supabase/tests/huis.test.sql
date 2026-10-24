-- Tests voor Mijn huis: kopen, bewaren en het winkelaanbod. Draaien met scripts/test-db.sh.
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

create function pg_temp.huis(wijziging jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('model', 'hutje', 'dak', 'punt', 'dakKleur', 'rood', 'muur', 'effen', 'muurKleur', 'room',
    'deur', 'gewoon', 'deurKleur', 'blauw', 'ramen', 'vierkant', 'tuin', '["boom", "bloemen"]'::jsonb,
    'extra', '["schoorsteen"]'::jsonb) || wijziging
$$;

insert into auth.users values ('00000000-0000-0000-0000-0000000001e1'), ('00000000-0000-0000-0000-0000000001e2');
select set_config('app.nu', '2026-10-24 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-0000000001e1', false);
select public.gezin_aanmaken('Huis', 'Ouder', '[{"naam": "Lex"}, {"naam": "Pim", "kan_lezen": false}]') as gezin \gset
select id as lex from public.gebruikers where naam = 'Lex' \gset
select id as pim from public.gebruikers where naam = 'Pim' \gset
select public.koppelcode_maken('tablet') as code \gset
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values (:'gezin', :'lex', 100, 'test', 'correctie', now()), (:'gezin', :'pim', 100, 'test', 'correctie', now());
set role authenticated;

\echo '1. Het hutje met gratis stukken mag meteen'
select public.huis_bewaren(:'lex', pg_temp.huis());
select pg_temp.gelijk((select huis ->> 'model' from public.gebruikers where id = :'lex'), 'hutje', 'hutje bewaard');

\echo '2. Nieuw aanbod: het huis ligt pas in de winkel na vrijgave'
select pg_temp.gelijk(public.in_aanbod(:'lex', 'huis', 'verdieping'), false, 'verdieping nog dicht');
select pg_temp.fout(format('select public.kopen(%L, ''huis'', ''verdieping'')', :'lex'), 'nog niet in de winkel');
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven)
select :'gezin', soort, sleutel, true from public.huis_stukken where prijs > 0 and soort not like '%kleur';

\echo '3. Kopen: de sterren gaan van het saldo, wie niet leest betaalt de helft'
select pg_temp.gelijk(public.kopen(:'lex', 'huis', 'verdieping', 'Verdieping'), 50, 'verdieping kost 50');
select pg_temp.gelijk(public.kopen(:'pim', 'huis', 'verdieping', 'Verdieping'), 75, 'Pim betaalt 25');
select pg_temp.gelijk(public.kopen(:'lex', 'huis', 'verdieping', 'Verdieping'), 50, 'twee keer kopen kost niets');
select pg_temp.gelijk(public.kopen(:'lex', 'tuin', 'trampoline', 'Trampoline'), 25, 'trampoline kost 25');
select pg_temp.fout(format('select public.kopen(%L, ''tuin'', ''dino'')', :'lex'), 'niet genoeg sterren');
select pg_temp.fout(format('select public.kopen(%L, ''huisextra'', ''kasteel'')', :'lex'), 'onbekend stuk');

\echo '4. Bewaren: alleen wat gratis of gekocht is'
select public.huis_bewaren(:'lex', pg_temp.huis('{"model": "verdieping", "tuin": ["trampoline", "boom"]}'));
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"model": "toren"}')), 'stuk nog niet gekocht');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"dakKleur": "zwart"}')), 'onbekend stuk');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"tuin": ["boom", "bloemen", "zandbak"]}')), 'ongeldig huis');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"tuin": ["boom", "boom"]}')), 'ongeldig huis');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"extra": ["vlag"]}')), 'stuk nog niet gekocht');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis() - 'ramen'), 'ongeldig huis');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis('{"tuin": "boom"}')), 'ongeldig huis');

\echo '5. Een tablet past alleen het huis van zijn eigen kind aan'
select pg_temp.als('00000000-0000-0000-0000-0000000001e2', true);
select public.koppelen(:'code');
select public.tablet_kiezen(:'pim');
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'lex', pg_temp.huis()), 'ander kind');
select public.huis_bewaren(:'pim', pg_temp.huis('{"model": "verdieping"}'));
select pg_temp.fout(format('update public.gebruikers set huis = null where id = %L', :'pim'), 'permission denied');

\echo '6. Verborgen voor een kind: niet te koop, wel wat al in het huis stond (alles vrij)'
select pg_temp.als('00000000-0000-0000-0000-0000000001e1', false);
insert into public.aanbod_verborgen (gezin_id, kind_id, soort, sleutel) values (:'gezin', :'pim', 'dak', 'rond');
select pg_temp.fout(format('select public.kopen(%L, ''dak'', ''rond'')', :'pim'), 'nog niet in de winkel');
update public.gebruikers set figuurtje_alles_vrij = true where id = :'pim';
select pg_temp.fout(format('select public.huis_bewaren(%L, %L)', :'pim', pg_temp.huis('{"dak": "rond"}')), 'nog niet in de winkel');
select public.huis_bewaren(:'pim', pg_temp.huis('{"model": "toren", "dak": "trap"}'));
select public.huis_bewaren(:'pim', null);
select pg_temp.gelijk((select huis from public.gebruikers where id = :'pim'), null::jsonb, 'terug naar het hutje');

reset role;
\echo 'Mijn huis: alles groen'
