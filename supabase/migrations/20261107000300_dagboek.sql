-- Dagboek "Mijn dag" (docs/sterrenpot-dagboek.md): een kind kiest eenmaal per dag hoe het zich voelt, waarom, en mag er
-- iets bij schrijven of tekenen. Alleen ouder-accounts lezen het; een tablet schrijft enkel de eigen rij van vandaag.
-- Geen sterren, niets in het puntenlog. Een ouder zet het per kind aan.

create table public.dagboek_instelling (
  kind_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  aan boolean not null default false
);

create table public.dagboek (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  dag date not null,
  gevoel text not null check (gevoel in ('super', 'blij', 'gewoon', 'moe', 'verdrietig', 'boos')),
  redenen text[] not null default '{}'
    check (cardinality(redenen) <= 2 and redenen <@ array['school', 'vrienden', 'thuis', 'slapen', 'eten', 'spelen', 'ziek', 'anders']),
  tekst text not null default '' check (char_length(tekst) <= 300),
  tekening jsonb check (tekening is null or octet_length(tekening::text) <= 60000),
  wil_praten boolean not null default false,
  gezien_op timestamptz,
  tijdstip timestamptz not null default now(),
  unique (kind_id, dag)
);
create index on public.dagboek (gezin_id, dag desc);

-- Ouder zet het dagboek voor een kind aan of uit.
create function public.dagboek_instellen(p_kind uuid, p_aan boolean, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  insert into public.dagboek_instelling (kind_id, gezin_id, aan) values (p_kind, v_kind.gezin_id, p_aan)
  on conflict (kind_id) do update set aan = excluded.aan;
  return 'ingesteld';
end $$;

-- Het kind bewaart de rij van vandaag (nog eens bewaren op dezelfde dag past ze aan).
create function public.dagboek_opslaan(p_kind uuid, p_gevoel text, p_redenen text[], p_tekst text, p_tekening jsonb, p_wil_praten boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_gezin public.gezinnen;
  v_dag date;
begin
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  if not coalesce((select aan from public.dagboek_instelling where kind_id = p_kind), false) then
    raise exception 'het dagboek staat uit';
  end if;
  select * into v_gezin from public.gezinnen where id = v_kind.gezin_id;
  v_dag := (public.nu() at time zone v_gezin.tijdzone)::date;
  insert into public.dagboek (gezin_id, kind_id, dag, gevoel, redenen, tekst, tekening, wil_praten, tijdstip)
  values (v_kind.gezin_id, p_kind, v_dag, p_gevoel, coalesce(p_redenen, '{}'), left(coalesce(p_tekst, ''), 300), p_tekening,
          coalesce(p_wil_praten, false), public.nu())
  on conflict (kind_id, dag) do update
    set gevoel = excluded.gevoel, redenen = excluded.redenen, tekst = excluded.tekst, tekening = excluded.tekening,
        wil_praten = excluded.wil_praten, tijdstip = excluded.tijdstip, gezien_op = null;
end $$;

-- Het kind ziet enkel zijn of haar eigen laatste dagen (voor de gezichtjes van de week).
create function public.dagboek_week(p_kind uuid)
returns table (dag date, gevoel text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform 1 from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  return query select d.dag, d.gevoel from public.dagboek d
    where d.kind_id = p_kind and d.dag > (public.nu() at time zone 'Europe/Brussels')::date - 7 order by d.dag;
end $$;

-- Een ouder markeert een dag als gezien.
create function public.dagboek_gezien(p_kind uuid, p_dag date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_ouder_account() then raise exception 'alleen een ouder'; end if;
  update public.dagboek set gezien_op = public.nu()
  where kind_id = p_kind and dag = p_dag and gezin_id = public.mijn_gezin();
end $$;

alter table public.dagboek_instelling enable row level security;
alter table public.dagboek enable row level security;
create policy "eigen gezin lezen" on public.dagboek_instelling for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "ouders lezen het dagboek" on public.dagboek for select to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account());
revoke all on public.dagboek_instelling, public.dagboek from anon, authenticated;
grant select on public.dagboek_instelling, public.dagboek to authenticated;

revoke execute on function public.dagboek_instellen(uuid, boolean, text), public.dagboek_opslaan(uuid, text, text[], text, jsonb, boolean),
  public.dagboek_week(uuid), public.dagboek_gezien(uuid, date) from public, anon;
grant execute on function public.dagboek_instellen(uuid, boolean, text), public.dagboek_opslaan(uuid, text, text[], text, jsonb, boolean),
  public.dagboek_week(uuid), public.dagboek_gezien(uuid, date) to authenticated;
