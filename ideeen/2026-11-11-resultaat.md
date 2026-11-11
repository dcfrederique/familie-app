# Resultaat 2026-11-11 (nachtelijke bouw)

Thema: Sinterklaas, de pakjes bezorgen. Nieuwtje 0.156.

## Gebouwd
- **Verhaal 79** "Pip duwt de pakjes" (kleine oortjes, 4 jaar, 4 bladzijden, 314 woorden, decor `straat`).
- **Kleurplaat** "De bezorgfiets" (`bezorgfiets`, 16 vlakken, gratis).
- **Spelletje Pakjes bezorgen** (`bezorgen`, 25 sterren, niet vrijgegeven): een duwpuzzel; borden worden achterwaarts gegenereerd en zijn dus altijd oplosbaar (test).
  Makkelijk: 5 puzzels op 5 × 5 tot 5 × 6 met 1 of 2 pakjes, voetstapjes na tien seconden zonder zet. Middel: 6 puzzels op 6 × 6 tot 6 × 7 met 2 of 3 pakjes, drie tips.
  Moeilijk: 3 rondes op 7 × 8 tot 8 × 9 met 4, 5 en 6 pakjes, geen hulp, één Terug per ronde, pluimen (3 binnen 1,6 keer de kortste oplossing en 120 s per ronde, 2 binnen 3 keer, anders 1) en een klokje.
  Bediening met vier pijlknoppen, vegen op het bord of de pijltjestoetsen.
- **Stukken** (niet vrijgegeven): figuurtje Bezorgpet (15), Bezorgjas (20), Pakjestas (15); Mijn huis Welkomstmat (15), Bakfiets met pakjes (25), Gouden huisnummer (15). Migratie `20261111000100_bezorgen.sql`.
- **Springland**: Het dakterras, vierde gewone level van Dakenstad (stijl weide, slakken, drie gaten van 2, trapje, springveer met hoog plankje). Robotje haalt het in Vanzelf lopen en Zelf lopen.
- Geen gebouw in De wereld (regel van 9 november).

## Afwijkingen van het plan
- De kleurplaat heeft 16 in plaats van 15 vlakken (lantaarnpaal erbij gerekend).
- De pluimen van moeilijk tellen de zetten tegenover de kortste oplossing die de zoektocht vindt (of de generator, als die korter is).

## Tests
- Zie het eindverslag in de thread: vitest, build, lint, `scripts/test-db.sh`, e2e en `scripts/schermcontrole.cjs --scherm bezorgen` (Luca, Yuna, Feline: 20/20 tablets en 2/2 gsm).
