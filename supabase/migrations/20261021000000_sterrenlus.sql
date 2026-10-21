-- Sterrenlus: gezin, profielen, taken, inzendingen, tijdverzoeken en puntenlog.
-- Alle regels over sterren (saldo, reserveren, dagplafond, tijdvenster) zitten in de functies
-- onderaan. De app schrijft nooit rechtstreeks in inzendingen, tijdverzoeken of puntenlog.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.gezinnen (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  tijdzone text not null default 'Europe/Brussels',
  dagplafond_minuten int not null default 60 check (dagplafond_minuten >= 0),
  venster_van time not null default '07:00',
  venster_tot time not null default '20:00',
  max_saldo int not null default 300 check (max_saldo > 0),
  -- Een verzoek vervalt na zoveel minuten, of uiterlijk om dit uur.
  verval_na_minuten int not null default 120 check (verval_na_minuten > 0),
  verval_uiterlijk time not null default '20:00'
);

create type public.rol as enum ('kind', 'ouder');

create table public.gebruikers (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  naam text not null,
  rol public.rol not null,
  avatar text,
  thema text,
  kan_lezen boolean not null default true,
  vraagt_zelf_tijd boolean not null default true,
  volgorde int not null default 0
);

-- Pincodes apart, zodat niemand ze kan lezen (geen select-policy).
create table public.ouder_pins (
  ouder_id uuid primary key references public.gebruikers on delete cascade,
  pin_hash text not null
);

create table public.pin_pogingen (
  id bigint generated always as identity primary key,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  tijdstip timestamptz not null default now()
);

-- Welk login-account bij welk gezin hoort. Een ouder-gsm heeft een eigen account,
-- een tablet een gedeeld tablet-account (ouder-acties daar alleen met pincode).
create table public.accounts (
  user_id uuid primary key references auth.users on delete cascade,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  soort text not null check (soort in ('ouder', 'tablet')),
  ouder_id uuid references public.gebruikers on delete cascade,
  check ((soort = 'ouder') = (ouder_id is not null))
);

create type public.herhaling as enum ('eenmalig', 'elke_dag', 'schooldagen');

create table public.taken (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  titel text not null,
  prentje text,
  sterren int not null check (sterren between 1 and 100),
  herhaling public.herhaling not null default 'elke_dag',
  foto_nodig boolean not null default false,
  herinnering time,
  actief boolean not null default true
);

create table public.taak_kinderen (
  taak_id uuid not null references public.taken on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  primary key (taak_id, kind_id)
);

create type public.inzending_status as enum ('ingediend', 'goedgekeurd', 'afgekeurd');

create table public.inzendingen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  taak_id uuid not null references public.taken on delete cascade,
  tijdstip timestamptz not null,
  dag date not null,
  foto_pad text,
  status public.inzending_status not null default 'ingediend',
  beoordeeld_door uuid references public.gebruikers,
  beoordeeld_op timestamptz
);
create index on public.inzendingen (kind_id, taak_id, dag);

create type public.verzoek_status as enum ('aangevraagd', 'toegekend', 'afgewezen', 'vervallen');

create table public.tijdverzoeken (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  minuten int not null check (minuten in (15, 30, 60)),
  sterren int not null check (sterren > 0),
  status public.verzoek_status not null default 'aangevraagd',
  reden text,
  aangevraagd_op timestamptz not null,
  dag date not null,
  vervalt_op timestamptz not null,
  behandeld_door uuid references public.gebruikers,
  behandeld_op timestamptz
);
create index on public.tijdverzoeken (kind_id, dag);
create index on public.tijdverzoeken (status, vervalt_op);

-- Elke bij- en afschrijving. Het saldo is de som van delta per kind.
create table public.puntenlog (
  id bigint generated always as identity primary key,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  delta int not null check (delta <> 0),
  reden text not null,
  bron text not null check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie')),
  bron_id uuid,
  tijdstip timestamptz not null,
  door uuid references public.gebruikers
);
create index on public.puntenlog (kind_id);

-- ---------------------------------------------------------------------------
-- Hulpfuncties
-- ---------------------------------------------------------------------------

-- Huidig tijdstip. Tests zetten app.nu om een vast moment te simuleren.
create function public.nu() returns timestamptz
language sql stable as $$
  select coalesce(nullif(current_setting('app.nu', true), '')::timestamptz, now())
$$;

create function public.mijn_gezin() returns uuid
language sql stable security definer set search_path = '' as $$
  select gezin_id from public.accounts where user_id = auth.uid()
$$;

create function public.is_ouder_account() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.accounts where user_id = auth.uid() and soort = 'ouder')
$$;

-- Geeft de handelende ouder terug, of null als dat niet vaststaat.
-- Op een ouder-account volstaat het account; op een tablet is de pincode nodig.
-- Een foute pincode wordt bewaard; na 5 fouten in 10 minuten wordt niets meer aanvaard.
create function public.ouder_controle(p_pin text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_account public.accounts;
  v_ouder uuid;
begin
  select * into v_account from public.accounts where user_id = auth.uid();
  if not found then
    return null;
  end if;
  if v_account.soort = 'ouder' and p_pin is null then
    return v_account.ouder_id;
  end if;
  if p_pin is null then
    return null;
  end if;
  if (select count(*) from public.pin_pogingen
      where gezin_id = v_account.gezin_id and tijdstip > public.nu() - interval '10 minutes') >= 5 then
    return null;
  end if;
  select g.id into v_ouder
  from public.gebruikers g join public.ouder_pins p on p.ouder_id = g.id
  where g.gezin_id = v_account.gezin_id and g.rol = 'ouder'
    and p.pin_hash = extensions.crypt(p_pin, p.pin_hash)
  limit 1;
  if v_ouder is null then
    insert into public.pin_pogingen (gezin_id, tijdstip) values (v_account.gezin_id, public.nu());
  end if;
  return v_ouder;
end $$;

create function public.saldo(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(delta), 0)::int from public.puntenlog where kind_id = p_kind
$$;

create function public.gereserveerd(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(sterren), 0)::int from public.tijdverzoeken
  where kind_id = p_kind and status = 'aangevraagd'
$$;

-- Extra minuten die vandaag al aangevraagd of toegekend zijn.
create function public.extra_vandaag(p_kind uuid, p_dag date) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(minuten), 0)::int from public.tijdverzoeken
  where kind_id = p_kind and dag = p_dag and status in ('aangevraagd', 'toegekend')
$$;

-- ---------------------------------------------------------------------------
-- Acties
-- ---------------------------------------------------------------------------

-- Kind vinkt een taak af.
create function public.taak_indienen(p_kind uuid, p_taak uuid, p_foto_pad text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin public.gezinnen;
  v_taak public.taken;
  v_nu timestamptz := public.nu();
  v_dag date;
  v_id uuid;
begin
  select * into v_gezin from public.gezinnen where id = public.mijn_gezin();
  if not found then raise exception 'geen gezin'; end if;
  v_dag := (v_nu at time zone v_gezin.tijdzone)::date;

  select * into v_taak from public.taken
  where id = p_taak and gezin_id = v_gezin.id and actief;
  if not found then raise exception 'taak niet gevonden'; end if;
  if not exists (select 1 from public.taak_kinderen where taak_id = p_taak and kind_id = p_kind) then
    raise exception 'taak niet voor dit kind';
  end if;
  if v_taak.foto_nodig and p_foto_pad is null then
    raise exception 'foto nodig';
  end if;

  -- Per kind en taak één inzending tegelijk afhandelen.
  perform pg_advisory_xact_lock(hashtext(p_kind::text || p_taak::text));
  if exists (
    select 1 from public.inzendingen
    where kind_id = p_kind and taak_id = p_taak and status in ('ingediend', 'goedgekeurd')
      and (v_taak.herhaling = 'eenmalig' or dag = v_dag)
  ) then
    raise exception 'taak al ingediend';
  end if;

  insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag, foto_pad)
  values (v_gezin.id, p_kind, p_taak, v_nu, v_dag, p_foto_pad)
  returning id into v_id;
  return v_id;
end $$;

-- Ouder keurt een inzending goed of af. Geeft de nieuwe status terug,
-- of 'pincode_fout' als de ouder niet vaststaat.
create function public.inzending_beoordelen(p_inzending uuid, p_goedkeuren boolean, p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_inz public.inzendingen;
  v_taak public.taken;
  v_max int;
  v_bij int;
begin
  if v_ouder is null then return 'pincode_fout'; end if;

  select * into v_inz from public.inzendingen
  where id = p_inzending and gezin_id = public.mijn_gezin()
  for update;
  if not found then raise exception 'inzending niet gevonden'; end if;
  if v_inz.status <> 'ingediend' then raise exception 'inzending al beoordeeld'; end if;

  if not p_goedkeuren then
    update public.inzendingen set status = 'afgekeurd', beoordeeld_door = v_ouder, beoordeeld_op = public.nu()
    where id = p_inzending;
    return 'afgekeurd';
  end if;

  select * into v_taak from public.taken where id = v_inz.taak_id;
  select max_saldo into v_max from public.gezinnen where id = v_inz.gezin_id;
  perform 1 from public.gebruikers where id = v_inz.kind_id for update;
  v_bij := greatest(0, least(v_taak.sterren, v_max - public.saldo(v_inz.kind_id)));

  update public.inzendingen set status = 'goedgekeurd', beoordeeld_door = v_ouder, beoordeeld_op = public.nu()
  where id = p_inzending;
  if v_bij > 0 then
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip, door)
    values (v_inz.gezin_id, v_inz.kind_id, v_bij,
            'Taak: ' || v_taak.titel || case when v_bij < v_taak.sterren then ' (spaarmaximum bereikt)' else '' end,
            'inzending', v_inz.id, public.nu(), v_ouder);
  end if;
  return 'goedgekeurd';
end $$;

-- Gemeenschappelijke controles voor een nieuw tijdverzoek. Vergrendelt het kind.
create function public.tijdverzoek_controleren(p_kind uuid, p_minuten int, out o_gezin public.gezinnen, out o_dag date)
language plpgsql security definer set search_path = '' as $$
declare
  v_nu timestamptz := public.nu();
  v_lokaal timestamp;
begin
  select * into o_gezin from public.gezinnen where id = public.mijn_gezin();
  if not found then raise exception 'geen gezin'; end if;
  perform 1 from public.gebruikers where id = p_kind and gezin_id = o_gezin.id and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if p_minuten not in (15, 30, 60) then raise exception 'blok moet 15, 30 of 60 minuten zijn'; end if;

  v_lokaal := v_nu at time zone o_gezin.tijdzone;
  o_dag := v_lokaal::date;
  if v_lokaal::time < o_gezin.venster_van or v_lokaal::time >= o_gezin.venster_tot then
    raise exception 'buiten tijdvenster';
  end if;
  if public.extra_vandaag(p_kind, o_dag) + p_minuten > o_gezin.dagplafond_minuten then
    raise exception 'boven dagplafond';
  end if;
  -- 1 ster = 1 minuut.
  if public.saldo(p_kind) - public.gereserveerd(p_kind) < p_minuten then
    raise exception 'te weinig sterren';
  end if;
end $$;

-- Kind vraagt extra tijd aan; de sterren worden gereserveerd.
create function public.tijd_aanvragen(p_kind uuid, p_minuten int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_ctl record;
  v_gezin public.gezinnen;
  v_dag date;
  v_nu timestamptz := public.nu();
  v_vervalt timestamptz;
  v_id uuid;
begin
  select * into v_ctl from public.tijdverzoek_controleren(p_kind, p_minuten);
  v_gezin := v_ctl.o_gezin;
  v_dag := v_ctl.o_dag;
  if not (select vraagt_zelf_tijd from public.gebruikers where id = p_kind) then
    raise exception 'dit kind vraagt zelf geen tijd aan';
  end if;
  v_vervalt := least(v_nu + make_interval(mins => v_gezin.verval_na_minuten),
                     (v_dag + v_gezin.verval_uiterlijk) at time zone v_gezin.tijdzone);

  insert into public.tijdverzoeken (gezin_id, kind_id, minuten, sterren, aangevraagd_op, dag, vervalt_op)
  values (v_gezin.id, p_kind, p_minuten, p_minuten, v_nu, v_dag, v_vervalt)
  returning id into v_id;
  return v_id;
end $$;

-- Ouder geeft zelf tijd (bv. voor Feline): meteen toegekend en afgeschreven.
create function public.tijd_geven(p_kind uuid, p_minuten int, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_ctl record;
  v_gezin public.gezinnen;
  v_dag date;
  v_nu timestamptz := public.nu();
  v_id uuid;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_ctl from public.tijdverzoek_controleren(p_kind, p_minuten);
  v_gezin := v_ctl.o_gezin;
  v_dag := v_ctl.o_dag;

  insert into public.tijdverzoeken (gezin_id, kind_id, minuten, sterren, status, aangevraagd_op, dag, vervalt_op,
                                    behandeld_door, behandeld_op)
  values (v_gezin.id, p_kind, p_minuten, p_minuten, 'toegekend', v_nu, v_dag, v_nu, v_ouder, v_nu)
  returning id into v_id;
  insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip, door)
  values (v_gezin.id, p_kind, -p_minuten, 'Extra tijd: ' || p_minuten || ' min', 'tijdverzoek', v_id, v_nu, v_ouder);
  return 'toegekend';
end $$;

-- Ouder tikt Toegekend (sterren definitief af) of Nu niet (sterren terug).
create function public.tijdverzoek_behandelen(p_verzoek uuid, p_toekennen boolean, p_reden text default null,
                                              p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_vz public.tijdverzoeken;
  v_nu timestamptz := public.nu();
begin
  if v_ouder is null then return 'pincode_fout'; end if;

  select * into v_vz from public.tijdverzoeken
  where id = p_verzoek and gezin_id = public.mijn_gezin()
  for update;
  if not found then raise exception 'verzoek niet gevonden'; end if;
  if v_vz.status <> 'aangevraagd' then raise exception 'verzoek al behandeld'; end if;

  if v_vz.vervalt_op <= v_nu then
    update public.tijdverzoeken set status = 'vervallen' where id = p_verzoek;
    return 'vervallen';
  end if;

  if p_toekennen then
    update public.tijdverzoeken set status = 'toegekend', behandeld_door = v_ouder, behandeld_op = v_nu
    where id = p_verzoek;
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip, door)
    values (v_vz.gezin_id, v_vz.kind_id, -v_vz.sterren, 'Extra tijd: ' || v_vz.minuten || ' min',
            'tijdverzoek', v_vz.id, v_nu, v_ouder);
    return 'toegekend';
  end if;

  update public.tijdverzoeken set status = 'afgewezen', reden = p_reden, behandeld_door = v_ouder, behandeld_op = v_nu
  where id = p_verzoek;
  return 'afgewezen';
end $$;

-- Draait elke 5 minuten via pg_cron (zie volgende migratie). Geeft het aantal vervallen verzoeken terug.
create function public.verzoeken_laten_vervallen() returns int
language sql security definer set search_path = '' as $$
  with v as (
    update public.tijdverzoeken set status = 'vervallen'
    where status = 'aangevraagd' and vervalt_op <= public.nu()
    returning 1
  )
  select count(*)::int from v
$$;

-- Ouder stelt de eigen pincode in (alleen vanaf een ouder-account).
create function public.pin_instellen(p_pin text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid;
begin
  select ouder_id into v_ouder from public.accounts where user_id = auth.uid() and soort = 'ouder';
  if v_ouder is null then raise exception 'alleen vanaf een ouder-account'; end if;
  if p_pin !~ '^[0-9]{4,6}$' then raise exception 'pincode moet 4 tot 6 cijfers zijn'; end if;
  insert into public.ouder_pins (ouder_id, pin_hash) values (v_ouder, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (ouder_id) do update set pin_hash = excluded.pin_hash;
end $$;

-- Saldo per kind voor de schermen.
create view public.kind_saldo with (security_invoker = true) as
select g.id as kind_id, g.gezin_id,
       public.saldo(g.id) as saldo,
       public.gereserveerd(g.id) as gereserveerd,
       public.saldo(g.id) - public.gereserveerd(g.id) as vrij
from public.gebruikers g
where g.rol = 'kind';

-- ---------------------------------------------------------------------------
-- Rechten en Row Level Security
-- ---------------------------------------------------------------------------

alter table public.gezinnen enable row level security;
alter table public.gebruikers enable row level security;
alter table public.ouder_pins enable row level security;
alter table public.pin_pogingen enable row level security;
alter table public.accounts enable row level security;
alter table public.taken enable row level security;
alter table public.taak_kinderen enable row level security;
alter table public.inzendingen enable row level security;
alter table public.tijdverzoeken enable row level security;
alter table public.puntenlog enable row level security;

create policy "eigen gezin lezen" on public.gezinnen for select to authenticated using (id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.gebruikers for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen account lezen" on public.accounts for select to authenticated using (user_id = auth.uid());
create policy "eigen gezin lezen" on public.taken for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.taak_kinderen for select to authenticated
  using (exists (select 1 from public.taken t where t.id = taak_id and t.gezin_id = public.mijn_gezin()));
create policy "eigen gezin lezen" on public.inzendingen for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.tijdverzoeken for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.puntenlog for select to authenticated using (gezin_id = public.mijn_gezin());

-- Taken en instellingen beheren: alleen vanaf een ouder-account.
create policy "ouder beheert taken" on public.taken for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouder beheert toewijzing" on public.taak_kinderen for all to authenticated
  using (public.is_ouder_account() and exists (select 1 from public.taken t where t.id = taak_id and t.gezin_id = public.mijn_gezin()))
  with check (public.is_ouder_account()
              and exists (select 1 from public.taken t where t.id = taak_id and t.gezin_id = public.mijn_gezin())
              and exists (select 1 from public.gebruikers g where g.id = kind_id and g.gezin_id = public.mijn_gezin()));
create policy "ouder past profielen aan" on public.gebruikers for update to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin());
create policy "ouder past gezin aan" on public.gezinnen for update to authenticated
  using (id = public.mijn_gezin() and public.is_ouder_account())
  with check (id = public.mijn_gezin());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.gezinnen, public.gebruikers, public.accounts, public.taken, public.taak_kinderen,
  public.inzendingen, public.tijdverzoeken, public.puntenlog, public.kind_saldo to authenticated;
grant insert, update, delete on public.taken, public.taak_kinderen to authenticated;
grant update (naam, avatar, thema, kan_lezen, vraagt_zelf_tijd, volgorde) on public.gebruikers to authenticated;
grant update (dagplafond_minuten, venster_van, venster_tot, max_saldo, verval_na_minuten, verval_uiterlijk)
  on public.gezinnen to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.nu(), public.mijn_gezin(), public.is_ouder_account(),
  public.saldo(uuid), public.gereserveerd(uuid), public.extra_vandaag(uuid, date),
  public.taak_indienen(uuid, uuid, text), public.inzending_beoordelen(uuid, boolean, text),
  public.tijd_aanvragen(uuid, int), public.tijd_geven(uuid, int, text),
  public.tijdverzoek_behandelen(uuid, boolean, text, text), public.pin_instellen(text)
  to authenticated;
