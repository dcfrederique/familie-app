# Schrijven met de vinger

Gratis leerdeel naast Rekenen, Verhalen en Kleurplaten (25 oktober 2026 gevraagd door Frederique): een letter, woord of lijntje staat in lichtgrijs en het kind volgt het met de vinger. Tegel **Schrijven** op het startscherm, route `/kind/:id/schrijven`, scherm `src/schermen/Schrijven.tsx`.

## Hoe het werkt

- Elke letter heeft lijnen in de volgorde waarin je ze schrijft (`src/data/schrijven.ts`, kleine blokletters). Een woord zet de letters achter elkaar.
- Het kind begint bij de gekleurde stip (met een nummertje bij letters met meer dan één streepje, zoals de `k`) en schuift die met de vinger mee. Het gevolgde stuk kleurt in de kleur van het kind (`--kid`), een afgewerkt woord wordt groen.
- Het spoor is een rij punten op gelijke afstand (`src/lib/schrijven/spoor.ts`, getest). De vinger moet binnen een marge van de lijn blijven (groter voor wie niet leest) en kan per keer maar een stukje vooruit springen: afsnijden of kriskras kleuren brengt je niet verder. Loslaten en later verder gaan mag, bij de stip.
- Een rondje is **vijf opdrachten**; daarna een eindscherm met sterren en "Nog een rondje".

## Niveaus (chips bovenaan, de keuze wordt per kind op het toestel onthouden)

| Niveau | Inhoud | Start voor |
| --- | --- | --- |
| Lijntjes | strepen, golf, zigzag, bergjes, cirkels, lussen (voorbereiding op letters) | wie niet leest (Feline, 4) |
| Letters | 17 kleine letters, bij sommige een prentje ("z van zon") | |
| Korte woorden | zon, vis, boot, dino, auto, appel, bal, kat, pen, sok, bos, kar; prentje waar we er een hebben | andere lezers (Yuna, 6) |
| Lange woorden | raket, ballon, voetbal, kasteel, vulkaan, dinosaurus, raceauto, pannenkoek | de oudste lezer (Luca, 8) |

Wie niet leest hoort bij elke opdracht de letter of het woord (bij lijntjes de uitleg) en heeft een voorleesknop; wie leest ziet een uitlegzin onder het blad. Thema, licht en donker volgen de rest van de kindschermen.

## Sterren

Beslist: **3 sterren per afgewerkt rondje van vijf opdrachten**, zoals een kleurplaat, meteen erbij zonder goedkeuring van een ouder, binnen het dagplafond voor activiteiten en het spaarmaximum (`docs/winkel.md`). Schrijven is een rustige, lerende activiteit en telt dus niet mee voor de app-tijd. De server rekent het zelf uit: activiteit `schrijven` met `items >= 5` (migratie `20261025000500_schrijven.sql`, spiegel in `src/lib/regels.ts`).

## Nog niet gebouwd

Hoofdletters, cijfers, verbonden schrift en eigen woorden van de ouders. De nieuwe voorleeszinnen (`schrijfUitleg`, `schrijfKlaar`) gebruiken de tabletstem tot `scripts/maak-stem.ts` ze inspreekt.
