-- Winkelaanbod (docs/winkelaanbod.md, gevraagd door de ouders op 24 oktober 2026).
-- De ouders kiezen wat er in de winkel van de kinderen ligt, zodat nieuwe spelletjes en stukken voor het figuurtje
-- in fases vrijkomen, en per kind welke spelletjes (en stukken) het te zien krijgt.
-- Alles wat er vandaag al is, blijft vrijgegeven. Wat er later bijkomt (de nachtelijke bouw voegt spelletjes toe)
-- ligt pas in de winkel als een ouder het vrijgeeft: nieuwe rijen in spel_prijzen en figuurtje_stukken krijgen
-- standaard_vrij = false.

alter table public.spel_prijzen add column standaard_vrij boolean not null default false;
update public.spel_prijzen set standaard_vrij = true;
alter table public.figuurtje_stukken add column standaard_vrij boolean not null default false;
update public.figuurtje_stukken set standaard_vrij = true;

-- Keuze van de ouders per gezin; zonder rij geldt standaard_vrij uit de catalogus.
create table public.aanbod (
  gezin_id uuid not null references public.gezinnen on delete cascade,
  soort text not null check (soort in ('gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel')),
  sleutel text not null,
  vrijgegeven boolean not null,
  gewijzigd_op timestamptz not null default now(),
  primary key (gezin_id, soort, sleutel)
);

-- Wat een kind niet te zien krijgt, ook als het vrijgegeven of al gekocht is.
create table public.aanbod_verborgen (
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  soort text not null check (soort in ('gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel')),
  sleutel text not null,
  primary key (kind_id, soort, sleutel)
);

-- Ligt dit in de winkel van dit kind? Gratis stukken van het figuurtje zijn altijd te kiezen
-- (anders breekt een bewaard figuurtje); gratis spelletjes kan een ouder wel verbergen.
create function public.in_aanbod(p_kind uuid, p_soort text, p_sleutel text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
           (select a.vrijgegeven from public.aanbod a join public.gebruikers g on g.gezin_id = a.gezin_id
            where g.id = p_kind and a.soort = p_soort and a.sleutel = p_sleutel),
           case when p_soort = 'spel' then (select standaard_vrij from public.spel_prijzen where sleutel = p_sleutel)
                else (select standaard_vrij from public.figuurtje_stukken where soort = p_soort and sleutel = p_sleutel) end,
           false)
     and not exists (select 1 from public.aanbod_verborgen
                     where kind_id = p_kind and soort = p_soort and sleutel = p_sleutel)
$$;

-- Kopen kan alleen wat in de winkel van het kind ligt; wat al gekocht is, kost niets en blijft van het kind.
create or replace function public.kopen(p_kind uuid, p_soort text, p_sleutel text, p_naam text default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_prijs int;
  v_id uuid;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  if p_soort = 'spel' then
    select prijs into v_prijs from public.spel_prijzen where sleutel = p_sleutel;
  else
    select prijs into v_prijs from public.figuurtje_stukken where soort = p_soort and sleutel = p_sleutel;
  end if;
  if v_prijs is null then raise exception 'onbekend stuk: %', p_sleutel; end if;
  v_prijs := public.prijs_voor(v_prijs, v_kind.kan_lezen);

  if v_prijs > 0 and not v_kind.figuurtje_alles_vrij
     and not exists (select 1 from public.aankopen where kind_id = p_kind and soort = p_soort and sleutel = p_sleutel) then
    if not public.in_aanbod(p_kind, p_soort, p_sleutel) then
      raise exception 'nog niet in de winkel: %', p_sleutel;
    end if;
    if public.saldo(p_kind) - public.gereserveerd(p_kind) < v_prijs then
      raise exception 'niet genoeg sterren';
    end if;
    insert into public.aankopen (gezin_id, kind_id, soort, sleutel, prijs, tijdstip)
    values (v_kind.gezin_id, p_kind, p_soort, p_sleutel, v_prijs, public.nu())
    returning id into v_id;
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip)
    values (v_kind.gezin_id, p_kind, -v_prijs, 'Gekocht: ' || left(coalesce(nullif(trim(p_naam), ''), p_sleutel), 40),
            'aankoop', v_id, public.nu());
  end if;
  return public.saldo(p_kind) - public.gereserveerd(p_kind);
end $$;

-- Het figuurtje bewaren: elk gekozen stuk moet gratis of gekocht zijn. Met "alles vrij" mag alleen wat in de winkel
-- ligt, of wat het kind al droeg (een ouder kan een stuk verbergen dat het kind aan heeft).
create or replace function public.figuurtje_bewaren(p_kind uuid, p_figuurtje jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_veld record;
  v_sleutel text;
  v_prijs int;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  if p_figuurtje is null then
    update public.gebruikers set figuurtje = null where id = p_kind;
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
    select prijs into v_prijs from public.figuurtje_stukken where soort = v_veld.soort and sleutel = v_sleutel;
    if not found then raise exception 'onbekend stuk: %', v_veld.veld; end if;
    if v_prijs > 0
       and not exists (select 1 from public.aankopen
                       where kind_id = p_kind and soort = v_veld.soort and sleutel = v_sleutel) then
      if not v_kind.figuurtje_alles_vrij then
        raise exception 'stuk nog niet gekocht: %', v_sleutel;
      end if;
      if not public.in_aanbod(p_kind, v_veld.soort, v_sleutel)
         and (v_kind.figuurtje ->> v_veld.veld) is distinct from v_sleutel then
        raise exception 'nog niet in de winkel: %', v_sleutel;
      end if;
    end if;
  end loop;

  update public.gebruikers set figuurtje = p_figuurtje where id = p_kind;
end $$;

alter table public.aanbod enable row level security;
alter table public.aanbod_verborgen enable row level security;
create policy "eigen gezin lezen" on public.aanbod for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.aanbod_verborgen for select to authenticated using (gezin_id = public.mijn_gezin());
-- Beheren alleen vanaf een ouder-account, zoals de andere instellingen.
create policy "ouder beheert aanbod" on public.aanbod for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouder beheert aanbod per kind" on public.aanbod_verborgen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and exists (select 1 from public.gebruikers g
                          where g.id = kind_id and g.gezin_id = public.mijn_gezin() and g.rol = 'kind'));

revoke all on public.aanbod, public.aanbod_verborgen from anon, authenticated;
grant select, insert, update, delete on public.aanbod, public.aanbod_verborgen to authenticated;

revoke execute on function public.in_aanbod(uuid, text, text) from public, anon;
grant execute on function public.in_aanbod(uuid, text, text) to authenticated;
