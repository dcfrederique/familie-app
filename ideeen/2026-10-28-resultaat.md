# Resultaat bouw 28 oktober 2026

Thema: de voorpret van Sinterklaas (plan: `ideeen/2026-10-28.md`).

## Gebouwd
- **Verhaal 34** "Detective Daan en de verdwenen wortel" (Avonturiers, 8+). Het plan had 10 bladzijden, maar de reeks laat er hoogstens 8 toe (`verhalen.test.ts`): bladzijde 1 en 2 en bladzijde 5 en 6 zijn samengevoegd. Twee kleine nieuwe voorwerpen in `verhaalFiguren.tsx`: `schoen` en `wortel`.
- **Kleurplaat** "Schoen met pakjes" (13 vlakken, gratis, meteen beschikbaar).
- **Spelletje Schoen vullen** (`src/lib/spelletjes/schoen.ts` + test, `src/schermen/Schoen.tsx`), 20 sterren, drie niveaus, 6 opdrachten per ronde, kaartje met cijfer, lekkers en stippen, tikken (geen slepen), Klaar-knop met hint te veel of te weinig. Niet vrijgegeven. Ook in `scripts/schermmeting.cjs` (`SCHERMEN`) gezet voor de schermtests.
- **Stukken** (niet vrijgegeven): figuurtje Feestmuts 25, Met cadeautje 20, Schaaltje pepernoten 15; Mijn huis Stapel pakjes 20, Wortelbed 15, Schoentje voor de deur 15. Migratie `20261028000100_schoorsteenhuisje.sql`.
- **Springland**: nieuwe wereld Pepernotenland (stijl snoep) met Het speculaaspad (gewoon level, egels, vlaggetje op kolom 60). Het robotje speelt het uit in beide besturingen.
- **De wereld**: Schoorsteenhuisje op (41,8; 11,6) tegels in het dorp, `spel: 'schoen'`, gouden rand tot 11 november, slot tot aankoop. De tests voor bereikbaarheid en deurmat blijven groen.
- Nieuwtje 0.56 en `docs/wereld.md` bijgewerkt.

## Controles
Lint, 350 tests, build en `scripts/test-db.sh` groen. Browsercheck in de demo: Schoen vullen volledig doorgespeeld op Luca (moeilijk, 1194 × 834, geen scrollen, geen fouten in de console, fout Klaar toont de hint), kleurplaat in de lijst; tekeningen van de stukken en het gebouw bekeken.

## Open
- Niet op een echte tablet bekeken; de schermtests (`SCHERMEN`) draaien in de nachtelijke schermcontrole. Voorleesopnames voor het verhaal en de nieuwe zinnen ontbreken nog.
- De volgende nacht begint in Pepernotenland (tweede level), tenzij het thema een andere keuze vraagt.
