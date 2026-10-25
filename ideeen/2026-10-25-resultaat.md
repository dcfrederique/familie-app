# Resultaat 2026-10-25 (Halloween)

Plan: `ideeen/2026-10-25.md`. Alles is gebouwd; lint, tests (180), build en `scripts/test-db.sh` zijn groen.

## Gebouwd
- **Verhaal 31 "Boe het spookje"** (`src/data/verhalen/31-boe-het-spookje.json`, reeks Grote ogen, 11 bladzijden, 326 woorden), meteen beschikbaar. Drie nieuwe figuren voor de prenten in `verhaalFiguren.tsx`: `pompoen` (mod `lantaarn`), `spookje` (mod `lampion`) en `lampion`.
- **Pompoenen maken** (sleutel `pompoen`, **25 sterren**, 13 voor wie niet leest): logica + 6 tests in `src/lib/spelletjes/pompoen.ts`, scherm `src/schermen/Pompoen.tsx` binnen `SpelKader` (route `/kind/:id/pompoen`), stijl `pompoen.css`, niveaus en vormen als data in `src/data/spelletjes.ts`. Vijf kaartjes per ronde, lichtknop, eigen pompoenen bewaren (max 6, op het toestel). Levert geen sterren op, komt in het activiteitlog (`pompoen`) en telt als speeltijd.
- **Zes stukken**: figuurtje Heksenhoed (25), Met pompoen (20), Pompoenlantaarn (15); huis Pompoenen (15), Vogelverschrikker (25), Papieren vleermuisjes (20). Tekeningen in `src/lib/figuurtje/tekenen.ts` en `src/lib/huis/tekenen.ts`.
- **Migratie** `supabase/migrations/20261025000300_halloween.sql`: rij in `spel_prijzen`, `figuurtje_stukken`, `huis_stukken` (alles `standaard_vrij` false, dus niet vrijgegeven) en `pompoen` in de activiteit-check en `activiteit_omschrijving`.
- Nieuwtje bovenaan `src/data/nieuwtjes.ts` (met nieuw veld `stukken`).

## Afwijkingen van het plan
- **Makkelijk heeft 3 mondvormen in plaats van 2**: met 2 vormen bestaat er maar één mogelijk kaartje (lach is de beginvorm), dus elk kaartje was gelijk.
- **Nieuwe huisstukken staan niet bij Feline** (`prenten` false): er mogen maximaal zes keuzes per soort zijn voor wie niet leest (`huis.test.ts`) en die zijn al bezet.
- **Verhaal heeft 11 bladzijden**: de test liet voor Grote ogen 5 tot 6 toe; dat is 5 tot 11 geworden omdat CLAUDE.md 300 tot 600 woorden vraagt. De tests tellen nu ook geen vaste 30 verhalen meer maar controleren de nummering zonder gaten.
- Geen aparte thema-prentjes per kindthema voor het spel (het menu gebruikt een eigen icoon, zoals de andere spelletjes).
- Tests aangepast voor latere migraties: `spelletjes.test.ts`, `figuurtje.test.ts`, `huis.test.ts` (catalogus ook uit de nieuwe migratie) en `supabase/tests/figuurtje.test.sql` (aantal prijzen minstens 9 in plaats van precies 9).

- `scripts/migraties.sh` (proefdraaien op de testdatabase in CI) kende alleen fouten als 'tabel bestaat al'; een migratie die enkel catalogusrijen toevoegt faalt met 23505 (rij bestaat al). Die code telt nu ook als 'al gedraaid'. De eerste CI-run na de bouw faalde daar op; de fix staat in de tweede commit.

## Open punten
- **Vrijgeven**: spel en stukken staan klaar in Kinderen → Winkelaanbod ("Nieuw, nog niet vrijgegeven").
- **Voorleesstem**: de opnames voor verhaal 31 en de nieuwe zinnen (`pompoenUitleg`, `pompoenKlaar`) moeten nog met `scripts/maak-stem.ts` gemaakt worden; tot dan leest de tabletstem voor.
- **Prenten**: de nieuwe figuren zijn eigen vlakke tekeningen in de stijl van de bestaande verhaalfiguren, nog niet de nieuwe prentstijl.
- Het scherm van het spel is niet in een browser op een tablet bekeken; de tekeningen zijn wel gerenderd en nagekeken.
