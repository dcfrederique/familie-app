-- Herhaling om de zoveel dagen (gevraagd door Frederique, 25 oktober 2026): de ouder kiest zelf om de hoeveel dagen,
-- en tweewekelijks is een vaste keuze. Geldt voor Onze taken (ouder_taken) en voor de taken van de kinderen (taken).

-- Onze taken
alter table public.ouder_taken add column herhaal_dagen int check (herhaal_dagen between 2 and 365);
alter table public.ouder_taken drop constraint if exists ouder_taken_herhaling_soort;
alter table public.ouder_taken add constraint ouder_taken_herhaling_keuze
  check (herhaling in ('eenmalig', 'dagelijks', 'wekelijks', 'tweewekelijks', 'om_de_n_dagen', 'maandelijks')
         and ((herhaling = 'om_de_n_dagen') = (herhaal_dagen is not null)));

create or replace function public.ouder_taak_afvinken(p_taak uuid, p_gedaan boolean) returns void
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
      insert into public.ouder_taken (gezin_id, titel, datum, wie, herhaling, herhaal_dagen, vorige_id)
      values (v.gezin_id, v.titel,
              (v.datum + case v.herhaling when 'dagelijks' then interval '1 day' when 'wekelijks' then interval '7 days'
                                          when 'tweewekelijks' then interval '14 days'
                                          when 'om_de_n_dagen' then v.herhaal_dagen * interval '1 day'
                                          else interval '1 month' end)::date,
              v.wie, v.herhaling, v.herhaal_dagen, v.id);
    end if;
  else
    update public.ouder_taken set gedaan_op = null, gedaan_door = null where id = p_taak;
    delete from public.ouder_taken where vorige_id = p_taak and gedaan_op is null;
  end if;
end $$;

-- Taken van de kinderen: tweewekelijks en om de N dagen tellen vanaf de startdag.
alter type public.herhaling add value if not exists 'tweewekelijks';
alter type public.herhaling add value if not exists 'om_de_n_dagen';
alter table public.taken add column herhaal_dagen int check (herhaal_dagen between 2 and 365);
alter table public.taken add column start_dag date;
