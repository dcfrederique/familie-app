-- Gezin aanmaken en toestellen koppelen vanuit de app, zonder SQL.
-- Een ouder registreert zich met e-mail en maakt het gezin aan. Andere toestellen
-- (tweede ouder, tablets) koppelen met een koppelcode die een ouder aanmaakt.

create table public.koppelcodes (
  code text primary key,
  gezin_id uuid not null references public.gezinnen on delete cascade,
  soort text not null check (soort in ('ouder', 'tablet')),
  ouder_id uuid references public.gebruikers on delete cascade,
  vervalt_op timestamptz not null,
  gebruikt_door uuid references auth.users on delete set null,
  check ((soort = 'ouder') = (ouder_id is not null))
);
alter table public.koppelcodes enable row level security;

-- Anonieme logins (tablets) mogen geen gezin aanmaken en geen ouder worden.
create function public.is_anoniem() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

-- Kleuren voor de kinderen, in volgorde (zie thema.css).
create function public.kindkleur(p_nr int) returns text
language sql immutable as $$
  select (array['blauw', 'oranje', 'groen', 'paars'])[1 + (p_nr % 4)]
$$;

-- p_kinderen: [{"naam": "Luca", "kan_lezen": true, "vraagt_zelf_tijd": true}, ...]
create function public.gezin_aanmaken(p_gezinsnaam text, p_mijn_naam text, p_kinderen jsonb,
                                      p_andere_ouder text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin uuid;
  v_ik uuid;
  v_kind jsonb;
  v_nr int := 0;
begin
  if auth.uid() is null or public.is_anoniem() then raise exception 'eerst aanmelden met e-mail'; end if;
  if exists (select 1 from public.accounts where user_id = auth.uid()) then
    raise exception 'dit account hoort al bij een gezin';
  end if;
  if coalesce(trim(p_gezinsnaam), '') = '' or coalesce(trim(p_mijn_naam), '') = '' then
    raise exception 'naam ontbreekt';
  end if;
  if jsonb_typeof(p_kinderen) <> 'array' or jsonb_array_length(p_kinderen) = 0 then
    raise exception 'voeg minstens één kind toe';
  end if;

  insert into public.gezinnen (naam) values (trim(p_gezinsnaam)) returning id into v_gezin;
  insert into public.gebruikers (gezin_id, naam, rol, volgorde)
  values (v_gezin, trim(p_mijn_naam), 'ouder', 1) returning id into v_ik;
  if coalesce(trim(p_andere_ouder), '') <> '' then
    insert into public.gebruikers (gezin_id, naam, rol, volgorde) values (v_gezin, trim(p_andere_ouder), 'ouder', 2);
  end if;

  for v_kind in select * from jsonb_array_elements(p_kinderen) loop
    if coalesce(trim(v_kind ->> 'naam'), '') = '' then raise exception 'naam van een kind ontbreekt'; end if;
    insert into public.gebruikers (gezin_id, naam, rol, thema, kan_lezen, vraagt_zelf_tijd, volgorde)
    values (v_gezin, trim(v_kind ->> 'naam'), 'kind', public.kindkleur(v_nr),
            coalesce((v_kind ->> 'kan_lezen')::boolean, true),
            coalesce((v_kind ->> 'vraagt_zelf_tijd')::boolean, true), 10 + v_nr);
    v_nr := v_nr + 1;
  end loop;

  insert into public.accounts (user_id, gezin_id, soort, ouder_id) values (auth.uid(), v_gezin, 'ouder', v_ik);
  return v_gezin;
end $$;

-- Ouder maakt een code (30 minuten geldig) om een tablet of de andere ouder te koppelen.
create function public.koppelcode_maken(p_soort text, p_ouder uuid default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin uuid := public.mijn_gezin();
  -- Zonder letters die op elkaar lijken (0/O, 1/I/L).
  v_tekens constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text := '';
begin
  if not public.is_ouder_account() then raise exception 'alleen vanaf een ouder-account'; end if;
  if p_soort = 'ouder' and not exists (
    select 1 from public.gebruikers where id = p_ouder and gezin_id = v_gezin and rol = 'ouder'
  ) then
    raise exception 'ouder niet gevonden';
  end if;
  for i in 1..8 loop
    v_code := v_code || substr(v_tekens, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(v_tekens)), 1);
  end loop;
  insert into public.koppelcodes (code, gezin_id, soort, ouder_id, vervalt_op)
  values (v_code, v_gezin, p_soort, case when p_soort = 'ouder' then p_ouder end, public.nu() + interval '30 minutes');
  return v_code;
end $$;

-- Een nieuw toestel koppelt zich met de code. Geeft de soort terug ('ouder' of 'tablet').
create function public.koppelen(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code public.koppelcodes;
begin
  if auth.uid() is null then raise exception 'niet aangemeld'; end if;
  if exists (select 1 from public.accounts where user_id = auth.uid()) then
    raise exception 'dit toestel is al gekoppeld';
  end if;
  select * into v_code from public.koppelcodes
  where code = upper(replace(trim(p_code), ' ', '')) and gebruikt_door is null and vervalt_op > public.nu()
  for update;
  if not found then raise exception 'code ongeldig of verlopen'; end if;
  if v_code.soort = 'ouder' and public.is_anoniem() then raise exception 'eerst aanmelden met e-mail'; end if;

  insert into public.accounts (user_id, gezin_id, soort, ouder_id)
  values (auth.uid(), v_code.gezin_id, v_code.soort, v_code.ouder_id);
  update public.koppelcodes set gebruikt_door = auth.uid() where code = v_code.code;
  return v_code.soort;
end $$;

-- Controleert de pincode om de ouder-schermen op een tablet te openen.
-- Telt mee voor de blokkering na 5 fouten (zie ouder_controle).
create function public.pin_controleren(p_pin text) returns boolean
language sql security definer set search_path = '' as $$
  select public.ouder_controle(p_pin) is not null
$$;

-- Heeft de ingelogde ouder al een pincode?
create function public.heeft_pin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.accounts a join public.ouder_pins p on p.ouder_id = a.ouder_id
    where a.user_id = auth.uid()
  )
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.nu(), public.mijn_gezin(), public.is_ouder_account(),
  public.saldo(uuid), public.gereserveerd(uuid), public.extra_vandaag(uuid, date),
  public.taak_indienen(uuid, uuid, text), public.inzending_beoordelen(uuid, boolean, text),
  public.tijd_aanvragen(uuid, int), public.tijd_geven(uuid, int, text),
  public.tijdverzoek_behandelen(uuid, boolean, text, text), public.pin_instellen(text),
  public.gezin_aanmaken(text, text, jsonb, text), public.koppelcode_maken(text, uuid),
  public.koppelen(text), public.pin_controleren(text), public.heeft_pin()
  to authenticated;
