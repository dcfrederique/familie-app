# Springland

Platformspel van opzij waarin het kind met zijn eigen figuurtje loopt en springt (gevraagd door de kinderen,
25 oktober 2026). Spelregels en besturing: `docs/spelletjes.md`, Springland. Dit document gaat over de
**landkaart met werelden** en hoe er levels bijkomen.

## Landkaart

- Na het openen van Springland staat het kind op de landkaart, van bovenaf gezien (zoals een oude
  platformgame-wereldkaart). Elke wereld is een eigen stuk land (bordje met de naam, eigen kleur en versiering);
  tussen twee werelden loopt een riviertje met een bruggetje. Na de laatste wereld ligt mist met een vraagteken:
  daar komen nieuwe werelden.
- Elk level is een rond plekje op één slingerend pad. Tik op een plekje en het figuurtje wandelt erheen langs het
  pad (ook langs de plekjes ertussen); daar aangekomen begint het level. Tik op het plekje waar je al staat om
  meteen te spelen. De kaart schuift mee met het figuurtje en is met de vinger te verschuiven.
- Uitgespeeld = gouden rand en het record (sterren en fruit); op slot = grijs met een slotje (een tik geeft een
  schuddend plekje en voor wie niet leest de zin "Speel eerst het level ervoor").
- Lege plekjes (stippelrand) tonen hoeveel levels er nog in een wereld passen.
- Na een level: **Volgend level** (of **Nieuwe wereld!** bij de overgang) gaat terug naar de kaart; het figuurtje
  wandelt zelf naar het volgende plekje en start het.

## Vrijspelen

- De speelvolgorde is de volgorde van `springLevelLijst`. Een level is open als het vorige uitgespeeld is; een
  wereld uitspelen opent dus de eerste plek van de volgende wereld.
- Bewaard per kind op de tablet (localStorage, zoals de records): `springen-af-<level>-<kind>`,
  `record-springen-<level>-<kind>` en waar het figuurtje staat (`springen-plek-<kind>`). Bij Spelletjes proberen
  (ouders) staat alles open en wordt niets bewaard.
- Geen server nodig: het spelletje zelf koopt het kind één keer in de winkel (30 sterren); levels kosten niets.

## Een level toevoegen (ook de nachtelijke bouw)

Alles is data in `src/data/springen.ts`; de kaart, het pad en het vrijspelen volgen vanzelf.

1. Zet een nieuw item **achteraan** `springLevelLijst` met een nieuwe, vaste `id` (kleine letters, nooit meer
   wijzigen: records hangen eraan), `wereld`, `stijl`, `naam` (kort, voor op de kaart), `beestje`, `fruit` en de
   `kaart` (11 rijen van gelijke lengte, de bovenste rij leeg, 90 tot 150 kolommen, `P` links en `H` rechts).
2. Wereld: hoogstens `levelsPerWereld` (5) levels per wereld. Is de laatste wereld vol, voeg dan eerst een nieuwe
   wereld toe achteraan `springWerelden` (`id`, `naam`, `stijl`: groen, zand, sneeuw of snoep) en zet het level daarin.
3. Stijl van het level: weide, bos, wolken, strand of sneeuw. Een nieuwe stijl kan, maar vraagt code: een rij in
   `kleuren` en een achtergrond in `springenVeld.ts`, en een icoon in `StijlIcoon` (`SpringKaart.tsx`). Een nieuwe
   wereldstijl vraagt een rij in `wereldKleur` en versiering in `Versiering`.
4. Moeilijkheid: elk level iets anders dan het vorige, niet altijd moeilijker. Gaten hoogstens 3 vakjes breed,
   een opstapje hoogstens 2 vakjes hoog, na een springpaddenstoel minstens 4 vakjes grond voor een gat, niets
   recht boven een paddenstoel, en een beestje minstens 4 vakjes van een gat (het wandelt 2 vakjes heen en weer).
   Laat het aansluiten bij het seizoen of feest (CLAUDE.md, "Seizoenen en feesten") via naam, stijl en fruit.
5. Draai `npm test`: `springen.test.ts` laat een robotje elk level uitspelen (vanzelf en zelf lopen) zonder te
   vallen en `springKaart.test.ts` controleert werelden en volgorde. Lukt het robotje niet, pas dan de kaart aan.
6. Nieuwtje met het volgende versienummer: "Springland: nieuw level <naam> in <wereld>".
