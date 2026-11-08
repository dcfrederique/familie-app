# Mijn huisdier

Gebouwd op 7 november 2026 (nieuwtje 0.110, migratie `20261107000500_huisdier.sql`), op vraag van Frederique: een huisdier als
eigen scherm bij Ik → Mijn huisdier (`/kind/:id/mijn-huisdier`), los van de wereld. Mockups: `prototypes/huisdier.html`.

- Een ouder zet het per kind aan (Kinderen → Huisdier, `/ouder/huisdier`). Het kind kiest één keer een diertje uit 12 (leeuw, olifant,
  aap, uil, dino, hond, kat, konijn, beer, pinguïn, vos, eenhoorn; eigen ontwerp in `src/lib/huisdierTekening.ts`) en een naam.
  De ouders kunnen soorten uitzetten.
- Groei: elke goedgekeurde taak sinds het kiezen is een pootje. Standaard 3 (ei komt uit), 8 (kind) en 15 (groot). Ei, baby, kind, groot.
- Verzorgen met het vrije saldo: eten 2 en wassen 1 sterren, knuffelen gratis; hoogstens 6 sterren per dag (instelbaar). Puntenlog bron
  `huisdier`, reden "Huisdier: eten (Naam)". Het zit niet in de sterrenpot en telt niet voor de schermtijd.
- Meters (buikje, schoon, blij) zijn 0 tot 5 hartjes en verliezen er één per 3, 8 en 4 uur; verzorgen kan pas als de meter niet vol is.
  Nooit verzorgd = 3 hartjes. Het huisdier wordt nooit ziek of verdrietig, hoogstens heeft het honger (geen strafpunten).
- Regels staan op de server (`huisdier_verzorgen`, leidend) en in `src/data/huisdier.ts`. Feline (kan niet lezen): alleen prentjes, de naam
  kiest de app uit de voorstellen, voorleesknop per knop.
- Nog niet: pushmelding bij honger, kleertjes of mandjes in de winkel. Het spelletje Huisdier wassen blijft los.

## Samen spelen (8 november 2026, nieuwtje 0.116)

Knop Spelen op Mijn huisdier (zodra het ei uit is) naar `/kind/:id/huisdier-spelen` (`src/schermen/HuisdierSpelen.tsx`, logica en test in
`src/lib/spelletjes/huisdierSpel.ts`). Drie spelletjes met het eigen huisdier en het thema van het kind; mockups in `prototypes/huisdier-spelen.html`.

- Verstoppertje: tik waar het huisdier zit (3 plekken, 4 voor de oudste lezer), drie rondes.
- Koekjes vangen: sleep het mandje, 12 koekjes; niveau volgt `startKastanjesNiveau`, de oudste lezer krijgt er sokken bij.
- Trucjes leren: het huisdier doet een rijtje (zit, rol, spring, zwaai) voor, het kind doet het na; drie rondes met langere rijtjes. Geleerde
  kunstjes staan per kind in localStorage (`huisdier-trucs-<kind>`), een sterretje bij de knop.
- Spelen kost niets en geeft geen sterren. Na elk spel gebeurt een gratis knuffel (`huisdier_verzorgen`), dus Blij gaat naar 5; is die al vol, dan blijft
  het bij het feestscherm. Daglimiet en aan/uit per kind zijn er (nog) niet; geen activiteitlog (geen migratie).
