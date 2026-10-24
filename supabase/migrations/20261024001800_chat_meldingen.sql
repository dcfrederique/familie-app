-- Chat, vervolg (docs/chat.md): meldingen ook naar de tablet van het kind bij een antwoord van mama of papa,
-- geen melding voor wie het gesprek op dat moment open heeft, en een eigen figuurtje voor de ouders.

-- Ook een tablet kan meldingen aanzetten (voor de antwoorden in de chat); de abonnementen van tablets
-- gaan nooit mee met de meldingen voor goedkeuren, daarom filtert push_abonnementen_voor nu op ouder-accounts.
create or replace function public.push_abonneren(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_account public.accounts;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found then raise exception 'niet aangemeld'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'ongeldig abonnement';
  end if;
  insert into public.push_abonnementen (endpoint, user_id, gezin_id, p256dh, auth)
  values (p_endpoint, auth.uid(), v_account.gezin_id, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, gezin_id = excluded.gezin_id,
    p256dh = excluded.p256dh, auth = excluded.auth, aangemaakt = now();
end $$;

create or replace function public.push_abonnementen_voor(p_gezin uuid) returns setof public.push_abonnementen
language sql stable security definer set search_path = '' as $$
  select p.* from public.push_abonnementen p join public.accounts a on a.user_id = p.user_id
  where p.gezin_id = p_gezin and a.soort = 'ouder'
$$;

-- Wie heeft welk gesprek open? Het scherm meldt zich elke 20 seconden; 45 seconden stilte = weg.
create table public.chat_aanwezig (
  user_id uuid not null references auth.users on delete cascade,
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  laatst timestamptz not null default now(),
  primary key (user_id, kind_id)
);
alter table public.chat_aanwezig enable row level security;
revoke all on public.chat_aanwezig from anon, authenticated;

create function public.chat_aanwezig(p_kind uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.chat_toegang(p_kind);
  insert into public.chat_aanwezig (user_id, kind_id, laatst) values (auth.uid(), p_kind, now())
  on conflict (user_id, kind_id) do update set laatst = now();
end $$;

-- Naar welke toestellen gaat de melding voor dit bericht? Een bericht van het kind naar de gsm's van de ouders,
-- een antwoord naar de tablet van het kind; telkens zonder wie het gesprek nu open heeft.
create function public.chat_push(p_bericht uuid)
returns table (endpoint text, p256dh text, auth text, titel text, tekst text, url text, tag text)
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.berichten;
  k public.gebruikers;
  v_ouder text;
begin
  select * into b from public.berichten where id = p_bericht;
  if not found then return; end if;
  select * into k from public.gebruikers where id = b.kind_id;
  if b.van = 'kind' then
    return query
      select p.endpoint, p.p256dh, p.auth, k.naam || ' stuurt een bericht', left(b.tekst, 140),
             '/ouder/chat?kind=' || k.id::text, 'chat-' || k.id::text
        from public.push_abonnementen p join public.accounts a on a.user_id = p.user_id
        where p.gezin_id = b.gezin_id and a.soort = 'ouder'
          and not exists (select 1 from public.chat_aanwezig z
                          where z.user_id = p.user_id and z.kind_id = b.kind_id and z.laatst > now() - interval '45 seconds');
  else
    select g.naam into v_ouder from public.gebruikers g where g.id = b.ouder_id;
    return query
      select p.endpoint, p.p256dh, p.auth, coalesce(v_ouder, 'Mama of papa') || ' schreef je', left(b.tekst, 140),
             '/kind/' || k.id::text || '/chat', 'chat'
        from public.push_abonnementen p join public.accounts a on a.user_id = p.user_id
        where a.soort = 'tablet' and a.kind_id = b.kind_id
          and not exists (select 1 from public.chat_aanwezig z
                          where z.user_id = p.user_id and z.kind_id = b.kind_id and z.laatst > now() - interval '45 seconds');
  end if;
end $$;

drop trigger melding_versturen on public.berichten;
create trigger melding_versturen after insert on public.berichten
  for each row execute function public.melding_versturen();

-- Figuurtje van een ouder: vrij te kiezen, alleen voor jezelf (alles is vrij, er zijn geen sterren aan verbonden).
create function public.ouder_figuurtje_bewaren(p_figuurtje jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.mijn_ouder();
  v_veld record;
  v_sleutel text;
begin
  if v_ouder is null then raise exception 'alleen voor ouders'; end if;
  if p_figuurtje is null then
    update public.gebruikers set figuurtje = null where id = v_ouder;
    return;
  end if;
  if jsonb_typeof(p_figuurtje) is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_figuurtje)) <> 12 then
    raise exception 'ongeldig figuurtje';
  end if;
  for v_veld in
    select * from (values ('huid', 'huid'), ('gezicht', 'gezicht'), ('haar', 'haar'), ('hoofd', 'hoofd'),
                          ('shirt', 'shirt'), ('broek', 'broek'), ('schoenen', 'schoenen'), ('extra', 'extra'),
                          ('haarKleur', 'haarkleur'), ('shirtKleur', 'kleur'), ('broekKleur', 'kleur'),
                          ('schoenKleur', 'kleur')) as t(veld, soort)
  loop
    if jsonb_typeof(p_figuurtje -> v_veld.veld) is distinct from 'string' then
      raise exception 'ongeldig figuurtje';
    end if;
    v_sleutel := p_figuurtje ->> v_veld.veld;
    if not exists (select 1 from public.figuurtje_stukken where soort = v_veld.soort and sleutel = v_sleutel) then
      raise exception 'onbekend stuk: %', v_veld.veld;
    end if;
  end loop;
  update public.gebruikers set figuurtje = p_figuurtje where id = v_ouder;
end $$;

revoke execute on function public.chat_aanwezig(uuid), public.chat_push(uuid), public.ouder_figuurtje_bewaren(jsonb)
  from public, anon, authenticated;
grant execute on function public.chat_aanwezig(uuid), public.ouder_figuurtje_bewaren(jsonb) to authenticated;
grant execute on function public.chat_push(uuid) to service_role;
