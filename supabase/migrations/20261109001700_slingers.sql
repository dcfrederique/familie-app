-- Lus 9 november 2026, ronde 7 (Sinterklaas, Koek en de slingers): het spelletje Slingers ophangen (30 sterren) en zes nieuwe stukken.
-- Ze beginnen niet vrijgegeven (standaard_vrij = false): de ouders geven ze vrij in Kinderen → Winkelaanbod.

alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'pompoen', 'bladeren', 'ketting', 'schoen', 'weg', 'lichtjes', 'schaduw', 'verkleed', 'doolhof', 'winterslaap', 'kastanjes', 'pakjesschuiven', 'stippen', 'inpakken', 'daken', 'delen', 'lantaarns', 'kistslot', 'buizen', 'verschillen', 'vieropeenrij', 'weegschaal', 'torens', 'rooster', 'geheim', 'zoeken', 'hekjes', 'vlek', 'schuif', 'bruggen', 'slingers', 'zelf_gelezen', 'schrijven', 'springen'));

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
    when 'rooster' then 'Kleurenrooster'
    when 'geheim' then 'Geheime prent'
    when 'zoeken' then 'Pepernoten zoeken'
    when 'hekjes' then 'Hekjes zetten'
    when 'vlek' then 'Verflopen'
    when 'schuif' then 'Schuifpuzzel'
    when 'bruggen' then 'Bruggen bouwen'
    when 'slingers' then 'Slingers ophangen'
    when 'springen' then 'Springland' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    else 'Tekenen'
  end
$$;

insert into public.spel_prijzen (sleutel, prijs) values ('slingers', 30);

insert into public.figuurtje_stukken (soort, sleutel, prijs) values
  ('hoofd', 'slingermuts', 15), ('shirt', 'lampjestrui', 20), ('extra', 'toeter', 10);

insert into public.huis_stukken (soort, sleutel, prijs) values
  ('tuin', 'slingerpalen', 25), ('tuin', 'feesttafel', 30), ('tuin', 'ballonnentros', 20);
