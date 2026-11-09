-- Nieuw kinderthema 'kermis' (lus van 9 november 2026): het welkomstpad en Mijn thema kennen het.

create or replace function public.welkom_afronden(p_kind uuid, p_figuurtje jsonb default null, p_geboortedatum date default null,
                                       p_thema text default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_gezin public.gezinnen;
  v_tablet uuid := public.tablet_kind();
  v_bonus int := 0;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if not public.is_ouder_account() and v_tablet is distinct from p_kind then
    raise exception 'deze tablet hoort bij een ander kind';
  end if;
  if p_thema is not null and p_thema not in ('blauw', 'oranje', 'groen', 'paars', 'roze', 'lila', 'gras',
                                             'ruimte', 'zee', 'dier', 'wolk', 'bak', 'kliniek', 'bouw', 'circus', 'speelgoed', 'trein', 'muziek', 'pyjamafeest', 'piraat', 'dans', 'kermis') then
    raise exception 'onbekend thema';
  end if;
  if p_geboortedatum is not null
     and (p_geboortedatum > (public.nu() at time zone 'Europe/Brussels')::date
          or p_geboortedatum < (public.nu() at time zone 'Europe/Brussels')::date - interval '18 years') then
    raise exception 'geboortedatum klopt niet';
  end if;

  if p_figuurtje is not null then perform public.figuurtje_bewaren(p_kind, p_figuurtje); end if;
  update public.gebruikers
  set thema = coalesce(p_thema, thema), geboortedatum = coalesce(p_geboortedatum, geboortedatum), welkom_klaar = true
  where id = p_kind;

  if not exists (select 1 from public.puntenlog where kind_id = p_kind and bron = 'welkom') then
    select * into v_gezin from public.gezinnen where id = v_kind.gezin_id;
    v_bonus := greatest(0, least(10, v_gezin.max_saldo - public.saldo(p_kind)));
    if v_bonus > 0 then
      insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
      values (v_kind.gezin_id, p_kind, v_bonus, 'Welkom! Je eerste sterren', 'welkom', public.nu());
    end if;
  end if;
  return v_bonus;
end $$;

create or replace function public.thema_kiezen(p_kind uuid, p_thema text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;
  if not public.is_ouder_account() and public.tablet_kind() is distinct from p_kind then
    raise exception 'deze tablet hoort bij een ander kind';
  end if;
  if p_thema is null or p_thema not in ('blauw', 'oranje', 'groen', 'paars', 'roze', 'lila', 'gras',
                                        'ruimte', 'zee', 'dier', 'wolk', 'bak', 'kliniek', 'bouw', 'circus', 'speelgoed', 'trein', 'muziek', 'pyjamafeest', 'piraat', 'dans', 'kermis') then
    raise exception 'onbekend thema';
  end if;
  update public.gebruikers set thema = p_thema where id = p_kind;
end $$;
