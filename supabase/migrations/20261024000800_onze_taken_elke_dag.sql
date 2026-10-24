-- Onze taken: ook elke dag herhalen (gevraagd door Frederique, 24 oktober 2026).

alter table public.ouder_taken drop constraint ouder_taken_herhaling_check;
alter table public.ouder_taken add constraint ouder_taken_herhaling_check
  check (herhaling in ('eenmalig', 'dagelijks', 'wekelijks', 'maandelijks'));

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
      insert into public.ouder_taken (gezin_id, titel, datum, wie, herhaling, vorige_id)
      values (v.gezin_id, v.titel,
              (v.datum + case v.herhaling when 'dagelijks' then interval '1 day' when 'wekelijks' then interval '7 days'
                                          else interval '1 month' end)::date,
              v.wie, v.herhaling, v.id);
    end if;
  else
    update public.ouder_taken set gedaan_op = null, gedaan_door = null where id = p_taak;
    delete from public.ouder_taken where vorige_id = p_taak and gedaan_op is null;
  end if;
end $$;
