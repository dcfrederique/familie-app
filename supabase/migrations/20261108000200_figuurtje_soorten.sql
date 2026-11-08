-- Soorten figuurtjes (8 november 2026, Frederique): naast het kind ook robot, katje, ridder, astronaut en draakje
-- (Mijn figuurtje → Soort). Het zijn stukken van het figuurtje met een prijs, net als hoeden: kopen met sterren in de
-- winkel, en nieuw = niet vrijgegeven tot een ouder ze vrijgeeft in Kinderen → Winkelaanbod (standaard_vrij = false).
-- De catalogus hieronder moet gelijk blijven aan src/data/figuurtje.ts (figuurtje.test.ts).

alter table public.figuurtje_stukken drop constraint figuurtje_stukken_soort_check;
alter table public.figuurtje_stukken add constraint figuurtje_stukken_soort_check
  check (soort in ('soort', 'huid', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'haarkleur', 'kleur'));
alter table public.aankopen drop constraint aankopen_soort_check;
alter table public.aankopen add constraint aankopen_soort_check
  check (soort in ('soort', 'huid', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));
alter table public.aanbod drop constraint aanbod_soort_check;
alter table public.aanbod add constraint aanbod_soort_check
  check (soort in ('soort', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));
alter table public.aanbod_verborgen drop constraint aanbod_verborgen_soort_check;
alter table public.aanbod_verborgen add constraint aanbod_verborgen_soort_check
  check (soort in ('soort', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));

insert into public.figuurtje_stukken (soort, sleutel, prijs) values
  ('soort', 'kind', 0), ('soort', 'robot', 40), ('soort', 'kat', 30), ('soort', 'ridder', 40),
  ('soort', 'astronaut', 50), ('soort', 'draak', 60);

-- Het figuurtje bewaren kent nu ook het veld 'soort' (oudere figuurtjes zonder dat veld blijven geldig = kind).
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
     or (select count(*) from jsonb_object_keys(p_figuurtje)) <> 12 + (p_figuurtje ? 'soort')::int then
    raise exception 'ongeldig figuurtje';
  end if;

  for v_veld in
    select * from (values ('huid', 'huid'), ('gezicht', 'gezicht'), ('haar', 'haar'), ('hoofd', 'hoofd'),
                          ('shirt', 'shirt'), ('broek', 'broek'), ('schoenen', 'schoenen'), ('extra', 'extra'),
                          ('haarKleur', 'haarkleur'), ('shirtKleur', 'kleur'), ('broekKleur', 'kleur'),
                          ('schoenKleur', 'kleur'), ('soort', 'soort')) as t(veld, soort)
    where t.veld <> 'soort' or p_figuurtje ? 'soort'
  loop
    if jsonb_typeof(p_figuurtje -> v_veld.veld) is distinct from 'string' then
      raise exception 'ongeldig figuurtje';
    end if;
    v_sleutel := p_figuurtje ->> v_veld.veld;
    select prijs into v_prijs from public.figuurtje_stukken where soort = v_veld.soort and sleutel = v_sleutel;
    if not found then raise exception 'onbekend stuk: %', v_veld.veld; end if;
    v_prijs := public.winkel_prijs(v_kind.gezin_id, v_veld.soort, v_sleutel, v_prijs);
    if v_prijs > 0
       and not exists (select 1 from public.aankopen
                       where kind_id = p_kind and soort = v_veld.soort and sleutel = v_sleutel) then
      if not v_kind.figuurtje_alles_vrij then
        raise exception 'stuk nog niet gekocht: %', v_sleutel;
      end if;
      if not public.in_aanbod(p_kind, v_veld.soort, v_sleutel)
         and (v_kind.figuurtje ->> v_veld.veld) is distinct from v_sleutel then
        raise exception 'nog niet in de winkel: %', v_sleutel;
      end if;
    end if;
  end loop;

  update public.gebruikers set figuurtje = p_figuurtje where id = p_kind;
end $$;

create or replace function public.ouder_figuurtje_bewaren(p_figuurtje jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.mijn_ouder();
  v_veld record;
  v_sleutel text;
begin
  if v_ouder is null then raise exception 'alleen voor ouders'; end if;
  if p_figuurtje is null then
    update public.gebruikers set figuurtje = null where id = v_ouder;
    return;
  end if;
  if jsonb_typeof(p_figuurtje) is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_figuurtje)) <> 12 + (p_figuurtje ? 'soort')::int then
    raise exception 'ongeldig figuurtje';
  end if;
  for v_veld in
    select * from (values ('huid', 'huid'), ('gezicht', 'gezicht'), ('haar', 'haar'), ('hoofd', 'hoofd'),
                          ('shirt', 'shirt'), ('broek', 'broek'), ('schoenen', 'schoenen'), ('extra', 'extra'),
                          ('haarKleur', 'haarkleur'), ('shirtKleur', 'kleur'), ('broekKleur', 'kleur'),
                          ('schoenKleur', 'kleur'), ('soort', 'soort')) as t(veld, soort)
    where t.veld <> 'soort' or p_figuurtje ? 'soort'
  loop
    if jsonb_typeof(p_figuurtje -> v_veld.veld) is distinct from 'string' then
      raise exception 'ongeldig figuurtje';
    end if;
    v_sleutel := p_figuurtje ->> v_veld.veld;
    if not exists (select 1 from public.figuurtje_stukken where soort = v_veld.soort and sleutel = v_sleutel) then
      raise exception 'onbekend stuk: %', v_veld.veld;
    end if;
  end loop;
  update public.gebruikers set figuurtje = p_figuurtje where id = v_ouder;
end $$;
