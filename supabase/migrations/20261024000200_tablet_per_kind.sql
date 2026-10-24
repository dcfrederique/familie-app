-- Elke tablet hoort bij één kind (docs/tablet-per-kind.md). De eerste keer kiest het kind wie het is;
-- daarna opent de tablet altijd dat kind, zodat de kinderen elkaars account niet kunnen gebruiken.
-- Een ander kind kiezen kan alleen met de pincode van mama of papa, of vanaf de gsm van een ouder.
-- Daarna volgt een welkomstpad: figuurtje, verjaardag, thema en een welkomstbonus van 10 sterren.

alter table public.accounts
  add column kind_id uuid references public.gebruikers on delete set null,
  add column gekoppeld_op timestamptz not null default now(),
  add constraint accounts_kind_alleen_tablet check (kind_id is null or soort = 'tablet');

alter table public.gebruikers
  add column geboortedatum date,
  add column welkom_klaar boolean not null default false;

-- De welkomstbonus komt als aparte bron in het puntenlog.
alter table public.puntenlog drop constraint puntenlog_bron_check;
alter table public.puntenlog add constraint puntenlog_bron_check
  check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie', 'welkom'));

-- Het kind van deze tablet; null op een ouder-gsm of een tablet waarop nog niemand gekozen is.
create function public.tablet_kind() returns uuid
language sql stable security definer set search_path = '' as $$
  select kind_id from public.accounts where user_id = auth.uid() and soort = 'tablet'
$$;

-- Het kind kiest op de tablet wie het is. Een kind dat al een andere tablet heeft, of een tablet die al
-- van een ander kind is, vraagt de pincode van een ouder.
create function public.tablet_kiezen(p_kind uuid, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_account public.accounts;
begin
  select * into v_account from public.accounts where user_id = auth.uid() for update;
  if not found or v_account.soort <> 'tablet' then raise exception 'alleen op een tablet'; end if;
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_account.gezin_id and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;
  if v_account.kind_id = p_kind then return 'gekozen'; end if;

  if v_account.kind_id is not null or exists (
    select 1 from public.accounts where kind_id = p_kind and user_id <> auth.uid()
  ) then
    if p_pin is null and v_account.kind_id is not null then raise exception 'tablet hoort al bij een kind'; end if;
    if p_pin is null then raise exception 'kind heeft al een tablet'; end if;
    if public.ouder_controle(p_pin) is null then return 'pincode_fout'; end if;
  end if;

  update public.accounts set kind_id = p_kind, gekoppeld_op = public.nu() where user_id = auth.uid();
  return 'gekozen';
end $$;

-- Ouder koppelt een tablet los van zijn kind (de tablet vraagt dan opnieuw wie het is),
-- of verwijdert de tablet helemaal (die heeft dan een nieuwe koppelcode nodig).
-- p_tablet null = deze tablet zelf (met pincode).
create function public.tablet_loskoppelen(p_tablet uuid default null, p_verwijderen boolean default false,
                                          p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_tablet uuid := coalesce(p_tablet, auth.uid());
begin
  if public.ouder_controle(p_pin) is null then return 'pincode_fout'; end if;
  if not exists (select 1 from public.accounts
                 where user_id = v_tablet and gezin_id = public.mijn_gezin() and soort = 'tablet') then
    raise exception 'tablet niet gevonden';
  end if;
  if p_verwijderen then
    delete from public.accounts where user_id = v_tablet;
  else
    update public.accounts set kind_id = null where user_id = v_tablet;
  end if;
  return 'ok';
end $$;

-- De tablets van het gezin, voor de ouder (Toestellen).
create function public.tablets()
returns table (user_id uuid, kind_id uuid, gekoppeld_op timestamptz, is_deze boolean)
language sql stable security definer set search_path = '' as $$
  select a.user_id, a.kind_id, a.gekoppeld_op, a.user_id = auth.uid()
  from public.accounts a
  where a.gezin_id = public.mijn_gezin() and a.soort = 'tablet' and public.is_ouder_account()
  order by a.gekoppeld_op
$$;

-- Een gekozen tablet doet alleen iets voor zijn eigen kind: taken afvinken, tijd vragen, activiteiten
-- bewaren en het figuurtje aanpassen. Wat een ouder met de pincode doet (tijd geven) mag wel.
create function public.eigen_kind_bewaken() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_kind uuid := public.tablet_kind();
  -- Welke kolom het kind aanduidt, staat in het argument van de trigger.
  v_ander uuid := (to_jsonb(new) ->> tg_argv[0])::uuid;
begin
  if v_kind is not null and v_ander <> v_kind then
    raise exception 'deze tablet hoort bij een ander kind';
  end if;
  return new;
end $$;

create trigger eigen_kind before insert on public.inzendingen
  for each row execute function public.eigen_kind_bewaken('kind_id');
create trigger eigen_kind before insert on public.tijdverzoeken
  for each row when (new.status = 'aangevraagd') execute function public.eigen_kind_bewaken('kind_id');
create trigger eigen_kind before insert on public.activiteitlog
  for each row execute function public.eigen_kind_bewaken('kind_id');
create trigger eigen_kind before update of figuurtje on public.gebruikers
  for each row when (new.figuurtje is distinct from old.figuurtje) execute function public.eigen_kind_bewaken('id');

-- Einde van het welkomstpad: figuurtje, verjaardag en thema bewaren, en één keer de welkomstbonus.
-- Geeft het aantal bonussterren terug (0 als de bonus al gegeven was).
create function public.welkom_afronden(p_kind uuid, p_figuurtje jsonb default null, p_geboortedatum date default null,
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
  if p_thema is not null and p_thema not in ('blauw', 'oranje', 'groen', 'paars', 'roze', 'lila') then
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

-- Verjaardag en welkomstpad (opnieuw tonen) past een ouder aan bij Kinderen (policy "ouder past profielen aan").
grant update (geboortedatum, welkom_klaar) on public.gebruikers to authenticated;

revoke execute on function public.tablet_kind(), public.tablet_kiezen(uuid, text),
  public.tablet_loskoppelen(uuid, boolean, text), public.tablets(), public.eigen_kind_bewaken(),
  public.welkom_afronden(uuid, jsonb, date, text) from public, anon;
grant execute on function public.tablet_kind(), public.tablet_kiezen(uuid, text),
  public.tablet_loskoppelen(uuid, boolean, text), public.tablets(),
  public.welkom_afronden(uuid, jsonb, date, text) to authenticated;
