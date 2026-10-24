-- Testpagina voor meldingen: een ouder stuurt een melding naar de gsm('s) van een gekozen ouder.
-- Gaat langs dezelfde weg als de echte meldingen (pg_net -> Edge Function "melding"), dus een gelukte test
-- bewijst dat de hele keten werkt.

-- Welke ouders van het gezin zijn er, en op hoeveel gsm's staan hun meldingen aan?
create function public.melding_ontvangers() returns table (ouder_id uuid, naam text, gsms int)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_account public.accounts;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found or v_account.soort <> 'ouder' then raise exception 'alleen voor ouders'; end if;
  return query
    select g.id, g.naam, (select count(*)::int from public.push_abonnementen p
                            join public.accounts a on a.user_id = p.user_id where a.ouder_id = g.id)
      from public.gebruikers g
      where g.gezin_id = v_account.gezin_id and g.rol = 'ouder'
      order by g.naam;
end $$;

-- De gsm's van één ouder (voor de Edge Function bij een testmelding).
create function public.push_abonnementen_ouder(p_ouder uuid) returns setof public.push_abonnementen
language sql stable security definer set search_path = '' as $$
  select p.* from public.push_abonnementen p join public.accounts a on a.user_id = p.user_id
  where a.ouder_id = p_ouder;
$$;

-- Stuurt de testmelding; geeft het aantal gsm's terug waar ze naartoe gaat (0 = die ouder heeft meldingen niet aan).
create function public.melding_testen(p_ouder uuid, p_titel text, p_tekst text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_account public.accounts;
  v_instellingen public.melding_instellingen;
  v_aantal int;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found or v_account.soort <> 'ouder' then raise exception 'alleen voor ouders'; end if;
  if not exists (select 1 from public.gebruikers where id = p_ouder and gezin_id = v_account.gezin_id and rol = 'ouder') then
    raise exception 'onbekende ouder';
  end if;
  p_titel := left(coalesce(nullif(trim(p_titel), ''), 'Testmelding'), 80);
  p_tekst := left(coalesce(p_tekst, ''), 200);

  select count(*)::int into v_aantal from public.push_abonnementen p
    join public.accounts a on a.user_id = p.user_id where a.ouder_id = p_ouder;
  if v_aantal = 0 then return 0; end if;

  select * into v_instellingen from public.melding_instellingen;
  if v_instellingen.functie_url is null or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'meldingen zijn nog niet ingesteld op de server';
  end if;
  execute 'select net.http_post($1, $2, ''{}''::jsonb, $3, 5000)'
    using v_instellingen.functie_url,
      jsonb_build_object('type', 'TEST', 'ouder_id', p_ouder, 'titel', p_titel, 'tekst', p_tekst),
      jsonb_build_object('content-type', 'application/json', 'x-melding-geheim', v_instellingen.geheim);
  return v_aantal;
end $$;

revoke execute on function public.melding_ontvangers(), public.push_abonnementen_ouder(uuid),
  public.melding_testen(uuid, text, text) from public, anon, authenticated;
grant execute on function public.melding_ontvangers(), public.melding_testen(uuid, text, text) to authenticated;
grant execute on function public.push_abonnementen_ouder(uuid) to service_role;
