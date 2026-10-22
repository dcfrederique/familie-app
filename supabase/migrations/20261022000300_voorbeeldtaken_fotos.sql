-- Voorbeeldtaken bij een nieuw gezin (docs/spec.md) en opslag voor foto's als bewijs.

-- voor: 'alle', 'lezers' (kan_lezen) of 'niet_lezers'.
create function public.voorbeeldtaken_toevoegen(p_gezin uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v record;
  v_taak uuid;
begin
  for v in select * from (values
    ('Tafel dekken of afruimen', 'tafel', 5, 'elke_dag', false, 'alle'),
    ('Kamer opruimen', 'kamer', 10, 'elke_dag', true, 'lezers'),
    ('Huiswerk maken', 'huiswerk', 10, 'schooldagen', false, 'lezers'),
    ('Vaatwasser uitruimen', 'vaatwasser', 5, 'elke_dag', false, 'lezers'),
    ('15 minuten lezen', 'boek', 10, 'elke_dag', false, 'lezers'),
    ('Tanden poetsen', 'tanden', 5, 'elke_dag', false, 'alle'),
    ('Speelgoed opruimen', 'speelgoed', 5, 'elke_dag', false, 'alle'),
    ('Plantjes water geven', 'plant', 5, 'elke_dag', false, 'alle'),
    ('Fiets binnenzetten', 'fiets', 5, 'elke_dag', false, 'lezers'),
    ('Pyjama aandoen', 'pyjama', 5, 'elke_dag', false, 'niet_lezers')
  ) as t(titel, prentje, sterren, herhaling, foto, voor) loop
    insert into public.taken (gezin_id, titel, prentje, sterren, herhaling, foto_nodig)
    values (p_gezin, v.titel, v.prentje, v.sterren, v.herhaling::public.herhaling, v.foto)
    returning id into v_taak;
    insert into public.taak_kinderen (taak_id, kind_id)
    select v_taak, g.id from public.gebruikers g
    where g.gezin_id = p_gezin and g.rol = 'kind'
      and (v.voor = 'alle' or (v.voor = 'lezers') = g.kan_lezen);
  end loop;
end $$;

create or replace function public.gezin_aanmaken(p_gezinsnaam text, p_mijn_naam text, p_kinderen jsonb,
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
  perform public.voorbeeldtaken_toevoegen(v_gezin);
  return v_gezin;
end $$;


revoke execute on function public.voorbeeldtaken_toevoegen(uuid) from public, anon, authenticated;

-- Foto's en tekeningen: privé per gezin, in de map <gezin-id>/ van de bucket 'fotos'.
-- Lokaal (tests) bestaat het storage-schema niet; dan wordt dit overgeslagen.
do $do$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict (id) do nothing;
    execute $p$create policy "gezin uploadt fotos" on storage.objects for insert to authenticated
      with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.mijn_gezin()::text)$p$;
    execute $p$create policy "gezin bekijkt fotos" on storage.objects for select to authenticated
      using (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.mijn_gezin()::text)$p$;
  end if;
end $do$;
