-- Herfstvakantie (nachtelijke uitbreiding 30 oktober 2026): Doolhof van de eekhoorn (20 sterren) en zes nieuwe stukken.
-- Ze beginnen niet vrijgegeven (standaard_vrij = false): de ouders geven ze vrij in Kinderen → Winkelaanbod.
-- De catalogus hieronder moet gelijk blijven aan src/data/spelletjes.ts, figuurtje.ts en huis.ts.

-- Het doolhof komt in het activiteitlog (telt mee als speeltijd, levert geen sterren op).
alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'pompoen', 'bladeren', 'ketting', 'schoen', 'weg', 'lichtjes', 'schaduw', 'verkleed', 'doolhof', 'zelf_gelezen', 'schrijven', 'springen'));

create or replace function public.activiteit_omschrijving(p_activiteit text, p_inhoud jsonb) returns text
language sql immutable set search_path = '' as $$
  select case p_activiteit
    when 'rekenen' then 'Rekenen: ' || coalesce(p_inhoud ->> 'goed', '0') || ' van '
                        || coalesce(p_inhoud ->> 'sommen', '10') || ' in één keer goed'
    when 'verhaal' then 'Verhaal: ' || coalesce(p_inhoud ->> 'titel', 'uitgelezen')
    when 'zelf_gelezen' then 'Zelf gelezen: ' || coalesce(p_inhoud ->> 'titel', 'verhaal')
                             || coalesce(' (' || (p_inhoud ->> 'goed') || ' van ' || (p_inhoud ->> 'woorden') || ' woorden)', '')
    when 'kleurplaat' then 'Kleurplaat: ' || coalesce(p_inhoud ->> 'titel', 'afgewerkt')
    when 'schrijven' then 'Schrijven'
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
    when 'bladeren' then 'Bladeren sorteren'
    when 'ketting' then 'Herfstketting'
    when 'schoen' then 'Schoen vullen'
    when 'weg' then 'Wat is er weg?'
    when 'lichtjes' then 'Lichtjesboom'
    when 'schaduw' then 'Wie is de schaduw?'
    when 'verkleed' then 'Verkleedkist'
    when 'doolhof' then 'Doolhof van de eekhoorn'
    when 'springen' then 'Springland' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    else 'Tekenen'
  end
$$;

insert into public.spel_prijzen (sleutel, prijs) values ('doolhof', 20);

insert into public.figuurtje_stukken (soort, sleutel, prijs) values
  ('hoofd', 'regenhoed', 15), ('shirt', 'paddenstoel', 20), ('extra', 'zaklamp', 15);

insert into public.huis_stukken (soort, sleutel, prijs) values
  ('tuin', 'speeltent', 30), ('tuin', 'regenton', 20), ('huisextra', 'windwijzer', 20);
