-- Pakjestoren (nachtelijke uitbreiding 8 november 2026): het spelletje Pakjestoren (25 sterren) en zes nieuwe stukken.
-- Ze beginnen niet vrijgegeven (standaard_vrij = false): de ouders geven ze vrij in Kinderen → Winkelaanbod.
-- De catalogus hieronder moet gelijk blijven aan src/data/spelletjes.ts, figuurtje.ts en huis.ts.


-- Pakjestoren komt in het activiteitlog (telt mee als speeltijd, levert geen sterren op).
alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'pompoen', 'bladeren', 'ketting', 'schoen', 'weg', 'lichtjes', 'schaduw', 'verkleed', 'doolhof', 'winterslaap', 'kastanjes', 'pakjesschuiven', 'stippen', 'inpakken', 'daken', 'delen', 'lantaarns', 'kistslot', 'buizen', 'verschillen', 'vieropeenrij', 'weegschaal', 'torens', 'zelf_gelezen', 'schrijven', 'springen'));

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
    when 'winterslaap' then 'Winterslaap'
    when 'kastanjes' then 'Kastanjes vangen'
    when 'pakjesschuiven' then 'Pakjes schuiven'
    when 'stippen' then 'Lampion tekenen'
    when 'inpakken' then 'Inpakpuzzel'
    when 'daken' then 'Paard op het dak'
    when 'delen' then 'Eerlijk delen'
    when 'lantaarns' then 'Lantaarns aansteken'
    when 'kistslot' then 'Het kleurenslot'
    when 'buizen' then 'Chocomelkbuizen'
    when 'verschillen' then 'Zoek de verschillen'
    when 'vieropeenrij' then 'Vier op een rij'
    when 'weegschaal' then 'Weegschaal'
    when 'torens' then 'Pakjestoren'
    when 'springen' then 'Springland' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    else 'Tekenen'
  end
$$;

insert into public.spel_prijzen (sleutel, prijs) values ('torens', 25);

insert into public.figuurtje_stukken (soort, sleutel, prijs) values
  ('hoofd', 'bouwhelm', 15), ('shirt', 'werkvest', 20), ('extra', 'pakjestapel', 15);

insert into public.huis_stukken (soort, sleutel, prijs) values
  ('tuin', 'pakjestoren', 25), ('tuin', 'bezorgkar', 25), ('huisextra', 'wimpels', 20);
