-- De dagschat van het Dorpsbord (docs/wereld-nieuw.md, fase 3): wie de drie opdrachtjes van vandaag in het dorp deed, krijgt
-- één keer per dag (Belgische tijd) een gratis stuk voor het figuurtje of Mijn huis. Zelfde keuze als het cadeautje van het
-- dagelijks hoera: in de winkel van dit kind, nog niet van hem, hoogstens 40 sterren. Geen sterren, geen puntenlog.
-- De opdrachtjes zelf (glinsters, appels, vissen) blijven op de tablet: ze leveren niets op dat de server moet bewaken.
create table public.wereld_dagschat (
  kind_id uuid not null references public.gebruikers on delete cascade,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  dag date not null,
  soort text,
  sleutel text,
  tijdstip timestamptz not null,
  primary key (kind_id, dag)
);
alter table public.wereld_dagschat enable row level security;
create policy "eigen gezin lezen" on public.wereld_dagschat for select to authenticated using (gezin_id = public.mijn_gezin());
revoke all on public.wereld_dagschat from anon, authenticated;
grant select on public.wereld_dagschat to authenticated;

-- Geeft {"cadeau": {"soort", "sleutel"} of null}; null als de dagschat van vandaag al opgehaald is.
create function public.wereld_dagschat(p_kind uuid, p_kandidaten text[] default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_dag date := (public.nu() at time zone 'Europe/Brussels')::date;
  v_soort text;
  v_sleutel text;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if exists (select 1 from public.wereld_dagschat where kind_id = p_kind and dag = v_dag) then return null; end if;

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
  insert into public.wereld_dagschat (kind_id, gezin_id, dag, soort, sleutel, tijdstip)
  values (p_kind, v_kind.gezin_id, v_dag, v_soort, v_sleutel, public.nu());

  return jsonb_build_object('cadeau', case when v_soort is null then null else jsonb_build_object('soort', v_soort, 'sleutel', v_sleutel) end);
end $$;
revoke execute on function public.wereld_dagschat(uuid, text[]) from public, anon;
grant execute on function public.wereld_dagschat(uuid, text[]) to authenticated;
