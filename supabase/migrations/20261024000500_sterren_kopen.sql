-- Sterren inwisselen in de winkel (docs/winkel.md, gevraagd door de ouders op 24 oktober 2026).
-- Uit de eerste testen bleek dat vrijspelen met ooit verdiende sterren niet werkt als beloning: de kinderen
-- kopen nu zelf een spelletje of een stuk voor hun figuurtje, en die sterren gaan van hun saldo af.
-- Sterren uit lerende spelletjes (rekenen, verhalen, zelf lezen, kleurplaten) komen er meteen bij, zonder goedkeuring;
-- een ouder keurt alleen nog taken goed en geeft de extra schermtijd.
-- De prijzen hieronder moeten gelijk blijven aan src/data/figuurtje.ts en src/data/spelletjes.ts
-- (figuurtje.test.ts en spelletjes.test.ts controleren dat).

alter table public.puntenlog drop constraint puntenlog_bron_check;
alter table public.puntenlog add constraint puntenlog_bron_check
  check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie', 'welkom', 'aankoop'));

-- Prijs in sterren per stuk van het figuurtje; 0 = meteen van jou. Wie niet leest betaalt de helft.
alter table public.figuurtje_stukken add column prijs int not null default 0 check (prijs >= 0);
update public.figuurtje_stukken s set prijs = v.prijs
from (values
  ('gezicht', 'verbaasd', 10), ('gezicht', 'tong', 15), ('gezicht', 'stoer', 20),
  ('haar', 'krullen', 10), ('haar', 'knot', 15),
  ('hoofd', 'muts', 10), ('hoofd', 'konijn', 15), ('hoofd', 'dino', 20), ('hoofd', 'helm', 25), ('hoofd', 'kroon', 35),
  ('shirt', 'streep', 10), ('shirt', 'bliksem', 15), ('shirt', 'nummer8', 20), ('shirt', 'dino', 25),
  ('shirt', 'regenjas', 35),
  ('broek', 'salopette', 15),
  ('schoenen', 'laarzen', 10),
  ('extra', 'bril', 10), ('extra', 'voetbal', 15), ('extra', 'knuffel', 20), ('extra', 'toverstaf', 25),
  ('extra', 'cape', 50)
) as v(soort, sleutel, prijs)
where s.soort = v.soort and s.sleutel = v.sleutel;

create table public.spel_prijzen (
  sleutel text primary key,
  prijs int not null check (prijs >= 0),
  -- drempel uit het oude vrijspelen, alleen om te bepalen wat een kind al had
  oude_drempel int not null default 0
);
insert into public.spel_prijzen (sleutel, prijs, oude_drempel) values
  ('rekenen', 0, 0), ('memory', 0, 0), ('penalty', 0, 0),
  ('huisdier', 15, 20), ('puzzel', 20, 40), ('racen', 20, 30), ('koken', 25, 50), ('touwspringen', 30, 75),
  ('basket', 40, 100);

-- Wat een kind gekocht heeft. soort is de categorie van het figuurtje of 'spel'.
create table public.aankopen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  soort text not null check (soort in ('huid', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel')),
  sleutel text not null,
  prijs int not null check (prijs >= 0),
  tijdstip timestamptz not null,
  unique (kind_id, soort, sleutel)
);

-- Wat al vrijgespeeld was met het oude systeem, blijft van het kind (zonder iets af te schrijven).
insert into public.aankopen (gezin_id, kind_id, soort, sleutel, prijs, tijdstip)
select g.gezin_id, g.id, s.soort, s.sleutel, 0, now()
from public.gebruikers g
cross join public.figuurtje_stukken s
where g.rol = 'kind' and s.prijs > 0 and s.soort not in ('haarkleur', 'kleur')
  and (case when g.kan_lezen then s.drempel else ceil(s.drempel / 5.0)::int end) <= public.verdiend_totaal(g.id)
on conflict do nothing;
insert into public.aankopen (gezin_id, kind_id, soort, sleutel, prijs, tijdstip)
select g.gezin_id, g.id, 'spel', p.sleutel, 0, now()
from public.gebruikers g
cross join public.spel_prijzen p
where g.rol = 'kind' and p.prijs > 0
  and (case when g.kan_lezen then p.oude_drempel else ceil(p.oude_drempel / 5.0)::int end) <= public.verdiend_totaal(g.id)
on conflict do nothing;

alter table public.figuurtje_stukken drop column drempel;
alter table public.spel_prijzen drop column oude_drempel;

-- Prijs voor dit kind: wie niet leest betaalt de helft (naar boven afgerond).
create function public.prijs_voor(p_prijs int, p_kan_lezen boolean) returns int
language sql immutable set search_path = '' as $$
  select case when p_kan_lezen then p_prijs else ceil(p_prijs / 2.0)::int end
$$;

-- Kind koopt een spelletje of een stuk. De sterren gaan meteen van het vrije saldo (wat niet gereserveerd is
-- voor extra tijd). Geeft het vrije saldo na de aankoop terug. Twee keer kopen schrijft niets af.
create function public.kopen(p_kind uuid, p_soort text, p_sleutel text, p_naam text default null)
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

-- Het figuurtje bewaren: elk gekozen stuk moet gratis of gekocht zijn.
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
    if v_prijs > 0 and not v_kind.figuurtje_alles_vrij
       and not exists (select 1 from public.aankopen
                       where kind_id = p_kind and soort = v_veld.soort and sleutel = v_sleutel) then
      raise exception 'stuk nog niet gekocht: %', v_sleutel;
    end if;
  end loop;

  update public.gebruikers set figuurtje = p_figuurtje where id = p_kind;
end $$;

-- Activiteit afwerken: de sterren komen er meteen bij, zonder goedkeuring van een ouder.
-- Het dagplafond voor activiteiten en het spaarmaximum blijven gelden. Geeft de bijgeschreven sterren terug.
create or replace function public.activiteit_opslaan(p_kind uuid, p_activiteit text, p_inhoud jsonb default '{}',
                                                     p_duur_seconden int default 0)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin public.gezinnen;
  v_nu timestamptz := public.nu();
  v_dag date;
  v_sterren int;
  v_al int;
  v_bij int := 0;
  v_id uuid;
begin
  select * into v_gezin from public.gezinnen where id = public.mijn_gezin();
  if not found then raise exception 'geen gezin'; end if;
  v_dag := (v_nu at time zone v_gezin.tijdzone)::date;
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_gezin.id and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;

  v_sterren := case p_activiteit
    when 'rekenen' then least(10, greatest(0, coalesce((p_inhoud ->> 'goed')::int, 0))) / 2
    when 'verhaal' then 5
    when 'zelf_gelezen' then 5
    when 'kleurplaat' then 3
    else 0
  end;

  perform 1 from public.gebruikers where id = p_kind for update;
  if v_sterren > 0 then
    select coalesce(sum(sterren), 0) into v_al from public.activiteitlog
    where kind_id = p_kind and dag = v_dag and status in ('ingediend', 'goedgekeurd');
    v_sterren := greatest(0, least(v_sterren, v_gezin.activiteit_sterren_per_dag - v_al));
    v_bij := greatest(0, least(v_sterren, v_gezin.max_saldo - public.saldo(p_kind)));
  end if;

  insert into public.activiteitlog (gezin_id, kind_id, activiteit, inhoud, duur_seconden, sterren, status, tijdstip, dag,
                                    beoordeeld_op)
  values (v_gezin.id, p_kind, p_activiteit, coalesce(p_inhoud, '{}'),
          least(greatest(coalesce(p_duur_seconden, 0), 0), 4 * 3600), v_sterren,
          case when v_sterren > 0 then 'goedgekeurd'::public.inzending_status end, v_nu, v_dag,
          case when v_sterren > 0 then v_nu end)
  returning id into v_id;
  if v_bij > 0 then
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip)
    values (v_gezin.id, p_kind, v_bij,
            public.activiteit_omschrijving(p_activiteit, coalesce(p_inhoud, '{}'))
              || case when v_bij < v_sterren then ' (spaarmaximum bereikt)' else '' end,
            'activiteit', v_id, v_nu);
  end if;
  return v_bij;
end $$;

create trigger eigen_kind before insert on public.aankopen
  for each row execute function public.eigen_kind_bewaken('kind_id');

alter table public.aankopen enable row level security;
create policy "eigen gezin lezen" on public.aankopen for select to authenticated using (gezin_id = public.mijn_gezin());
alter table public.spel_prijzen enable row level security;
create policy "iedereen leest de prijzen" on public.spel_prijzen for select to authenticated using (true);

revoke all on public.aankopen, public.spel_prijzen from anon, authenticated;
grant select on public.aankopen, public.spel_prijzen to authenticated;

revoke execute on function public.prijs_voor(int, boolean) from public, anon;
revoke execute on function public.kopen(uuid, text, text, text) from public, anon;
grant execute on function public.prijs_voor(int, boolean), public.kopen(uuid, text, text, text) to authenticated;
