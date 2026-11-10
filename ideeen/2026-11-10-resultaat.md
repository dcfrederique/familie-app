# Resultaat 2026-11-10 (nachtelijke bouw)

Thema: Sinterklaas, de stoomboot komt aan. Nieuwtje 0.144.

## Gebouwd
- **Verhaal 78** "Drie op de kade" (grote-ogen, 6 jaar, 8 bladzijden, 380 woorden, decor `kust`): Daan en Noor leggen pakjes in groepjes van drie.
- **Kleurplaat** "De stoomboot komt aan" (`intochtboot`, 16 vlakken, gratis).
- **Spelletje Pakjessets** (`sets`, 25 sterren, niet vrijgegeven): drie pakjes zijn een set als bij elke eigenschap (kleur, versiering, strik, grootte)
  alle drie hetzelfde of alle drie verschillend zijn. Makkelijk: 2 eigenschappen, 3 × 3 pakjes, twee gegeven en je zoekt het derde (5 rondjes),
  een knipperend pakje na tien seconden zonder tik. Middel: 3 eigenschappen, 12 pakjes, zes sets zoeken, uitleg welke eigenschap niet klopt, drie tips.
  Moeilijk: 4 eigenschappen, 16 pakjes, drie rondes van 6, 8 en 10 sets, geen hulp, vijf strafseconden per foute set, klokje en pluimen
  (3 zonder fout en binnen 160 s per ronde, 2 met hoogstens twee fouten, anders 1). Er ligt altijd minstens één set op tafel.
- **Stukken** (niet vrijgegeven): figuurtje Matrozenmuts (15), Matrozenshirt (20), Verrekijker (15); Mijn huis Lantaarn aan de kade (20),
  Kadekar met pakjes (25), Scheepsbel (15). Migratie `20261110000500_sets.sql`.
- **Springland**: De dakgoten, derde level van Dakenstad (stijl sneeuw, vogels, pittig, vier gaten van 3, twee schoorsteentjes). Robotje haalt het in Vanzelf lopen en Zelf lopen.
- Geen gebouw in De wereld (regel van 9 november).

## Afwijkingen van het plan
- **Springland**: de baas Bromzwam (en de nieuwe wereld Dakenstad met twee levels) waren intussen al gebouwd door de lus van 10 november. Dit plan vroeg de baas; daarom is het
  nieuwe level een gewoon (pittig) level in Dakenstad.
- **Moeilijk**: de knop "Er is geen set meer" is weggelaten, want de logica laat altijd minstens één set liggen en de knop zou dus altijd fout zijn.
- **Kadekar** en de andere stuk-ids: `pakjeskar` bestond al als `bezorgkar`, dus het huisstuk heet `kadekar`; de scheepsbel zit onder `huisextra`.
- Een plank laag boven of vlak voor een gat blokkeert de sprong van het robotje; de planken van De dakgoten liggen daarom op afstand van de gaten (in docs/springland.md genoteerd).

## Tests
- `npx vitest run`: 715 geslaagd; `npm run build` groen; `scripts/test-db.sh` groen (migratie en catalogus gelijk).
- `scripts/schermcontrole.cjs --scherm sets` voor Luca, Yuna en Feline: 20/20 tablets (liggend en staand) en 2/2 gsm liggend.
