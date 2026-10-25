-- Dagelijks hoera (docs/dagelijks-hoera.md, gevraagd door Frederique op 25 oktober 2026): de eerste keer per dag dat een
-- kind de app opent, hoort het welke spelletjes de ouders sinds de vorige keer vrijgaven en krijgt het een cadeautje
-- uit de winkel (geen spelletje): een willekeurig stuk voor het figuurtje of Mijn huis dat het nog niet heeft.

-- Wanneer een ouder iets vrijgaf (gewijzigd_op verandert ook als alleen de prijs wijzigt).
alter table public.aanbod add column vrijgegeven_op timestamptz;
update public.aanbod set vrijgegeven_op = gewijzigd_op where vrijgegeven;

create function public.aanbod_vrijgegeven_op() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.vrijgegeven is true and (tg_op = 'INSERT' or old.vrijgegeven is distinct from true) then
    new.vrijgegeven_op := public.nu();
  elsif new.vrijgegeven is not true then
    new.vrijgegeven_op := null;
  end if;
  return new;
end $$;
create trigger aanbod_vrijgegeven_op before insert or update on public.aanbod
  for each row execute function public.aanbod_vrijgegeven_op();

-- Wanneer een kind het hoera voor het laatst kreeg.
create table public.dagelijks_hoera (
  kind_id uuid primary key references public.gebruikers on delete cascade,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  dag date not null,
  gezien_op timestamptz not null
);
alter table public.dagelijks_hoera enable row level security;
create policy "eigen gezin lezen" on public.dagelijks_hoera for select to authenticated using (gezin_id = public.mijn_gezin());
revoke all on public.dagelijks_hoera from anon, authenticated;
grant select on public.dagelijks_hoera to authenticated;

-- De eerste keer per dag (Belgische tijd) geeft dit {"nieuw": [spelletjes], "cadeau": {"soort", "sleutel"} of null};
-- daarna null. Spelletjes: vrijgegeven sinds de vorige keer (de eerste keer: de laatste 3 dagen), voor dit kind
-- zichtbaar en nog niet gekocht. Cadeau: een stuk dat in de winkel ligt, het kind nog niet heeft en hoogstens 40 sterren
-- kost; `p_kandidaten` ('soort:sleutel') beperkt de keuze tot wat het kind te zien krijgt (wie niet leest ziet minder
-- stukken). Het cadeau komt als gratis aankoop bij de aankopen, zonder iets van de sterren af te halen.
create function public.dagelijks_hoera(p_kind uuid, p_kandidaten text[] default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_dag date := (public.nu() at time zone 'Europe/Brussels')::date;
  v_vorige public.dagelijks_hoera;
  v_sinds timestamptz;
  v_nieuw text[];
  v_soort text;
  v_sleutel text;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  select * into v_vorige from public.dagelijks_hoera where kind_id = p_kind;
  if found and v_vorige.dag >= v_dag then return null; end if;
  v_sinds := coalesce(v_vorige.gezien_op, public.nu() - interval '3 days');

  select coalesce(array_agg(a.sleutel order by a.vrijgegeven_op, a.sleutel), '{}') into v_nieuw
  from public.aanbod a
  where a.gezin_id = v_kind.gezin_id and a.soort = 'spel' and a.vrijgegeven is true and a.vrijgegeven_op > v_sinds
    and public.in_aanbod(p_kind, 'spel', a.sleutel)
    and not exists (select 1 from public.aankopen k where k.kind_id = p_kind and k.soort = 'spel' and k.sleutel = a.sleutel);

  select c.soort, c.sleutel into v_soort, v_sleutel
  from (select soort, sleutel, prijs from public.figuurtje_stukken
        where soort in ('gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra')
        union all
        select soort, sleutel, prijs from public.huis_stukken where soort <> 'huis') c
  where public.winkel_prijs(v_kind.gezin_id, c.soort, c.sleutel, c.prijs) between 1 and 40
    and public.in_aanbod(p_kind, c.soort, c.sleutel)
    and (p_kandidaten is null or (c.soort || ':' || c.sleutel) = any (p_kandidaten))
    and not exists (select 1 from public.aankopen k where k.kind_id = p_kind and k.soort = c.soort and k.sleutel = c.sleutel)
  order by random() limit 1;

  if v_soort is not null then
    insert into public.aankopen (gezin_id, kind_id, soort, sleutel, prijs, tijdstip)
    values (v_kind.gezin_id, p_kind, v_soort, v_sleutel, 0, public.nu());
  end if;

  insert into public.dagelijks_hoera (kind_id, gezin_id, dag, gezien_op)
  values (p_kind, v_kind.gezin_id, v_dag, public.nu())
  on conflict (kind_id) do update set dag = excluded.dag, gezien_op = excluded.gezien_op;

  return jsonb_build_object('nieuw', to_jsonb(v_nieuw),
    'cadeau', case when v_soort is null then null else jsonb_build_object('soort', v_soort, 'sleutel', v_sleutel) end);
end $$;
revoke execute on function public.dagelijks_hoera(uuid, text[]) from public, anon;
grant execute on function public.dagelijks_hoera(uuid, text[]) to authenticated;
