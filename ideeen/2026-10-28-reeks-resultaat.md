# Resultaat: drie nachten content in één keer (28 oktober 2026)

Op vraag van Frederique is de nachtelijke bouw drie keer achter elkaar gedaan (plan: `2026-10-28-reeks.md`). Alles is gebouwd en getest. Verhalen en kleurplaten zijn meteen beschikbaar; de spelletjes en stukken staan nog niet vrijgegeven (Kinderen → Winkelaanbod).

| | A Sinterklaas (nieuwtje 0.60) | B Kerstmis (0.61) | C Winter (0.62) |
| --- | --- | --- | --- |
| Verhaal | 35 Bram zet zijn schoen | 36 Het lichtje van de kerstboom | 37 Pip en de sneeuwman |
| Kleurplaat | Bord met pepernoten (`pepernoten`) | Kerstboom (`kerstboom`) | Sneeuwman (`sneeuwman`) |
| Spelletje (20 sterren) | Wat is er weg? (`weg`) | Lichtjesboom (`lichtjes`) | Wie is de schaduw? (`schaduw`) |
| Figuurtje | Cadeaustrik 15, Met pepernoot 15, Zak met pakjes 20 | Kerstmuts 20, Met kerstboompje 20, Kerstbal 15 | Oorwarmers 15, Met sneeuwvlok 20, Sneeuwbal 15 |
| Mijn huis | Hobbelpaard 25, Peperkoekhuisje 30, Sterrenslinger 20 | Kerstboom 30, Rendier 35, Kerstster op de deur 20 | Sneeuwman 25, IJsbaantje 35, IJspegels 20 |
| Springland (Pepernotenland) | De pakjesdaken (wolken, vogel, kers) | Het kerstbos (sneeuw, egel, appel, pittig, snelheid 1,3) | De sneeuwheuvel (sneeuw, slak, aardbei) |
| Gebouw in De wereld | Pakjeshuis (31,5; 11,6) | Kerstboomhuis (17,5; 11,6) | Iglo (5,5; 11,6) |

## Wat er veranderd is
- Logica met unit tests: `src/lib/spelletjes/weg.ts`, `lichtjes.ts`, `schaduw.ts`; schermen `Weg.tsx`, `Lichtjes.tsx`, `Schaduw.tsx` met eigen css, routes in `App.tsx`, `SCHERMEN` in `scripts/schermmeting.cjs`.
- Catalogus: migratie `20261028000200_reeks_drie.sql` (spelprijzen, 9 figuurtjestukken, 9 huisstukken, activiteitlog en omschrijving).
- Pepernotenland heeft nu vier van de zes plekjes vol (Het speculaaspad en de drie nieuwe); de volgende nacht kan nog één gewoon level bouwen en daarna de baas.
- Het robotje speelt alle drie de levels uit in Vanzelf lopen en Zelf lopen (`springen.test.ts`).
- `geluid.toon(frequentie)` toegevoegd voor de toontjes van Lichtjesboom.

## Open
- Niets rood. De spelletjes en de achttien stukken moeten nog vrijgegeven worden in Kinderen → Winkelaanbod; tot dan zijn ook de drie gebouwen in De wereld niet zichtbaar.
- E2E: de nieuwe schermen (Wat is er weg?, Lichtjesboom, Wie is de schaduw?) passen op alle tablets en liggende gsm's. Rood blijft Schrijven op een paar staande tablets (knop buiten beeld, geen wijziging van deze reeks) en twee "past nu"-waarschuwingen voor Taken op een liggende gsm (haal uit `e2e/schermen-open.ts` bij de volgende schermcontrole).
