-- Wie is er nu in de wereld? De tablets en gsm's melden zich om de ±10 seconden; alleen als er nog iemand anders van het gezin
-- is, openen ze de Realtime-verbinding voor live posities (src/lib/wereld/live.ts). Alleen een tijdstip per persoon, geen plek.
create table public.wereld_aanwezig (
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  gebruiker text not null check (char_length(gebruiker) between 1 and 64),
  gezien timestamptz not null default now(),
  primary key (gezin_id, gebruiker)
);
alter table public.wereld_aanwezig enable row level security;

-- Meldt de aanwezigheid van `p_ik` en geeft terug hoeveel anderen van het gezin de laatste 30 seconden ook in de wereld waren.
create function public.wereld_aanwezig(p_ik text) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin uuid := public.mijn_gezin();
begin
  if v_gezin is null or p_ik is null or char_length(p_ik) not between 1 and 64 then return 0; end if;
  insert into public.wereld_aanwezig (gezin_id, gebruiker, gezien) values (v_gezin, p_ik, public.nu())
    on conflict (gezin_id, gebruiker) do update set gezien = excluded.gezien;
  delete from public.wereld_aanwezig where gezin_id = v_gezin and gezien < public.nu() - interval '1 day';
  return (select count(*) from public.wereld_aanwezig
          where gezin_id = v_gezin and gebruiker <> p_ik and gezien > public.nu() - interval '30 seconds')::integer;
end $$;

-- Wie weggaat meldt zich af, zodat de ander meteen weet dat hij alleen is.
create function public.wereld_weg(p_ik text) returns void
language sql security definer set search_path = '' as $$
  delete from public.wereld_aanwezig where gezin_id = public.mijn_gezin() and gebruiker = p_ik
$$;

revoke all on function public.wereld_aanwezig(text), public.wereld_weg(text) from public;
grant execute on function public.wereld_aanwezig(text), public.wereld_weg(text) to authenticated;
