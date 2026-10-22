-- Tests voor gezin aanmaken, koppelcodes en pincode. Draaien met scripts/test-db.sh.
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

-- Logins: mama (e-mail), papa (e-mail), tablet (anoniem), indringer (anoniem)
insert into auth.users values
  ('00000000-0000-0000-0000-000000000101'), ('00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000103'), ('00000000-0000-0000-0000-000000000104');

create function pg_temp.als(p_user text, p_anoniem boolean) returns void language sql as $$
  select set_config('request.jwt.claim.sub', p_user, false),
         set_config('request.jwt.claims', json_build_object('is_anonymous', p_anoniem)::text, false);
$$;

select set_config('app.nu', '2026-10-21 16:00+02', false);
set role authenticated;

\echo '1. Gezin aanmaken'
select pg_temp.als('00000000-0000-0000-0000-000000000103', true);
select pg_temp.fout($$select public.gezin_aanmaken('X', 'Y', '[{"naam":"Z"}]')$$, 'eerst aanmelden met e-mail');

select pg_temp.als('00000000-0000-0000-0000-000000000101', false);
select pg_temp.fout($$select public.gezin_aanmaken('Thuis', 'Mama', '[]')$$, 'minstens één kind');
select public.gezin_aanmaken('Thuis', 'Mama', $$[
  {"naam": "Luca", "kan_lezen": true, "vraagt_zelf_tijd": true},
  {"naam": "Yuna"},
  {"naam": "Feline", "kan_lezen": false, "vraagt_zelf_tijd": false}
]$$, 'Papa') as gezin \gset
select pg_temp.fout($$select public.gezin_aanmaken('Nog een', 'Mama', '[{"naam":"Z"}]')$$, 'hoort al bij een gezin');
select pg_temp.gelijk((select string_agg(naam || ':' || rol || ':' || coalesce(thema, '-'), ',' order by volgorde)
                       from public.gebruikers),
                      'Mama:ouder:-,Papa:ouder:-,Luca:kind:blauw,Yuna:kind:oranje,Feline:kind:groen', 'profielen');
select pg_temp.gelijk((select vraagt_zelf_tijd from public.gebruikers where naam = 'Feline'), false, 'Feline');
select pg_temp.gelijk(public.is_ouder_account(), true, 'mama is ouder');

\echo '2. Pincode'
select pg_temp.gelijk(public.heeft_pin(), false, 'nog geen pin');
select pg_temp.fout($$select public.pin_instellen('12')$$, '4 tot 6 cijfers');
select public.pin_instellen('2468');
select pg_temp.gelijk(public.heeft_pin(), true, 'pin ingesteld');

\echo '3. Tablet koppelen'
select public.koppelcode_maken('tablet') as tabletcode \gset
select pg_temp.gelijk(length(:'tabletcode'), 8, 'code van 8 tekens');
select pg_temp.als('00000000-0000-0000-0000-000000000103', true);
select pg_temp.fout($$select public.koppelcode_maken('tablet')$$, 'alleen vanaf een ouder-account');
select pg_temp.fout($$select public.koppelen('ONBESTAAN')$$, 'ongeldig of verlopen');
select pg_temp.gelijk(public.koppelen(lower(:'tabletcode')), 'tablet', 'tablet gekoppeld (hoofdletters maken niet uit)');
select pg_temp.gelijk((select count(*) from public.gebruikers where rol = 'kind'), 3::bigint, 'tablet ziet de kinderen');
select pg_temp.gelijk(public.is_ouder_account(), false, 'tablet is geen ouder');
select pg_temp.gelijk(public.pin_controleren('0000'), false, 'foute pin');
select pg_temp.gelijk(public.pin_controleren('2468'), true, 'juiste pin');
select pg_temp.fout($$select public.pin_instellen('1111')$$, 'alleen vanaf een ouder-account');

-- Een code werkt maar één keer.
select pg_temp.als('00000000-0000-0000-0000-000000000104', true);
select pg_temp.fout(format('select public.koppelen(%L)', :'tabletcode'), 'ongeldig of verlopen');

\echo '4. Tweede ouder koppelen'
select pg_temp.als('00000000-0000-0000-0000-000000000101', false);
select id as papa from public.gebruikers where naam = 'Papa' \gset
select public.koppelcode_maken('ouder', :'papa') as oudercode \gset
select pg_temp.fout($$select public.koppelcode_maken('ouder', '00000000-0000-0000-0000-000000000999')$$, 'ouder niet gevonden');
-- Een anonieme login kan geen ouder worden.
select pg_temp.als('00000000-0000-0000-0000-000000000104', true);
select pg_temp.fout(format('select public.koppelen(%L)', :'oudercode'), 'eerst aanmelden met e-mail');
select pg_temp.als('00000000-0000-0000-0000-000000000102', false);
select pg_temp.gelijk(public.koppelen(:'oudercode'), 'ouder', 'papa gekoppeld');
select pg_temp.gelijk(public.is_ouder_account(), true, 'papa is ouder');
select pg_temp.gelijk((select ouder_id from public.accounts), :'papa'::uuid, 'papa-profiel');

\echo '5. Verlopen code'
select pg_temp.als('00000000-0000-0000-0000-000000000101', false);
select public.koppelcode_maken('tablet') as oudecode \gset
select set_config('app.nu', '2026-10-21 16:31+02', false);
select pg_temp.als('00000000-0000-0000-0000-000000000104', true);
select pg_temp.fout(format('select public.koppelen(%L)', :'oudecode'), 'ongeldig of verlopen');

\echo '6. Koppelcodes zijn niet leesbaar'
select pg_temp.fout('select * from public.koppelcodes', 'permission denied');

reset role;
\echo 'Alle koppeltests geslaagd.'
