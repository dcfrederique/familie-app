-- Tests voor het automatisch versturen van meldingen (trigger + pg_net). Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

-- Nep-pg_net: bewaart de aanroepen in plaats van ze te versturen.
create schema net;
create table net.aanroepen (url text, body jsonb, headers jsonb);
create function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
returns bigint language sql as $$ insert into net.aanroepen values (url, body, headers) returning 1::bigint $$;

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000006a1', 'Trigger');
insert into public.gebruikers (id, gezin_id, naam, rol) values ('00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006a1', 'Kim', 'kind');
insert into public.taken (id, gezin_id, titel, sterren) values ('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006a1', 'Tafel dekken', 5);

-- Zonder adres gebeurt er niets, en het opslaan lukt gewoon.
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date);
do $$ begin
  if (select count(*) from net.aanroepen) <> 0 then raise exception 'zonder adres mag er niets verstuurd worden'; end if;
end $$;

-- Met adres gaat er een aanroep met het geheim in de header.
update public.melding_instellingen set functie_url = 'https://voorbeeld.test/functions/v1/melding';
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag, status)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date + 1, 'ingediend');
do $$
declare a net.aanroepen;
begin
  select * into a from net.aanroepen;
  if a.url <> 'https://voorbeeld.test/functions/v1/melding' then raise exception 'verkeerd adres: %', a.url; end if;
  if a.body->>'table' <> 'inzendingen' or a.body->'record'->>'id' is null then raise exception 'verkeerde inhoud: %', a.body; end if;
  if a.headers->>'x-melding-geheim' <> (select geheim from public.melding_instellingen) then raise exception 'geheim ontbreekt'; end if;
end $$;

-- Een kapotte pg_net mag het opslaan nooit tegenhouden.
create or replace function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
returns bigint language plpgsql as $$ begin raise exception 'stuk'; end $$;
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date + 2);
drop schema net cascade;
\echo meldingen_trigger: ok
