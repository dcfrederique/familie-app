-- Chat van de kinderen naar de ouders (docs/chat.md, gevraagd door Frederique op 24 oktober 2026).
-- Per kind stellen de ouders in of het berichten mag sturen (standaard uit). Een bericht van een kind
-- geeft een melding op de gsm's van de ouders; de ouders antwoorden in Wij → Chat. Kinderen die niet lezen
-- sturen een sticker ("Ik heb honger"); die komt als gewone tekst aan bij de ouders.

alter table public.gebruikers add column chat_aan boolean not null default false;
grant update (chat_aan) on public.gebruikers to authenticated;

create table public.berichten (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  -- Het gesprek hoort bij een kind; de ouders van het gezin delen het.
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  van text not null check (van in ('kind', 'ouder')),
  -- Welke ouder schreef; null bij een bericht van het kind.
  ouder_id uuid references public.gebruikers (id) on delete set null,
  tekst text not null default '' check (length(tekst) <= 500),
  -- Sleutel van een sticker (de app kent de prentjes); null = gewoon bericht.
  sticker text check (sticker ~ '^[a-z_]{1,20}$'),
  -- Wanneer de ontvanger het zag.
  gelezen_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  check (length(btrim(tekst)) > 0 or sticker is not null)
);
create index berichten_kind on public.berichten (kind_id, aangemaakt_op);

-- Geen rechtstreekse toegang: alles loopt via de functies hieronder, zodat een tablet enkel het eigen
-- gesprek ziet en niet kan meelezen met dat van een broer of zus.
alter table public.berichten enable row level security;
revoke all on public.berichten from anon, authenticated;

-- Welk kind mag deze aanroeper in het gesprek zien? Een ouder: elk kind van het gezin.
-- Een tablet: het eigen kind (een tablet waarop nog niemand koos: elk kind van het gezin, zoals elders).
create function public.chat_toegang(p_kind uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_account public.accounts;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found then raise exception 'niet aangemeld'; end if;
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_account.gezin_id and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;
  if v_account.soort = 'ouder' then return 'ouder'; end if;
  if v_account.kind_id is not null and v_account.kind_id <> p_kind then
    raise exception 'deze tablet hoort bij een ander kind';
  end if;
  return 'kind';
end $$;

-- De laatste 100 berichten van een gesprek, oudste eerst.
create function public.chat_berichten(p_kind uuid) returns setof public.berichten
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.chat_toegang(p_kind);
  return query select * from (
    select * from public.berichten where kind_id = p_kind order by aangemaakt_op desc limit 100
  ) laatste order by aangemaakt_op;
end $$;

create function public.chat_sturen(p_kind uuid, p_tekst text, p_sticker text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kant text := public.chat_toegang(p_kind);
  v_kind public.gebruikers;
  v_tekst text := left(btrim(coalesce(p_tekst, '')), 500);
begin
  select * into v_kind from public.gebruikers where id = p_kind;
  if v_tekst = '' and p_sticker is null then raise exception 'leeg bericht'; end if;
  if v_kant = 'kind' then
    if not v_kind.chat_aan then raise exception 'chat staat uit'; end if;
    -- Een kind dat blijft tikken, vult de gsm van de ouders niet.
    if (select count(*) from public.berichten
        where kind_id = p_kind and van = 'kind' and aangemaakt_op > now() - interval '10 minutes') >= 30 then
      raise exception 'te veel berichten';
    end if;
    insert into public.berichten (gezin_id, kind_id, van, tekst, sticker)
    values (v_kind.gezin_id, p_kind, 'kind', v_tekst, p_sticker);
  else
    insert into public.berichten (gezin_id, kind_id, van, ouder_id, tekst, sticker)
    values (v_kind.gezin_id, p_kind, 'ouder', public.mijn_ouder(), v_tekst, p_sticker);
  end if;
end $$;

-- Het gesprek is geopend: wat de ander schreef, is gelezen.
create function public.chat_gelezen(p_kind uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kant text := public.chat_toegang(p_kind);
begin
  update public.berichten set gelezen_op = now()
  where kind_id = p_kind and gelezen_op is null and van <> v_kant;
end $$;

-- Per kind: hoeveel ongelezen berichten en wat het laatste was. Een ouder ziet alle kinderen,
-- een tablet enkel het eigen kind.
create function public.chat_overzicht() returns table (kind_id uuid, ongelezen int, laatste_op timestamptz, laatste_van text, laatste_tekst text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_account public.accounts;
  v_kant text;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found then raise exception 'niet aangemeld'; end if;
  v_kant := case when v_account.soort = 'ouder' then 'ouder' else 'kind' end;
  return query
    select g.id,
           (select count(*)::int from public.berichten b where b.kind_id = g.id and b.gelezen_op is null and b.van <> v_kant),
           l.aangemaakt_op, l.van, l.tekst
      from public.gebruikers g
      left join lateral (select * from public.berichten b where b.kind_id = g.id order by b.aangemaakt_op desc limit 1) l on true
      where g.gezin_id = v_account.gezin_id and g.rol = 'kind'
        and (v_kant = 'ouder' or v_account.kind_id is null or g.id = v_account.kind_id);
end $$;

-- Tekst van een melding, nu ook voor een bericht van een kind.
create or replace function public.melding_tekst(p_tabel text, p_id uuid) returns table (gezin_id uuid, titel text, tekst text)
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
  elsif p_tabel = 'berichten' then
    return query select b.gezin_id, k.naam || ' stuurt een bericht', left(b.tekst, 140)
      from public.berichten b join public.gebruikers k on k.id = b.kind_id
      where b.id = p_id and b.van = 'kind';
  end if;
end $$;

create trigger melding_versturen after insert on public.berichten
  for each row when (new.van = 'kind') execute function public.melding_versturen();

revoke execute on function public.chat_toegang(uuid), public.chat_berichten(uuid), public.chat_sturen(uuid, text, text),
  public.chat_gelezen(uuid), public.chat_overzicht() from public, anon, authenticated;
grant execute on function public.chat_berichten(uuid), public.chat_sturen(uuid, text, text),
  public.chat_gelezen(uuid), public.chat_overzicht() to authenticated;
