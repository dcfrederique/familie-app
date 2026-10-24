-- Prijs instelbaar door de ouders (docs/winkelaanbod.md). Een ouder kan per spelletje of stuk een eigen prijs in
-- sterren zetten; zonder eigen prijs geldt de prijs uit de catalogus (spel_prijzen, figuurtje_stukken).
-- Wie niet leest betaalt nog altijd de helft van de prijs die de ouders instelden, naar boven afgerond.

alter table public.aanbod add column prijs int check (prijs >= 0);
-- Een rij met alleen een prijs is geen keuze over vrijgeven: dan geldt standaard_vrij.
alter table public.aanbod alter column vrijgegeven drop not null;

-- De prijs in de winkel van dit gezin voor een stuk uit de catalogus (basis = catalogusprijs).
create function public.winkel_prijs(p_gezin uuid, p_soort text, p_sleutel text, p_basis int) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select prijs from public.aanbod where gezin_id = p_gezin and soort = p_soort and sleutel = p_sleutel), p_basis)
$$;
revoke execute on function public.winkel_prijs(uuid, text, text, int) from public, anon;
grant execute on function public.winkel_prijs(uuid, text, text, int) to authenticated;

create or replace function public.kopen(p_kind uuid, p_soort text, p_sleutel text, p_naam text default null)
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
  v_prijs := public.winkel_prijs(v_kind.gezin_id, p_soort, p_sleutel, v_prijs);
  v_prijs := public.prijs_voor(v_prijs, v_kind.kan_lezen);

  if v_prijs > 0 and not v_kind.figuurtje_alles_vrij
     and not exists (select 1 from public.aankopen where kind_id = p_kind and soort = p_soort and sleutel = p_sleutel) then
    if not public.in_aanbod(p_kind, p_soort, p_sleutel) then
      raise exception 'nog niet in de winkel: %', p_sleutel;
    end if;
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

