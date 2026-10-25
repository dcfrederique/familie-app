-- Nachtelijke uitbreiding 25 oktober 2026 (thema Halloween, ideeen/2026-10-25.md): het spelletje Pompoenen maken en
-- zes nieuwe stukken (3 voor het figuurtje, 3 voor Mijn huis). Alles is te koop met sterren (docs/winkel.md) en ligt
-- pas in de winkel na vrijgave door een ouder (docs/winkelaanbod.md): standaard_vrij blijft false.
-- De catalogus hieronder moet gelijk blijven aan src/data/spelletjes.ts, figuurtje.ts en huis.ts
-- (spelletjes.test.ts, figuurtje.test.ts en huis.test.ts controleren dat).

-- Pompoenen maken komt in het activiteitlog (telt mee als speeltijd, levert geen sterren op).
alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'pompoen', 'zelf_gelezen'));

create or replace function public.activiteit_omschrijving(p_activiteit text, p_inhoud jsonb) returns text
language sql immutable set search_path = '' as $$
  select case p_activiteit
    when 'rekenen' then 'Rekenen: ' || coalesce(p_inhoud ->> 'goed', '0') || ' van '
                        || coalesce(p_inhoud ->> 'sommen', '10') || ' in één keer goed'
    when 'verhaal' then 'Verhaal: ' || coalesce(p_inhoud ->> 'titel', 'uitgelezen')
    when 'zelf_gelezen' then 'Zelf gelezen: ' || coalesce(p_inhoud ->> 'titel', 'verhaal')
                             || coalesce(' (' || (p_inhoud ->> 'goed') || ' van ' || (p_inhoud ->> 'woorden') || ' woorden)', '')
    when 'kleurplaat' then 'Kleurplaat: ' || coalesce(p_inhoud ->> 'titel', 'afgewerkt')
    when 'memory' then 'Memory'
    when 'penalty_schieten' then 'Penalty''s schieten'
    when 'penalty_keepen' then 'Penalty''s keepen'
    when 'racen' then 'Racen'
    when 'basket' then 'Basket'
    when 'koken' then 'Koken' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'touwspringen' then 'Touwspringen'
    when 'huisdier' then 'Huisdier wassen' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'puzzel' then 'Puzzel' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'pompoen' then 'Pompoenen maken'
    else 'Tekenen'
  end
$$;

-- standaard_vrij is false (de standaard): de ouders geven ze vrij in Kinderen → Winkelaanbod.
insert into public.spel_prijzen (sleutel, prijs) values ('pompoen', 25);

insert into public.figuurtje_stukken (soort, sleutel, prijs) values
  ('hoofd', 'heksenhoed', 25), ('shirt', 'pompoen', 20), ('extra', 'lantaarn', 15);

insert into public.huis_stukken (soort, sleutel, prijs) values
  ('tuin', 'pompoenen', 15), ('tuin', 'vogelverschrikker', 25), ('huisextra', 'vleermuisjes', 20);
