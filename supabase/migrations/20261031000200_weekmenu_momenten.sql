-- Weekmenu met momenten, standaardmaaltijden en deelrecepten (docs/weekmenu.md, docs/voorraad.md).
--  * weekmenu krijgt een moment: ontbijt, middag, avond (de warme maaltijd, wat de kinderen zien) en vieruurtje;
--  * weekmenu_standaard: een vaste maaltijd per moment (en eventueel per weekdag), bv. elke ochtend boterhammen;
--  * een recept kan een deelrecept zijn (bolognaisesaus in de diepvries): het maakt een voorraadartikel aan porties,
--    en een ander recept gebruikt er een portie van, of maakt het vers als de voorraad op is;
--  * afboeken kan per moment (voorraad_gekookt_moment); er blijft een tik nodig, er gebeurt niets automatisch.
-- Een al toegepaste migratie herken je aan de fout 42701 (kolom bestaat al).

alter table public.weekmenu add column moment text not null default 'avond'
  check (moment in ('ontbijt', 'middag', 'avond', 'vieruurtje'));
alter table public.weekmenu drop constraint weekmenu_pkey;
alter table public.weekmenu add primary key (gezin_id, dag, moment);

alter table public.voorraad_gekookt add column moment text not null default 'avond'
  check (moment in ('ontbijt', 'middag', 'avond', 'vieruurtje'));
alter table public.voorraad_gekookt drop constraint voorraad_gekookt_pkey;
alter table public.voorraad_gekookt add primary key (gezin_id, dag, moment);

-- Welke momenten het gezin gebruikt en voor hoeveel eters het vieruurtje is (de kinderen en Maxim).
alter table public.voorraad_instellingen add column momenten text[] not null default '{avond}'
  check (momenten <@ array['ontbijt', 'middag', 'avond', 'vieruurtje']::text[]);
alter table public.voorraad_instellingen add column eters_vieruurtje int not null default 4 check (eters_vieruurtje between 1 and 20);

-- weekdag: 0 = elke dag, 1 tot 7 = maandag tot zondag (isodow); een vaste weekdag wint van "elke dag".
create table public.weekmenu_standaard (
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  moment text not null check (moment in ('ontbijt', 'middag', 'vieruurtje')),
  weekdag smallint not null check (weekdag between 0 and 7),
  gerecht text not null check (length(btrim(gerecht)) between 1 and 80),
  primary key (gezin_id, moment, weekdag)
);
alter table public.weekmenu_standaard enable row level security;
create policy "ouders beheren standaardmaaltijden" on public.weekmenu_standaard for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
grant select, insert, update, delete on public.weekmenu_standaard to authenticated;

-- Deelrecept: dit recept maakt `opbrengst` porties van het voorraadartikel `artikel_id` (bv. 4 porties bolognaisesaus in de diepvries).
alter table public.recepten add column artikel_id uuid references public.voorraad_artikelen (id) on delete set null;
alter table public.recepten add column opbrengst numeric(10, 3) not null default 1 check (opbrengst > 0 and opbrengst < 1000);

-- Een recept gebruikt een deelrecept: `porties` (voor het aantal personen van het recept), en wat er gebeurt als de voorraad op is.
create table public.recept_delen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  recept_id uuid not null references public.recepten (id) on delete cascade,
  deel_id uuid not null references public.recepten (id) on delete cascade,
  porties numeric(10, 3) not null default 1 check (porties > 0 and porties < 1000),
  -- maken: de ingrediënten van het deelrecept gaan af; lijst: het artikel komt op de boodschappenlijst.
  als_op text not null default 'maken' check (als_op in ('maken', 'lijst')),
  unique (recept_id, deel_id),
  check (recept_id <> deel_id)
);
alter table public.recept_delen enable row level security;
create policy "ouders beheren receptdelen" on public.recept_delen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and exists (select 1 from public.recepten r where r.id = recept_id and r.gezin_id = public.mijn_gezin())
              and exists (select 1 from public.recepten r where r.id = deel_id and r.gezin_id = public.mijn_gezin()));
grant select, insert, update, delete on public.recept_delen to authenticated;

-- Boekt een recept af met een factor (eters / personen): de ingrediënten gaan af, en elk deelrecept gaat uit de voorraad
-- (genoeg porties), komt op de lijst (als_op = lijst) of wordt vers gemaakt (de ingrediënten van het deelrecept gaan af).
-- Eén niveau diep: een deelrecept in een deelrecept telt niet mee.
create function public.recept_afboeken(p_recept uuid, p_factor numeric, p_uitleg text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  i record;
  d record;
  dr public.recepten;
  a public.voorraad_artikelen;
  nodig numeric;
  teller int := 0;
begin
  for i in select * from public.recept_ingredienten where recept_id = p_recept loop
    perform public.voorraad_bijstellen(i.artikel_id, -round(i.hoeveelheid * p_factor, 3), 'recept', p_uitleg);
    teller := teller + 1;
  end loop;
  for d in select * from public.recept_delen where recept_id = p_recept loop
    select * into dr from public.recepten where id = d.deel_id;
    nodig := round(d.porties * p_factor, 3);
    select * into a from public.voorraad_artikelen where id = dr.artikel_id;
    if found and a.aantal >= nodig then
      perform public.voorraad_bijstellen(a.id, -nodig, 'recept', p_uitleg || ': ' || dr.naam);
      teller := teller + 1;
    elsif found and d.als_op = 'lijst' then
      if not exists (select 1 from public.boodschappen b where b.gezin_id = a.gezin_id and b.gekocht_op is null
                     and lower(btrim(b.naam)) = lower(btrim(a.naam))) then
        insert into public.boodschappen (gezin_id, naam, hoeveel, winkel_id, categorie_id) values (a.gezin_id, a.naam, '', a.winkel_id, a.categorie_id);
      end if;
    else
      for i in select * from public.recept_ingredienten where recept_id = dr.id loop
        perform public.voorraad_bijstellen(i.artikel_id, -round(i.hoeveelheid * nodig / dr.opbrengst, 3), 'recept', p_uitleg || ': ' || dr.naam);
        teller := teller + 1;
      end loop;
    end if;
  end loop;
  return teller;
end $$;
revoke execute on function public.recept_afboeken(uuid, numeric, text) from public, anon, authenticated;

-- Een moment van een weekmenu-dag is gekookt. De maaltijd is die van het weekmenu, anders de standaard (een vaste
-- weekdag wint van "elke dag"). Eters: het gezin, bij het vieruurtje het aantal voor het vieruurtje.
create function public.voorraad_gekookt_moment(p_dag date, p_moment text, p_overslaan boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare
  gezin uuid := public.mijn_gezin();
  gerecht text;
  r public.recepten;
  eters int;
  teller int := 0;
begin
  if not public.is_ouder_account() then raise exception 'Alleen een ouder boekt de voorraad af'; end if;
  if p_moment not in ('ontbijt', 'middag', 'avond', 'vieruurtje') then raise exception 'Onbekend moment %', p_moment; end if;
  select m.gerecht into gerecht from public.weekmenu m where m.gezin_id = gezin and m.dag = p_dag and m.moment = p_moment;
  if gerecht is null and p_moment <> 'avond' then
    select s.gerecht into gerecht from public.weekmenu_standaard s
      where s.gezin_id = gezin and s.moment = p_moment and s.weekdag in (0, extract(isodow from p_dag)::int)
      order by s.weekdag desc limit 1;
  end if;
  if gerecht is null then raise exception 'Er staat niets op het weekmenu voor die dag'; end if;
  if exists (select 1 from public.voorraad_gekookt where gezin_id = gezin and dag = p_dag and moment = p_moment) then
    raise exception 'Die dag is al afgeboekt';
  end if;
  if not p_overslaan then
    select * into r from public.recepten where gezin_id = gezin and lower(btrim(naam)) = lower(btrim(gerecht));
    if not found then raise exception 'Er is geen recept voor %', gerecht; end if;
    select case when p_moment = 'vieruurtje' then coalesce(vi.eters_vieruurtje, 4) else coalesce(vi.eters, 6) end into eters
      from (select 1) x left join public.voorraad_instellingen vi on vi.gezin_id = gezin;
    teller := public.recept_afboeken(r.id, eters::numeric / r.personen, gerecht);
  end if;
  insert into public.voorraad_gekookt (gezin_id, dag, moment, gerecht, overgeslagen) values (gezin, p_dag, p_moment, gerecht, p_overslaan);
  return teller;
end $$;

-- De bestaande functie voor de warme maaltijd blijft werken.
create or replace function public.voorraad_gekookt(p_dag date, p_overslaan boolean default false) returns int
language sql security definer set search_path = '' as $$
  select public.voorraad_gekookt_moment(p_dag, 'avond', p_overslaan);
$$;

-- Een deelrecept is gekookt: de ingrediënten gaan af en de porties komen in de voorraad (bv. in de diepvries).
create function public.deelrecept_gekookt(p_recept uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.recepten;
  i record;
  teller int := 0;
begin
  if not public.is_ouder_account() then raise exception 'Alleen een ouder boekt de voorraad af'; end if;
  select * into r from public.recepten where id = p_recept and gezin_id = public.mijn_gezin();
  if not found then raise exception 'Dat recept bestaat niet'; end if;
  if r.artikel_id is null then raise exception 'Dit recept is geen deelrecept'; end if;
  for i in select * from public.recept_ingredienten where recept_id = r.id loop
    perform public.voorraad_bijstellen(i.artikel_id, -i.hoeveelheid, 'recept', 'gekookt: ' || r.naam);
    teller := teller + 1;
  end loop;
  perform public.voorraad_bijstellen(r.artikel_id, r.opbrengst, 'recept', 'gekookt: ' || r.naam);
  return teller;
end $$;

revoke execute on function public.voorraad_gekookt_moment(date, text, boolean) from public, anon;
revoke execute on function public.deelrecept_gekookt(uuid) from public, anon;
grant execute on function public.voorraad_gekookt_moment(date, text, boolean), public.deelrecept_gekookt(uuid) to authenticated;
