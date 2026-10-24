# Ontwerp

Schermontwerp (13 schermen, Memory, Rekenen en Verhaal lezen zijn speelbaar): https://claude.ai/artifact/Rq77oaeJTRsa5rZ7Y5YDM9

## Lettertypes

- Titels en cijfers: **Baloo 2** (600, 700, 800)
- Tekst: **Nunito** (600, 700, 800)
- Ouderschermen: **Manrope** (500, 600, 700) voor titels en tekst, soberder dan de kinderkant (zie `docs/ouderdeel.md`).

## Kleuren (licht thema)

| Rol | Kleur |
| --- | --- |
| Achtergrond | `#EEF3F8` (Luca: `#E8EEF6`) |
| Vlak | `#FFFFFF` |
| Tekst | `#1C2433` |
| Gedempte tekst | `#4E5A6B` |
| Lijn | `#D5DCE4` |
| Ster | `#F2B33D` met rand `#B8800F`; badge `#FFF4D6` / tekst `#6B4A00` |
| Gedaan / goed | `#1F7A4A` op `#DDF2E6` |
| Luca | `#2D6BD6` op `#E3EDFC`; banner `#16264A` |
| Yuna | `#C2541A` op `#FCE9DD` |
| Feline | `#1F7A4A` op `#DDF2E6` |
| Verhalen | `#7A3DB0` op `#F1E6FA` |

Het donkere thema staat uitgewerkt in de CSS-variabelen van `prototypes/spelletjes.html`.

## Iconen en prenten

- Iconen: eigen lijniconen in een 24 × 24 viewBox, stroke 2, afgeronde hoeken en uiteinden.
- Prenten: vlakke SVG-vormen, effen kleuren, geen verlopen; nachtscènes op `#1E2D55`.
- Geen beschermde personages of logo's.
- App-icoon (gekozen 24 oktober 2026): C, "Onder één dak", het hele gezin als figuurtjes in een huisje met een ster op de schoorsteen. De vier voorstellen staan in `docs/iconen/`; `node scripts/maak-iconen.ts` tekent ze opnieuw (ook `public/icon.svg`).

## Layout

- Kinderen: tablet liggend 1194 × 834; taken in een raster van 3 kolommen links, activiteiten (2 × 2) en de knop Extra tijd vragen rechts.
- Feline: 4 grote taakkaarten op één rij, activiteiten als grote ronde knoppen zonder tekst.
- Ouders: gsm 390 × 844, kaarten met afgeronde hoeken (20 px), navigatie onderaan.
- Afgeronde hoeken bij kinderen: 28 tot 40 px; knoppen volledig rond.
