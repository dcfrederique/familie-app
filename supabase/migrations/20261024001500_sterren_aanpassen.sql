-- Een ouder geeft sterren bij of neemt ze af (bv. sterren verdiend buiten de app, of kwijtgeraakt).
-- Het komt in het puntenlog met bron 'ouder' en een reden. Afnemen kan nooit meer dan het vrije saldo:
-- sterren die gereserveerd zijn voor een tijdverzoek blijven staan.

alter table public.puntenlog drop constraint puntenlog_bron_check;
alter table public.puntenlog add constraint puntenlog_bron_check
  check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie', 'welkom', 'aankoop', 'ouder'));

create function public.sterren_aanpassen(p_kind uuid, p_delta int, p_reden text default null, p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
  v_reden text := nullif(btrim(coalesce(p_reden, '')), '');
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000 then
    raise exception 'aantal sterren ongeldig';
  end if;

  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  if p_delta < 0 and public.saldo(p_kind) - public.gereserveerd(p_kind) < -p_delta then
    raise exception 'te weinig vrije sterren (de rest is gereserveerd voor extra tijd)';
  end if;

  insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip, door)
  values (v_kind.gezin_id, p_kind, p_delta,
          case when p_delta > 0 then 'Van mama of papa erbij' else 'Van mama of papa af' end
            || coalesce(': ' || left(v_reden, 100), ''),
          'ouder', public.nu(), v_ouder);
  return 'aangepast';
end $$;

revoke execute on function public.sterren_aanpassen(uuid, int, text, text) from public, anon;
grant execute on function public.sterren_aanpassen(uuid, int, text, text) to authenticated;
