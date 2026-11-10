-- Het gezinsdoel van de week in de wereld (docs/wereld-nieuw.md, "Samen"): elke glinster die een kind vindt, telt mee voor
-- het hele gezin. Haalt het gezin samen het doel (src/lib/dorp/gezinsdoel.ts) tussen maandag en zondag, dan hangt de gezinsvlag
-- in top op het plein. Geen sterren, geen puntenlog: de server telt alleen, zodat elke tablet hetzelfde ziet.
create table public.wereld_glinsters (
  kind_id uuid not null references public.gebruikers on delete cascade,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  dag date not null,
  aantal int not null default 0 check (aantal >= 0),
  primary key (kind_id, dag)
);
alter table public.wereld_glinsters enable row level security;
create policy "eigen gezin lezen" on public.wereld_glinsters for select to authenticated using (gezin_id = public.mijn_gezin());
revoke all on public.wereld_glinsters from anon, authenticated;
grant select on public.wereld_glinsters to authenticated;

-- Eén glinster gevonden; hoogstens 60 per kind per dag (meer liggen er niet), zodat niemand het doel alleen kan vullen.
create function public.wereld_glinster(p_kind uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin uuid;
  v_dag date := (public.nu() at time zone 'Europe/Brussels')::date;
  v_aantal int;
begin
  select gezin_id into v_gezin from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  insert into public.wereld_glinsters as w (kind_id, gezin_id, dag, aantal) values (p_kind, v_gezin, v_dag, 1)
  on conflict (kind_id, dag) do update set aantal = least(w.aantal + 1, 60)
  returning aantal into v_aantal;
  return v_aantal;
end $$;
revoke execute on function public.wereld_glinster(uuid) from public, anon;
grant execute on function public.wereld_glinster(uuid) to authenticated;

-- Wat elk kind van het gezin deze week (maandag tot zondag, Belgische tijd) vond: {"<kind_id>": aantal}.
create function public.wereld_gezinsdoel() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(kind_id, n), '{}'::jsonb)
  from (select kind_id, sum(aantal)::int as n from public.wereld_glinsters
        where gezin_id = public.mijn_gezin()
          and dag >= date_trunc('week', public.nu() at time zone 'Europe/Brussels')::date
        group by kind_id) s
$$;
revoke execute on function public.wereld_gezinsdoel() from public, anon;
grant execute on function public.wereld_gezinsdoel() to authenticated;
