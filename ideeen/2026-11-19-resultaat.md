# Resultaat 19 november 2026 (nieuwtje 0.179)

Thema: late herfst, de eerste vorst en de vogeltjes helpen.

## Gebouwd
- **Verhaal 87 "Het vogeltje op de vensterbank"** (kleine-oortjes, 4 jaar, 4 bladzijden, 302 woorden), meteen beschikbaar, met een nieuw figuur `mees` (koolmeesje) in `verhaalFiguren.tsx`.
- **Kleurplaat "De vensterbank"** (`vensterbank`, 13 vlakken, met voorbeeld), meteen beschikbaar.
- **Spelletje Blaadjes en vlokjes** (`omsluiten`, Reversi, **30 sterren**, niet vrijgegeven): blaadjes (kind) tegen vlokjes (computer).
  - Makkelijk: twee rondes op 4 × 4 tegen `zwak`, toegelaten vakjes gloeien, wiebelhulp na 10 s.
  - Middel: twee rondes op 6 × 6 tegen `gulzig` (25 % toeval), gloed en drie Tips (zet van een rekenaar van twee zetten diep).
  - Moeilijk: drie rondes (6 × 6 `diep3`, 8 × 8 `diep3`, 8 × 8 `diep4`), niets gloeit, geen Tip of hulp, pluimen per ronde (hoogstens 9).
  - Logica `src/lib/spelletjes/omsluiten.ts` (alfa-bèta met gewichten voor hoeken en randen plus beweegruimte), 16 tests; scherm `Omsluiten.tsx`, css `oms.css`, data `src/data/omsluiten.ts`.
  - `gulzig` pakt altijd een hoek en laat vakjes naast een lege hoek liever liggen: zuiver "meeste omdraaiers" was nauwelijks beter dan toeval (60 % tegen `zwak` op 6 × 6, 42 % op 8 × 8). Nu wint hij ± 95 % van `zwak`; `diep3` wint ± 95 % van `gulzig`.
- **Zes stukken** (niet vrijgegeven): oorklepmuts (hoofd 15), wintervest (shirt 20), zaadzakje (extra 15), ijslantaarn (tuin 20), sneeuwburcht (tuin 25), ijsbloemen (huisextra 20). Migratie `20261119000100_omsluiten.sql`.
- **Springland: de baas van De Speeldoos, de Bromspringpop** (`soort: 'pop'`, level `springpop`, stijl wolken): nieuw patroon `pop` in `patroon()`, tekening in `springenVeld.ts` (rode streep, spiraal, pop met muts, doos met ruiten), eilandje op de kaart. De doos loopt niet; de pop schiet kort omhoog (rode streep als telegraaf) en hangt dan moe op 4 vakjes hoogte, te hoog voor een gewone hup: je moet via een springveer op zijn muts landen. Het robotje haalt hem in Vanzelf lopen (2 raken) en Zelf lopen (4 raken) met `vallen` 0 en `omvallen` 0.
  - Afwijkingen van het plan na afstellen: `POP_HOOG` is 4 (plan 4,8), de muts raakt ook tot ± 1,7 vakje opzij (`POP_BREED` 3,4) en er staan **twee springveren** (kolom 51 en 61, 5 vakjes links en rechts van de doos): met één veer kwam het robotje na een raak aan de verkeerde kant terecht en kon het niet meer terug. De Speeldoos is nu vol. `docs/springland.md` bijgewerkt.
- Nieuwtje 0.179, e2e-test voor Blaadjes en vlokjes. Geen gebouw in De wereld.

## Open
- Het spelletje en de zes stukken staan klaar om vrij te geven in Kinderen → Winkelaanbod.
- Volgende nacht: een nieuwe wereld (De Speeldoos is vol).
