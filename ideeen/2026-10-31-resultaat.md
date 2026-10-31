# Resultaat 2026-10-31

Plan: `ideeen/2026-10-31.md` (thema winterslaap). Alles gebouwd volgens het plan.

## Gebouwd
- **Verhaal 40 "Slaap lekker, Bram"** (Grote ogen, 6+, 8 bladzijden, 341 woorden), `src/data/verhalen/40-slaap-lekker-bram.json`.
- **Kleurplaat `egelbed` "Egel in zijn bedje"**: 15 vlakken, ingekleurd voorbeeld, `kleurplaten.test.ts` groen.
- **Spelletje Winterslaap** (sleutel `winterslaap`, **25 sterren**, niet vrijgegeven): `src/lib/spelletjes/winterslaap.ts` (+ 12 unit tests), `src/schermen/Winterslaap.tsx` + `winterslaap.css`, niveaus in `src/data/spelletjes.ts`.
  - makkelijk: 3 × 2, een tik wisselt enkel dat bedje, 2 tot 3 wakker, hint na 5 s.
  - middel: 3 × 3 met kriebel naar de buren, kortste oplossing 2 tot 4, hint na 8 s.
  - **moeilijk: 5 × 5 (Lights Out)**, kortste oplossing minstens 4, 6, 8 en 10 tikken in de vier rondes (hoogstens +2), tikkenlimiet = kortste + 2 (maantjes), geen hints, Terug en Van voor af. Testen bewijzen dat moeilijk merkbaar zwaarder is dan middel.
- **Zes stukken** (niet vrijgegeven): figuurtje Slaapmuts (15), Met maantje (20), Knuffelbeer (20); Mijn huis Berenhol (30), Voedertafel (20), Maanlampje (15).
  - Afwijking van het plan: het plan noemde "Schoorsteenrook" (15), maar de bestaande schoorsteen heeft al rook (`huis-rook`). Het derde huisstuk is daarom een **Maanlampje** boven de deur (huisextra `maanlamp`, 15).
- **Springland**: nieuwe derde wereld **Winterbergen** (stijl sneeuw) met het level **Het slaapbos** (stijl bos, egel, aardbei, 112 breed, vlaggetje halverwege, niet pittig). Het robotje speelt het uit in vanzelf en zelf lopen.
- **Gebouw Winterhol** op (36,5; 21,5): de eerste twee plekken van het plan, (28,5; 21,5) en daarna die, faalden in `kaart.test.ts`; (36,5; 21,5) slaagt. Tekening in `wereldPrenten.ts`, teken `🐻 🌙`.
- Migratie `20261031000100_winterslaap.sql`, nieuwtje **0.78**, `docs/wereld.md` en `docs/springland.md` bijgewerkt, regel over de moeilijke stand in CLAUDE.md (ontwerpfase).

## Tests
Lint (enkel oude waarschuwingen), `npm test` (402), `scripts/test-db.sh`, `npm run build`: groen.

## Schermen en e2e
- Winterslaap past zonder scrollen op alle tablets (liggend en staand) en de twee gsm's liggend voor alle kinderen (`scripts/schermcontrole.cjs --scherm winterslaap`).
- `npx playwright test`: 57 geslaagd, 18 rood, **geen daarvan door Winterslaap**. Het is Luca (moeilijkste stand sinds de commit "Moeilijkste stand van de spelletjes een pak moeilijker" van 30 oktober): Herfstketting scrolt horizontaal, Wat is er weg? en Verkleedkist scrollen verticaal op meerdere tablets, plus enkele oude "past nu" meldingen (taken). De schermcontrole van 05:07 herstelt die.
