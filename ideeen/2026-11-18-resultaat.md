# Resultaat 18 november 2026 (nieuwtje 0.175)

Thema: Sinterklaas, een heel klein cadeau dat toch groot wordt.

## Gebouwd
- **Verhaal 86 "Het kleinste pakje"** (avonturiers, 8 jaar, 7 bladzijden, 544 woorden), meteen beschikbaar.
- **Kleurplaat "Het inpaktafeltje"** (`inpaktafel`, 13 vlakken, met voorbeeld), meteen beschikbaar.
- **Spelletje Linten verbinden** (`linten`, **30 sterren**, niet vrijgegeven): verbind paren pakjes met een lint, linten mogen niet kruisen. Borden worden gegenereerd uit een Hamiltonpad dat in stukken geknipt wordt (altijd oplosbaar).
  - Makkelijk: 4 × 4 (3 kleuren) twee keer en 5 × 5 (4 kleuren), vakjes mogen leeg blijven, hulp na 10 s.
  - Middel: 6 × 6 (5 kleuren) twee keer en 7 × 7 (6 kleuren), drie Tips.
  - Moeilijk: 9 × 9 (8 kleuren), 10 × 10 (9) en 10 × 10 (10), **elk vakje moet gevuld zijn**, geen hulp, Tip of teken bij een verbonden kleur, pluimen volgens het aantal strepen (hoogstens 9). Een zoeker heeft hier veel meer werk dan op middel (getest).
  - Logica `src/lib/spelletjes/linten.ts` + 12 tests, scherm `Linten.tsx` (slepen met pointer events), css `lint.css`.
- **Zes stukken** (niet vrijgegeven): pakpapierhoed (hoofd 15), lintshirt (shirt 20), het grote boek (extra 15), lintboog (tuin 25), brievenbus voor de Sint (tuin 20), pepernotenkrans (huisextra 20). Migratie `20261118000100_linten.sql`.
- **Springland, De Speeldoos level 5 "De draaimolen"** (gewoon, strand, 4 egels, gaten 3, 2 en 3, 2 vlaggetjes): het robotje haalt het in Vanzelf lopen en Zelf lopen. De Speeldoos heeft nu vijf gewone levels; de baas volgt. `docs/springland.md` bijgewerkt.
- Nieuwtje 0.175, e2e-test voor Linten verbinden. Geen gebouw in De wereld.

## Controles
- Lint, 879 unit-tests, `scripts/test-db.sh` en build groen.
- Schermcontrole `--scherm linten` op Luca, Yuna en Feline: 20/20 tablets en 2/2 gsm liggend; e2e 97 van 97 groen.

## Open
- Het spelletje en de zes stukken staan klaar om vrij te geven in Kinderen → Winkelaanbod.
- Volgende nacht: de baas van De Speeldoos (zesde plekje).
