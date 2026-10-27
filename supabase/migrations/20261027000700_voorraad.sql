-- Voorraad (docs/voorraad.md, ouderdeel Wij): wat er in huis is, gekoppeld aan de boodschappen en het weekmenu.
-- Alleen voor de ouders, zoals Boodschappen: alles hangt aan een ouder-account (accounts.soort = 'ouder').
-- De koppelingen staan op de server, zodat het klopt wie of wat het ook aanpast:
--   afvinken (of afrekenen) op de boodschappenlijst => voorraad omhoog, terugzetten => weer omlaag;
--   voorraad onder het minimum => het artikel komt vanzelf op de boodschappenlijst;
--   "Gekookt" tikken voor een weekmenu-dag met recept => voorraad omlaag.

create table public.voorraad_artikelen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  naam text not null check (length(btrim(naam)) between 1 and 80),
  -- Waarin we tellen: stuk, fles, pak, kg, l, ... (vrije tekst, de app biedt een lijst aan).
  eenheid text not null default 'stuk' check (length(btrim(eenheid)) between 1 and 12),
  aantal numeric(10, 3) not null default 0 check (aantal >= 0 and aantal < 1000000),
  -- Zakt het aantal tot hier of lager, dan komt het artikel op de boodschappenlijst. null = nooit vanzelf.
  minimum numeric(10, 3) check (minimum is null or (minimum >= 0 and minimum < 1000000)),
  -- Hoeveel één aankoop bijbrengt (een pak van 6 flessen = 6); een afgevinkte boodschap telt aantal × dit.
  aankoop_aantal numeric(10, 3) not null default 1 check (aankoop_aantal > 0 and aankoop_aantal < 1000000),
  plaats text not null default 'Kast' check (plaats in ('Koelkast', 'Diepvries', 'Kast', 'Kelder', 'Andere')),
  categorie_id uuid references public.categorieen (id) on delete set null,
  winkel_id uuid references public.winkels (id) on delete set null,
  houdbaar_tot date,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create unique index voorraad_artikelen_naam on public.voorraad_artikelen (gezin_id, lower(btrim(naam)));

create table public.voorraad_log (
  id bigint generated always as identity primary key,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  artikel_id uuid references public.voorraad_artikelen (id) on delete set null,
  naam text not null,
  verschil numeric(10, 3) not null,
  nieuw_aantal numeric(10, 3) not null,
  reden text not null check (reden in ('handmatig', 'telling', 'boodschappen', 'recept')),
  uitleg text,
  aangemaakt_op timestamptz not null default now()
);
create index voorraad_log_gezin on public.voorraad_log (gezin_id, aangemaakt_op desc);

create table public.recepten (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  -- Zelfde naam als het gerecht in het weekmenu (hoofdletters en spaties tellen niet mee).
  naam text not null check (length(btrim(naam)) between 1 and 80),
  -- Voor hoeveel personen de hoeveelheden gelden; de server rekent om naar het aantal eters van het gezin.
  personen int not null default 4 check (personen between 1 and 20),
  aangemaakt_op timestamptz not null default now()
);
create unique index recepten_naam on public.recepten (gezin_id, lower(btrim(naam)));

create table public.recept_ingredienten (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  recept_id uuid not null references public.recepten (id) on delete cascade,
  artikel_id uuid not null references public.voorraad_artikelen (id) on delete cascade,
  -- In de eenheid van het voorraadartikel.
  hoeveelheid numeric(10, 3) not null check (hoeveelheid > 0 and hoeveelheid < 1000000),
  unique (recept_id, artikel_id)
);

create table public.voorraad_instellingen (
  gezin_id uuid primary key references public.gezinnen (id) on delete cascade,
  eters int not null default 5 check (eters between 1 and 20)
);

-- Welke weekmenu-dagen al van de voorraad afgeboekt (of overgeslagen) zijn: nooit twee keer.
create table public.voorraad_gekookt (
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  dag date not null,
  gerecht text not null,
  overgeslagen boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  primary key (gezin_id, dag)
);

alter table public.boodschappen add column voorraad_bijgeboekt numeric(10, 3);

alter table public.voorraad_artikelen enable row level security;
alter table public.voorraad_log enable row level security;
alter table public.recepten enable row level security;
alter table public.recept_ingredienten enable row level security;
alter table public.voorraad_instellingen enable row level security;
alter table public.voorraad_gekookt enable row level security;

create policy "ouders beheren voorraad" on public.voorraad_artikelen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and (winkel_id is null or exists (select 1 from public.winkels w where w.id = winkel_id and w.gezin_id = public.mijn_gezin()))
              and (categorie_id is null or exists (select 1 from public.categorieen c where c.id = categorie_id and c.gezin_id = public.mijn_gezin())));
create policy "ouders lezen voorraadlog" on public.voorraad_log for select to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouders beheren recepten" on public.recepten for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouders beheren receptingredienten" on public.recept_ingredienten for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and exists (select 1 from public.recepten r where r.id = recept_id and r.gezin_id = public.mijn_gezin())
              and exists (select 1 from public.voorraad_artikelen a where a.id = artikel_id and a.gezin_id = public.mijn_gezin()));
create policy "ouders beheren voorraadinstellingen" on public.voorraad_instellingen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouders lezen voorraad gekookt" on public.voorraad_gekookt for select to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account());

-- Het aantal van een artikel aanpassen (p_absoluut: p_waarde is het nieuwe aantal, anders het verschil) en in het log zetten.
-- Het aantal gaat nooit onder 0; het log toont wat echt veranderde. Valt het aantal tot het minimum, dan komt het artikel op de lijst.
create function public.voorraad_bijstellen(p_artikel uuid, p_waarde numeric, p_reden text, p_uitleg text default null, p_absoluut boolean default false)
returns numeric language plpgsql security definer set search_path = '' as $$
declare
  a public.voorraad_artikelen;
  nieuw numeric;
begin
  if not public.is_ouder_account() then raise exception 'Alleen een ouder past de voorraad aan'; end if;
  select * into a from public.voorraad_artikelen where id = p_artikel and gezin_id = public.mijn_gezin() for update;
  if not found then raise exception 'Dat artikel bestaat niet'; end if;
  nieuw := round(greatest(0, case when p_absoluut then p_waarde else a.aantal + p_waarde end), 3);
  if nieuw = a.aantal then return nieuw; end if;
  update public.voorraad_artikelen set aantal = nieuw, bijgewerkt_op = now() where id = a.id;
  insert into public.voorraad_log (gezin_id, artikel_id, naam, verschil, nieuw_aantal, reden, uitleg)
  values (a.gezin_id, a.id, a.naam, nieuw - a.aantal, nieuw, p_reden, p_uitleg);

  if a.minimum is not null and nieuw <= a.minimum and nieuw < a.aantal and p_reden <> 'boodschappen'
     and not exists (select 1 from public.boodschappen b where b.gezin_id = a.gezin_id and b.gekocht_op is null
                     and lower(btrim(b.naam)) = lower(btrim(a.naam))) then
    insert into public.boodschappen (gezin_id, naam, hoeveel, winkel_id, categorie_id) values (a.gezin_id, a.naam, '', a.winkel_id, a.categorie_id);
  end if;
  return nieuw;
end $$;

-- Boodschappen afvinken telt bij de voorraad, terugzetten haalt het er weer af; artikels worden op naam gekoppeld.
create function public.boodschap_naar_voorraad() returns trigger language plpgsql set search_path = '' as $$
declare
  a public.voorraad_artikelen;
  erbij numeric;
begin
  if new.gekocht_op is not null and (tg_op = 'INSERT' or old.gekocht_op is null) then
    select * into a from public.voorraad_artikelen
      where gezin_id = new.gezin_id and lower(btrim(naam)) = lower(btrim(new.naam));
    if found then
      erbij := round(coalesce(new.aantal, 1) * a.aankoop_aantal, 3);
      perform public.voorraad_bijstellen(a.id, erbij, 'boodschappen', new.naam);
      new.voorraad_bijgeboekt := erbij;
    end if;
  elsif tg_op = 'UPDATE' and new.gekocht_op is null and old.gekocht_op is not null and old.voorraad_bijgeboekt is not null then
    select * into a from public.voorraad_artikelen
      where gezin_id = new.gezin_id and lower(btrim(naam)) = lower(btrim(old.naam));
    if found then perform public.voorraad_bijstellen(a.id, -old.voorraad_bijgeboekt, 'boodschappen', 'terugzetten: ' || new.naam); end if;
    new.voorraad_bijgeboekt := null;
  end if;
  return new;
end $$;
create trigger boodschap_naar_voorraad before insert or update of gekocht_op on public.boodschappen
  for each row execute function public.boodschap_naar_voorraad();

-- Een weekmenu-dag is gekookt: de ingrediënten van het recept gaan van de voorraad af, omgerekend naar het aantal eters.
-- p_overslaan: er is niet gekookt (of niet zoals gepland); er gaat niets af en de dag vraagt niet meer.
create function public.voorraad_gekookt(p_dag date, p_overslaan boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare
  gezin uuid := public.mijn_gezin();
  gerecht text;
  r public.recepten;
  eters int;
  teller int := 0;
  i record;
begin
  if not public.is_ouder_account() then raise exception 'Alleen een ouder boekt de voorraad af'; end if;
  select m.gerecht into gerecht from public.weekmenu m where m.gezin_id = gezin and m.dag = p_dag;
  if gerecht is null then raise exception 'Er staat niets op het weekmenu voor die dag'; end if;
  if exists (select 1 from public.voorraad_gekookt where gezin_id = gezin and dag = p_dag) then
    raise exception 'Die dag is al afgeboekt';
  end if;
  if not p_overslaan then
    select * into r from public.recepten where gezin_id = gezin and lower(btrim(naam)) = lower(btrim(gerecht));
    if not found then raise exception 'Er is geen recept voor %', gerecht; end if;
    select coalesce((select vi.eters from public.voorraad_instellingen vi where vi.gezin_id = gezin), 5) into eters;
    for i in select * from public.recept_ingredienten where recept_id = r.id loop
      perform public.voorraad_bijstellen(i.artikel_id, -round(i.hoeveelheid * eters / r.personen, 3), 'recept', gerecht);
      teller := teller + 1;
    end loop;
  end if;
  insert into public.voorraad_gekookt (gezin_id, dag, gerecht, overgeslagen) values (gezin, p_dag, gerecht, p_overslaan);
  return teller;
end $$;

revoke all on public.voorraad_artikelen, public.voorraad_log, public.recepten, public.recept_ingredienten,
  public.voorraad_instellingen, public.voorraad_gekookt from anon, authenticated;
grant select, insert, update, delete on public.voorraad_artikelen, public.recepten, public.recept_ingredienten, public.voorraad_instellingen to authenticated;
grant select on public.voorraad_log, public.voorraad_gekookt to authenticated;
revoke execute on function public.voorraad_bijstellen(uuid, numeric, text, text, boolean) from public, anon;
revoke execute on function public.voorraad_gekookt(date, boolean) from public, anon;
revoke execute on function public.boodschap_naar_voorraad() from public, anon, authenticated;
grant execute on function public.voorraad_bijstellen(uuid, numeric, text, text, boolean), public.voorraad_gekookt(date, boolean) to authenticated;
