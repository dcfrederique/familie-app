-- Mijn verlanglijstje (docs/verlanglijstje.md): een kind kiest tot 10 wensen (een prentje, een tekening of een korte tekst),
-- maximaal 3 daarvan als allerliefste. Ouder-accounts lezen alles en zetten een status die het kind nooit ziet.
-- Geen sterren, niets in het puntenlog. Een ouder zet het per kind aan (standaard uit).

create table public.verlanglijst_instelling (
  kind_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  aan boolean not null default false
);

create table public.verlanglijst (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  soort text not null check (soort in ('prent', 'tekening', 'tekst')),
  prent text check (prent is null or char_length(prent) <= 30),
  tekst text not null default '' check (char_length(tekst) <= 40),
  tekening jsonb check (tekening is null or octet_length(tekening::text) <= 60000),
  favoriet boolean not null default false,
  status text not null default 'nieuw' check (status in ('nieuw', 'gekocht', 'later', 'liever_niet')),
  aangemaakt timestamptz not null default now(),
  check ((soort = 'prent' and prent is not null) or (soort = 'tekst' and char_length(tekst) > 0) or (soort = 'tekening' and tekening is not null))
);
create index on public.verlanglijst (gezin_id, kind_id, aangemaakt);

-- Ouder zet het verlanglijstje voor een kind aan of uit.
create function public.verlanglijst_instellen(p_kind uuid, p_aan boolean, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  insert into public.verlanglijst_instelling (kind_id, gezin_id, aan) values (p_kind, v_kind.gezin_id, p_aan)
  on conflict (kind_id) do update set aan = excluded.aan;
  return 'ingesteld';
end $$;

-- Het kind voegt een wens toe; de grens van 10 geldt op de server.
create function public.verlanglijst_toevoegen(p_kind uuid, p_soort text, p_prent text, p_tekst text, p_tekening jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
begin
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if not coalesce((select aan from public.verlanglijst_instelling where kind_id = p_kind), false) then
    raise exception 'het verlanglijstje staat uit';
  end if;
  if (select count(*) from public.verlanglijst where kind_id = p_kind) >= 10 then
    raise exception 'je lijstje is vol (10 wensen)';
  end if;
  insert into public.verlanglijst (gezin_id, kind_id, soort, prent, tekst, tekening)
  values (v_kind.gezin_id, p_kind, p_soort,
          case when p_soort = 'prent' then p_prent end,
          case when p_soort = 'tekst' then left(btrim(coalesce(p_tekst, '')), 40) else '' end,
          case when p_soort = 'tekening' then p_tekening end);
end $$;

-- Het kind ziet enkel zijn of haar eigen wensen, nooit de status.
create function public.verlanglijst_van_kind(p_kind uuid)
returns table (id uuid, soort text, prent text, tekst text, tekening jsonb, favoriet boolean, aangemaakt timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform 1 from public.gebruikers where gebruikers.id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  return query select v.id, v.soort, v.prent, v.tekst, v.tekening, v.favoriet, v.aangemaakt from public.verlanglijst v
    where v.kind_id = p_kind order by v.aangemaakt;
end $$;

create function public.verlanglijst_verwijderen(p_kind uuid, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  delete from public.verlanglijst where id = p_id and kind_id = p_kind;
end $$;

-- Allerliefste wensen: hoogstens 3 per kind.
create function public.verlanglijst_favoriet(p_kind uuid, p_id uuid, p_favoriet boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if p_favoriet and (select count(*) from public.verlanglijst where kind_id = p_kind and favoriet and id <> p_id) >= 3 then
    raise exception 'je kan maar 3 allerliefste wensen hebben';
  end if;
  update public.verlanglijst set favoriet = p_favoriet where id = p_id and kind_id = p_kind;
end $$;

-- Een ouder zet de status van een wens (enkel zichtbaar voor ouders).
create function public.verlanglijst_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_ouder_account() then raise exception 'alleen een ouder'; end if;
  if p_status not in ('nieuw', 'gekocht', 'later', 'liever_niet') then raise exception 'onbekende status'; end if;
  update public.verlanglijst set status = p_status where id = p_id and gezin_id = public.mijn_gezin();
end $$;

alter table public.verlanglijst_instelling enable row level security;
alter table public.verlanglijst enable row level security;
create policy "eigen gezin lezen" on public.verlanglijst_instelling for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "ouders lezen de verlanglijstjes" on public.verlanglijst for select to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account());
revoke all on public.verlanglijst_instelling, public.verlanglijst from anon, authenticated;
grant select on public.verlanglijst_instelling, public.verlanglijst to authenticated;

revoke execute on function public.verlanglijst_instellen(uuid, boolean, text), public.verlanglijst_toevoegen(uuid, text, text, text, jsonb),
  public.verlanglijst_van_kind(uuid), public.verlanglijst_verwijderen(uuid, uuid), public.verlanglijst_favoriet(uuid, uuid, boolean),
  public.verlanglijst_status(uuid, text) from public, anon;
grant execute on function public.verlanglijst_instellen(uuid, boolean, text), public.verlanglijst_toevoegen(uuid, text, text, text, jsonb),
  public.verlanglijst_van_kind(uuid), public.verlanglijst_verwijderen(uuid, uuid), public.verlanglijst_favoriet(uuid, uuid, boolean),
  public.verlanglijst_status(uuid, text) to authenticated;
