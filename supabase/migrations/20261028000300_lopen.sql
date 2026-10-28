-- Gezondheid → Lopen (docs/lopen.md): lopen die een ouder zelf invoert, privé per ouder (zoals wegingen).
-- `bron` en `externe_id` zijn er al voor een latere koppeling met Strava of een horloge: een geïmporteerde loop
-- krijgt bron 'strava' en het id van Strava, en dezelfde loop wordt dan nooit twee keer bewaard.
create table public.loopsessies (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  eigenaar uuid not null references public.gebruikers (id) on delete cascade,
  dag date not null,
  afstand_m integer not null check (afstand_m between 100 and 500000),
  duur_s integer not null check (duur_s between 30 and 172800),
  soort text not null default 'rustig' check (soort in ('rustig', 'tempo', 'interval', 'lang', 'wedstrijd')),
  gevoel smallint check (gevoel between 1 and 5),
  notitie text check (char_length(notitie) <= 1000),
  bron text not null default 'manueel' check (bron in ('manueel', 'strava', 'horloge')),
  externe_id text,
  hoogte_m integer check (hoogte_m between 0 and 20000),
  hartslag_gem smallint check (hartslag_gem between 30 and 250),
  route text,
  aangemaakt_op timestamptz not null default now(),
  unique (eigenaar, bron, externe_id)
);
create index loopsessies_eigenaar_dag on public.loopsessies (eigenaar, dag desc);

alter table public.loopsessies enable row level security;
create policy "ouder beheert eigen loopsessies" on public.loopsessies for all to authenticated
  using (eigenaar = public.mijn_ouder())
  with check (eigenaar = public.mijn_ouder() and gezin_id = public.mijn_gezin());

revoke all on public.loopsessies from anon, authenticated;
grant select, insert, delete on public.loopsessies to authenticated;
grant update (dag, afstand_m, duur_s, soort, gevoel, notitie, hoogte_m, hartslag_gem) on public.loopsessies to authenticated;
