-- Tests voor het dagelijks hoera: nieuw vrijgegeven spelletjes en het cadeautje. Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

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

insert into auth.users values ('00000000-0000-0000-0000-0000000001f1');
select set_config('app.nu', '2026-10-25 08:00+02', false);
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000001f1', false);
select public.gezin_aanmaken('Hoera', 'Ouder', '[{"naam": "Lex"}, {"naam": "Pim", "kan_lezen": false}]') as gezin \gset
select id as lex from public.gebruikers where naam = 'Lex' \gset
select id as pim from public.gebruikers where naam = 'Pim' \gset

\echo '1. Zonder vrijgegeven spelletjes: geen nieuw, wel een cadeau (alleen uit wat vrij ligt)'
select public.dagelijks_hoera(:'lex') as h \gset
select pg_temp.gelijk(:'h'::jsonb -> 'nieuw', '[]'::jsonb, 'geen nieuwe spelletjes');
select pg_temp.gelijk(jsonb_typeof(:'h'::jsonb -> 'cadeau'), 'object', 'er is een cadeau');
select :'h'::jsonb -> 'cadeau' ->> 'soort' as soort, :'h'::jsonb -> 'cadeau' ->> 'sleutel' as sleutel \gset
select pg_temp.gelijk((select prijs from public.aankopen where kind_id = :'lex' and soort = :'soort' and sleutel = :'sleutel'), 0, 'gratis aankoop');
select pg_temp.gelijk(public.in_aanbod(:'lex', :'soort', :'sleutel'), true, 'cadeau lag in de winkel');

\echo '2. Dezelfde dag nog eens: niets meer'
select pg_temp.gelijk(public.dagelijks_hoera(:'lex') is null, true, 'maar één keer per dag');

\echo '3. Volgende dag: het vrijgegeven spelletje wordt gemeld, eenmalig'
reset role;
select set_config('app.nu', '2026-10-26 07:00+02', false);
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (:'gezin', 'spel', 'pompoen', true);
update public.aanbod set prijs = 30 where soort = 'spel' and sleutel = 'pompoen';
select pg_temp.gelijk((select vrijgegeven_op from public.aanbod where sleutel = 'pompoen'), '2026-10-26 07:00+02'::timestamptz, 'tijdstip van vrijgave');
set role authenticated;
select public.dagelijks_hoera(:'lex') as h \gset
select pg_temp.gelijk(:'h'::jsonb -> 'nieuw', '["pompoen"]'::jsonb, 'pompoen gemeld');
reset role;
select set_config('app.nu', '2026-10-27 07:00+02', false);
update public.aanbod set prijs = 35 where soort = 'spel' and sleutel = 'pompoen';
set role authenticated;
select pg_temp.gelijk(public.dagelijks_hoera(:'lex') -> 'nieuw', '[]'::jsonb, 'prijswijziging is geen nieuwe vrijgave');

\echo '4. Verborgen of al gekocht: niet gemeld; kandidaten beperken het cadeau'
reset role;
select set_config('app.nu', '2026-10-28 07:00+02', false);
insert into public.aanbod (gezin_id, soort, sleutel, vrijgegeven) values (:'gezin', 'spel', 'basket', true);
insert into public.aanbod_verborgen (gezin_id, kind_id, soort, sleutel) values (:'gezin', :'lex', 'spel', 'basket');
set role authenticated;
select pg_temp.gelijk(public.dagelijks_hoera(:'lex') -> 'nieuw', '[]'::jsonb, 'verborgen spelletje niet gemeld');
select public.dagelijks_hoera(:'pim', array['hoofd:kroon']) as h \gset
select pg_temp.gelijk(:'h'::jsonb -> 'cadeau' ->> 'sleutel', 'kroon', 'cadeau uit de kandidaten');

\echo '5. Een stuk dat dicht ligt, wordt nooit cadeau'
reset role;
select set_config('app.nu', '2026-10-29 07:00+02', false);
set role authenticated;
select pg_temp.gelijk(coalesce(public.dagelijks_hoera(:'pim', array['hoofd:heksenhoed']) -> 'cadeau', 'null'::jsonb), 'null'::jsonb, 'dicht stuk geen cadeau');

\echo 'dagelijks hoera: ok'
