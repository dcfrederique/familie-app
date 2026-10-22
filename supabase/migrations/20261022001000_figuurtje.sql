-- Eigen figuurtje per kind (docs/avatar.md). Stukken worden vrijgespeeld met mijlpalen op het totaal
-- aantal ooit verdiende sterren (optie C): het saldo blijft onaangeroerd. De server controleert bij
-- het bewaren dat elk gekozen stuk vrij is. De catalogus hieronder moet gelijk blijven aan
-- src/data/figuurtje.ts (figuurtje.test.ts controleert dat).

alter table public.gebruikers
  add column figuurtje jsonb,
  add column figuurtje_alles_vrij boolean not null default false;

-- Elk stuk en elke kleur met de drempel in ooit verdiende sterren. Voor wie niet leest geldt een vijfde.
create table public.figuurtje_stukken (
  soort text not null check (soort in ('huid', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra',
                                       'haarkleur', 'kleur')),
  sleutel text not null,
  drempel int not null default 0 check (drempel >= 0),
  primary key (soort, sleutel)
);

insert into public.figuurtje_stukken (soort, sleutel, drempel) values
  ('huid', 'geel', 0), ('huid', 'licht', 0), ('huid', 'perzik', 0), ('huid', 'goud', 0), ('huid', 'bruin', 0), ('huid', 'donker', 0),
  ('gezicht', 'lach', 0), ('gezicht', 'groot', 0), ('gezicht', 'knipoog', 0), ('gezicht', 'verbaasd', 25),
  ('gezicht', 'tong', 50), ('gezicht', 'stoer', 100),
  ('haar', 'kort', 0), ('haar', 'stekels', 0), ('haar', 'pony', 0), ('haar', 'lang', 0), ('haar', 'staartjes', 0),
  ('haar', 'krullen', 25), ('haar', 'knot', 50), ('haar', 'geen', 0),
  ('hoofd', 'geen', 0), ('hoofd', 'pet', 0), ('hoofd', 'muts', 25), ('hoofd', 'konijn', 50), ('hoofd', 'dino', 100),
  ('hoofd', 'helm', 150), ('hoofd', 'kroon', 250),
  ('shirt', 'tshirt', 0), ('shirt', 'ster', 0), ('shirt', 'streep', 25), ('shirt', 'bliksem', 50), ('shirt', 'nummer8', 100),
  ('shirt', 'dino', 150), ('shirt', 'regenjas', 250),
  ('broek', 'lang', 0), ('broek', 'short', 0), ('broek', 'rok', 0), ('broek', 'salopette', 50),
  ('schoenen', 'sport', 0), ('schoenen', 'laarzen', 25), ('schoenen', 'bloot', 0),
  ('extra', 'geen', 0), ('extra', 'bril', 25), ('extra', 'voetbal', 50), ('extra', 'knuffel', 100),
  ('extra', 'toverstaf', 150), ('extra', 'cape', 400),
  ('haarkleur', 'zwart', 0), ('haarkleur', 'bruin', 0), ('haarkleur', 'kastanje', 0), ('haarkleur', 'blond', 0),
  ('haarkleur', 'rood', 0), ('haarkleur', 'blauw', 0), ('haarkleur', 'roze', 0), ('haarkleur', 'paars', 0),
  ('kleur', 'rood', 0), ('kleur', 'oranje', 0), ('kleur', 'geel', 0), ('kleur', 'groen', 0), ('kleur', 'blauw', 0),
  ('kleur', 'jeans', 0), ('kleur', 'paars', 0), ('kleur', 'roze', 0), ('kleur', 'wit', 0), ('kleur', 'donker', 0);

-- Ooit verdiende sterren: alle bijschrijvingen samen. Afschrijvingen (extra tijd) tellen niet af.
create function public.verdiend_totaal(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(delta), 0)::int from public.puntenlog where kind_id = p_kind and delta > 0
$$;

create view public.kind_verdiend with (security_invoker = true) as
select g.id as kind_id, g.gezin_id, public.verdiend_totaal(g.id) as verdiend
from public.gebruikers g
where g.rol = 'kind';

-- Bewaart het figuurtje van een kind (tablet of ouder). null zet het terug naar het basisfiguurtje.
create function public.figuurtje_bewaren(p_kind uuid, p_figuurtje jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_verdiend int;
  v_veld record;
  v_sleutel text;
  v_drempel int;
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

  v_verdiend := public.verdiend_totaal(p_kind);
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
    select drempel into v_drempel from public.figuurtje_stukken where soort = v_veld.soort and sleutel = v_sleutel;
    if not found then raise exception 'onbekend stuk: %', v_veld.veld; end if;
    if not v_kind.figuurtje_alles_vrij
       and (case when v_kind.kan_lezen then v_drempel else ceil(v_drempel / 5.0)::int end) > v_verdiend then
      raise exception 'stuk nog niet vrijgespeeld: %', v_sleutel;
    end if;
  end loop;

  update public.gebruikers set figuurtje = p_figuurtje where id = p_kind;
end $$;

alter table public.figuurtje_stukken enable row level security;
create policy "iedereen leest de catalogus" on public.figuurtje_stukken for select to authenticated using (true);

revoke all on public.figuurtje_stukken from anon, authenticated;
grant select on public.figuurtje_stukken, public.kind_verdiend to authenticated;
-- Vrijspelen aan of uit zet een ouder rechtstreeks (policy "ouder past profielen aan").
-- Het figuurtje zelf gaat altijd via figuurtje_bewaren, zodat de server de drempels controleert.
grant update (figuurtje_alles_vrij) on public.gebruikers to authenticated;

revoke execute on function public.verdiend_totaal(uuid) from public, anon;
revoke execute on function public.figuurtje_bewaren(uuid, jsonb) from public, anon;
grant execute on function public.verdiend_totaal(uuid), public.figuurtje_bewaren(uuid, jsonb) to authenticated;
