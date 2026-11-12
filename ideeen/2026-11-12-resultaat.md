# Resultaat 2026-11-12 (nachtelijke bouw)

Thema: Sinterklaas, de stalstraat. Nieuwtje 0.158.

## Gebouwd
- **Verhaal 80** "De kar van de Sint zit vast" (grote-ogen, 6 jaar, 8 bladzijden, 435 woorden, decor `straat` en `kamer`).
- **Kleurplaat** "Het stalletje van het paard" (`sintstal`, 14 vlakken, gratis).
- **Spelletje Kar vrij!** (`karvrij`, 30 sterren, niet vrijgegeven): file-puzzel; karren schuiven alleen in hun eigen richting, de rode kar moet naar de poort.
  Slepen met de vinger of tikken op een kar en een pijl (opeenvolgende vakjes van dezelfde kar tellen als één zet; Terug neemt een hele zet terug).
  Makkelijk: 5 × 5, 3 tot 6 karren, 2 tot 6 zetten, 5 puzzels, een kar wiebelt na tien seconden zonder zet. Middel: 6 × 6, 6 tot 9 karren, 6 tot 12 zetten, zes puzzels, 3 tips.
  Moeilijk: drie rondes (6 × 6 met 18 tot 22 zetten, 7 × 7 met boompjes in de weg en 22 tot 28 zetten, 7 × 7 met 30 tot 35 zetten), geen hulp of tip, Terug maximaal twee keer per ronde,
  pluimen (3 binnen 1,3 keer het minimum en 300 s, 2 binnen 2 keer, anders 1) en een klokje.
  De puzzels zijn vooraf gemaakt met `scripts/karvrij-maken.ts` (willekeurig bord, hele toestandsruimte doorzocht, moeilijkste toestand in het bereik) en staan als data in `src/data/karvrij.ts`; de test lost er elk met een breedte-eerst-zoektocht op en controleert het minimum.
- **Stukken** (niet vrijgegeven): figuurtje Stalhoed (15), Staljas (20), Wortelbosje (15); Mijn huis Hooikar (25), Drinkbak voor het paard (15), Hoefijzer boven de deur (`deurhoefijzer`, 15). Migratie `20261112000100_karvrij.sql`.
- **Springland**: De torenspits, vijfde en laatste gewone level van Dakenstad (pittig, stijl wolken, snelle vogels, vier gaten, muurtje, plankje met aardbeien, springveer met hoog plankje). Robotje haalt het in Vanzelf lopen en Zelf lopen. Nu mist alleen de baas van Dakenstad.
- Geen gebouw in De wereld (regel van 9 november).

## Afwijkingen van het plan
- De borden worden niet bij het starten gemaakt maar staan als vooraf berekende data (sneller op een tablet, deterministisch te testen). Ronde 2 van moeilijk heeft 22 tot 28 in plaats van 24 tot 28 zetten (7 × 7 met 12 karren en 2 tot 4 boompjes), omdat de generator geen grotere voorbeelden in redelijke tijd vond.
- Makkelijk heeft tot 6 andere karren in de laatste puzzels, en in ronde 5 en 6 een stap hoger dan gepland, zodat de rondes oplopen.
- Het huisstuk heet `deurhoefijzer` (`hoefijzer` bestaat al bij het figuurtje); Wortelbosje lijkt op het bestaande Wortel voor het paard maar is een bosje zonder mandje.

## Tests
- `npx vitest run`: 792 geslaagd; `npm run build` groen; `scripts/test-db.sh` groen; lint zonder nieuwe waarschuwingen.
- `scripts/schermcontrole.cjs --scherm karvrij` voor Luca, Yuna en Feline: 20/20 tablets (liggend en staand) en 2/2 gsm liggend.
