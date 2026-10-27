-- Voorraad: het gezin eet standaard met 6 (twee ouders, drie kinderen en Maxim van anderhalf, die geen app-gebruiker is maar wel mee-eet).
-- Deze migratie is anders altijd opnieuw te draaien; scripts/migraties.sh herkent een al gedraaide migratie aan zo'n fout (42710).
do $$ begin
  if (select column_default from information_schema.columns where table_schema = 'public' and table_name = 'voorraad_instellingen' and column_name = 'eters') = '6' then
    raise exception 'Zes eters staat al ingesteld' using errcode = '42710';
  end if;
end $$;

alter table public.voorraad_instellingen alter column eters set default 6;

create or replace function public.voorraad_gekookt(p_dag date, p_overslaan boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare
  gezin uuid := public.mijn_gezin();
  gerecht text;
  r public.recepten;
  eters int;
  teller int := 0;
  i record;
begin
  if not public.is_ouder_account() then raise exception 'Alleen een ouder boekt de voorraad af'; end if;
  select m.gerecht into gerecht from public.weekmenu m where m.gezin_id = gezin and m.dag = p_dag;
  if gerecht is null then raise exception 'Er staat niets op het weekmenu voor die dag'; end if;
  if exists (select 1 from public.voorraad_gekookt where gezin_id = gezin and dag = p_dag) then
    raise exception 'Die dag is al afgeboekt';
  end if;
  if not p_overslaan then
    select * into r from public.recepten where gezin_id = gezin and lower(btrim(naam)) = lower(btrim(gerecht));
    if not found then raise exception 'Er is geen recept voor %', gerecht; end if;
    select coalesce((select vi.eters from public.voorraad_instellingen vi where vi.gezin_id = gezin), 6) into eters;
    for i in select * from public.recept_ingredienten where recept_id = r.id loop
      perform public.voorraad_bijstellen(i.artikel_id, -round(i.hoeveelheid * eters / r.personen, 3), 'recept', gerecht);
      teller := teller + 1;
    end loop;
  end if;
  insert into public.voorraad_gekookt (gezin_id, dag, gerecht, overgeslagen) values (gezin, p_dag, gerecht, p_overslaan);
  return teller;
end $$;
