-- Strava-koppeling (docs/strava.md): per ouder de tokens van Strava. De tokens zijn geheim: de app ziet ze nooit,
-- alleen de Edge Function "strava" (service-rol) leest en schrijft ze. De app vraagt enkel strava_status().
create table public.strava_koppelingen (
  ouder_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  atleet_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  verloopt_op timestamptz not null,
  scope text,
  laatste_sync timestamptz,
  aangemaakt_op timestamptz not null default now()
);

alter table public.strava_koppelingen enable row level security;
-- Geen policies en geen rechten voor de app: enkel service_role (die RLS omzeilt).
revoke all on public.strava_koppelingen from anon, authenticated;

-- Of jij gekoppeld bent en wanneer er voor het laatst gesynchroniseerd werd.
create function public.strava_status() returns table (gekoppeld boolean, laatste_sync timestamptz)
language sql stable security definer set search_path = '' as $$
  select true, k.laatste_sync from public.strava_koppelingen k where k.ouder_id = public.mijn_ouder()
  union all
  select false, null::timestamptz where not exists (select 1 from public.strava_koppelingen k where k.ouder_id = public.mijn_ouder())
$$;
revoke execute on function public.strava_status() from public, anon;
grant execute on function public.strava_status() to authenticated;

