# Resultaat bouw 9 november 2026 (Sinterklaas, kleurenrooster)

- **Verhaal 54** "De pakjes op de schappen" (315 woorden) en **kleurplaat** "De pakjesstelling" (15 vlakken): meteen beschikbaar.
- **Spel Kleurenrooster** (sleutel `rooster`, 25 sterren, niet vrijgegeven): kindersudoku met pakjes. Makkelijk: 3 × 3, 5 of 6 vaste pakjes, fouten meteen rood, hulp met een lichtend vakje. Middel: 4 × 4, 7 tot 9 vaste pakjes, fouten meteen rood. Moeilijk: 6 × 6 met blokken van 2 × 3, 11 tot 14 vaste pakjes, geen meldingen, Controleer met misstappen, klokje en pluimen. Elke ronde is gegenereerd met een unieke oplossing (oplosser telt tot 2). Logica en tests: `src/lib/spelletjes/rooster.ts`.
- Afwijkingen van het plan: de laatste ronde van moeilijk heeft 11 vaste pakjes (niet 10, de generator haalt 10 niet betrouwbaar); er is geen aparte controle dat de puzzel zonder raden oplosbaar is (alleen unieke oplossing); pakjes kiezen gaat met tikken (vakje, dan kleur).
- **Stukken** (niet vrijgegeven): ruitjesmuts, ruitjesshirt, doosje kleurpakjes, rek met pakjes, kleurenhekje, ruitjesgordijn; migratie `20261109000100_rooster.sql`.
- **Springland**: De onweerswolkjes (derde level van Wolkenrijk, pittig: 115 breed, drie gaten van 3 en 2 + 2 + 2, drie vogels, twee vlaggetjes); het robotje speelt het uit in beide besturingen.
- **Wereld**: Pakjesstelling op (20,3; 18) in het Meer, met gouden rand; de wereldtests slagen.
- Nieuwtje 0.117.

Schermmeting Kleurenrooster: 20/20 tablets en 2/2 gsm voor Luca, Yuna en Feline. E2E: 80 geslaagd, 1 rood (yuna figuurtje iPad 9.7 staand 768×1024, kast-acties buiten beeld), dat faalt ook op main zonder deze wijzigingen.
