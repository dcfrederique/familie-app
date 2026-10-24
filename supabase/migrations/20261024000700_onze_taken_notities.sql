-- Onze taken en Notities (docs/ouderdeel.md, Wij): alleen voor de ouders. Tablets van de kinderen lezen
-- deze tabellen niet, ook niet met de pincode: alles hangt aan een ouder-account (accounts.soort = 'ouder').

-- De ouder van het account dat nu aangemeld is; null op een tablet.
create function public.mijn_ouder() returns uuid
language sql stable security definer set search_path = '' as $$
  select ouder_id from public.accounts where user_id = auth.uid() and soort = 'ouder'
$$;

-- Onze taken: taken voor de ouders, zonder sterren en zonder goedkeuring.
create table public.ouder_taken (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  titel text not null check (length(btrim(titel)) between 1 and 120),
  datum date,
  -- Een van de ouders; null = samen.
  wie uuid references public.gebruikers (id) on delete set null,
  herhaling text not null default 'eenmalig' check (herhaling in ('eenmalig', 'wekelijks', 'maandelijks')),
  gedaan_op timestamptz,
  gedaan_door uuid references public.gebruikers (id) on delete set null,
  -- Bij een herhaling: de taak waaruit deze volgde, zodat terugdraaien de volgende weer weghaalt.
  vorige_id uuid references public.ouder_taken (id) on delete set null,
  aangemaakt_op timestamptz not null default now(),
  check (herhaling = 'eenmalig' or datum is not null)
);
create index ouder_taken_gezin on public.ouder_taken (gezin_id, gedaan_op);

alter table public.ouder_taken enable row level security;
create policy "ouders beheren onze taken" on public.ouder_taken for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and (wie is null or exists (select 1 from public.gebruikers g
                                          where g.id = wie and g.gezin_id = public.mijn_gezin() and g.rol = 'ouder')));

-- Afvinken of terugzetten. Een herhalende taak krijgt bij afvinken meteen de volgende keer erbij;
-- terugzetten haalt die volgende weer weg zolang ze nog niet gedaan is.
create function public.ouder_taak_afvinken(p_taak uuid, p_gedaan boolean) returns void
language plpgsql set search_path = '' as $$
declare
  v public.ouder_taken;
begin
  -- Gewone rechten (geen security definer): RLS laat alleen een ouder van het eigen gezin toe.
  select * into v from public.ouder_taken where id = p_taak for update;
  if not found then raise exception 'taak niet gevonden'; end if;

  if p_gedaan then
    if v.gedaan_op is not null then return; end if;
    update public.ouder_taken set gedaan_op = now(), gedaan_door = public.mijn_ouder() where id = p_taak;
    if v.herhaling <> 'eenmalig' then
      insert into public.ouder_taken (gezin_id, titel, datum, wie, herhaling, vorige_id)
      values (v.gezin_id, v.titel,
              (v.datum + case v.herhaling when 'wekelijks' then interval '7 days' else interval '1 month' end)::date,
              v.wie, v.herhaling, v.id);
    end if;
  else
    update public.ouder_taken set gedaan_op = null, gedaan_door = null where id = p_taak;
    delete from public.ouder_taken where vorige_id = p_taak and gedaan_op is null;
  end if;
end $$;

-- Notities: tekst of een lijstje met vinkjes, gedeeld met de partner of privé.
create table public.notities (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  eigenaar uuid not null references public.gebruikers (id) on delete cascade,
  gedeeld boolean not null default true,
  titel text not null default '' check (length(titel) <= 120),
  tekst text not null default '' check (length(tekst) <= 10000),
  -- null = gewone notitie; anders een lijstje: [{"t": "melk", "af": false}, ...]
  lijst jsonb check (lijst is null or case when jsonb_typeof(lijst) = 'array' then jsonb_array_length(lijst) <= 200 else false end),
  vastgezet boolean not null default false,
  bijgewerkt_op timestamptz not null default now(),
  check (length(btrim(titel)) > 0 or length(btrim(tekst)) > 0 or case when jsonb_typeof(lijst) = 'array' then jsonb_array_length(lijst) > 0 else false end)
);
create index notities_gezin on public.notities (gezin_id);

alter table public.notities enable row level security;
-- Lezen, aanpassen en weggooien: je eigen notities, en die van je partner als ze gedeeld zijn.
create policy "ouders lezen notities" on public.notities for select to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account() and (gedeeld or eigenaar = public.mijn_ouder()));
create policy "ouder schrijft eigen notitie" on public.notities for insert to authenticated
  with check (gezin_id = public.mijn_gezin() and eigenaar = public.mijn_ouder());
-- Alleen de eigenaar kan een gedeelde notitie weer privé maken.
create policy "ouders passen notities aan" on public.notities for update to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account() and (gedeeld or eigenaar = public.mijn_ouder()))
  with check (gedeeld or eigenaar = public.mijn_ouder());
create policy "ouders gooien notities weg" on public.notities for delete to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account() and (gedeeld or eigenaar = public.mijn_ouder()));
-- Supabase geeft nieuwe tabellen en functies standaard aan iedereen; hier enkel wat hierboven nodig is.
revoke all on public.ouder_taken, public.notities from anon, authenticated;
grant select, insert, update, delete on public.ouder_taken to authenticated;
grant select, insert, delete on public.notities to authenticated;
grant update (gedeeld, titel, tekst, lijst, vastgezet, bijgewerkt_op) on public.notities to authenticated;
revoke execute on function public.mijn_ouder(), public.ouder_taak_afvinken(uuid, boolean) from public, anon;
grant execute on function public.mijn_ouder(), public.ouder_taak_afvinken(uuid, boolean) to authenticated;
