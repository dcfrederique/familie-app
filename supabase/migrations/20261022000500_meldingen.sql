-- Meldingen naar de gsm van de ouders (web-push).
-- Een ouder-gsm bewaart zijn abonnement; de Edge Function "melding" stuurt bij elke nieuwe
-- inzending, tijdaanvraag of activiteit met sterren een melding naar alle ouders van het gezin.

create table public.push_abonnementen (
  endpoint text primary key,
  user_id uuid not null references auth.users on delete cascade,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  p256dh text not null,
  auth text not null,
  aangemaakt timestamptz not null default now()
);
create index on public.push_abonnementen (gezin_id);
alter table public.push_abonnementen enable row level security;
revoke all on public.push_abonnementen from anon, authenticated;

-- Alleen een ouder-account kan meldingen aanzetten; een tablet niet.
create function public.push_abonneren(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_account public.accounts;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found or v_account.soort <> 'ouder' then raise exception 'alleen voor ouders'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'ongeldig abonnement';
  end if;
  insert into public.push_abonnementen (endpoint, user_id, gezin_id, p256dh, auth)
  values (p_endpoint, auth.uid(), v_account.gezin_id, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, gezin_id = excluded.gezin_id,
    p256dh = excluded.p256dh, auth = excluded.auth, aangemaakt = now();
end $$;

create function public.push_afmelden(p_endpoint text) returns void
language sql security definer set search_path = '' as $$
  delete from public.push_abonnementen where endpoint = p_endpoint and user_id = auth.uid();
$$;

-- Tekst van een melding; null als er niets te melden valt (bv. een spelletje zonder sterren).
create function public.melding_tekst(p_tabel text, p_id uuid) returns table (gezin_id uuid, titel text, tekst text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_tabel = 'inzendingen' then
    return query select i.gezin_id, k.naam || ' is klaar met een taak', t.titel || ': ' || t.sterren || ' sterren goedkeuren?'
      from public.inzendingen i join public.gebruikers k on k.id = i.kind_id join public.taken t on t.id = i.taak_id
      where i.id = p_id and i.status = 'ingediend';
  elsif p_tabel = 'tijdverzoeken' then
    return query select v.gezin_id, k.naam || ' vraagt extra tijd', v.minuten || ' minuten voor ' || v.sterren || ' sterren'
      from public.tijdverzoeken v join public.gebruikers k on k.id = v.kind_id
      where v.id = p_id and v.status = 'aangevraagd';
  elsif p_tabel = 'activiteitlog' then
    return query select a.gezin_id, k.naam || ' verdiende sterren',
        public.activiteit_omschrijving(a.activiteit, a.inhoud) || ': ' || a.sterren || ' sterren goedkeuren?'
      from public.activiteitlog a join public.gebruikers k on k.id = a.kind_id
      where a.id = p_id and a.status = 'ingediend' and a.sterren > 0;
  end if;
end $$;

-- Na een melding die niet meer aankomt (gsm gewist, toestemming ingetrokken) ruimt de functie op.
create function public.push_vervallen(p_endpoint text) returns void
language sql security definer set search_path = '' as $$
  delete from public.push_abonnementen where endpoint = p_endpoint;
$$;

create function public.push_abonnementen_voor(p_gezin uuid) returns setof public.push_abonnementen
language sql stable security definer set search_path = '' as $$
  select * from public.push_abonnementen where gezin_id = p_gezin;
$$;

revoke execute on function public.push_abonneren(text, text, text), public.push_afmelden(text),
  public.melding_tekst(text, uuid), public.push_vervallen(text), public.push_abonnementen_voor(uuid) from public, anon, authenticated;
grant execute on function public.push_abonneren(text, text, text), public.push_afmelden(text) to authenticated;
grant execute on function public.melding_tekst(text, uuid), public.push_vervallen(text), public.push_abonnementen_voor(uuid) to service_role;
