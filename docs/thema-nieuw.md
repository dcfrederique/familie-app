# Nieuwe kinderthema's als data (7 november 2026)

Naast Dino's en auto's (race), Prinsessenkasteel, Feeëntuin en Voetbal (eigen code in `ThemaDelen.tsx` en
`thema-schermen.css`) zijn er thema's die **volledig uit data** bestaan: Ruimte-avontuur (`ruimte`), Onderwaterwereld (`zee`),
Dierenvriendjes (`dier`), Wolkenland (`wolk`), Snoepbakkerij (`bak`) en Dierenkliniek (`kliniek`).
Mockups: projectmap `schermen/thema-nieuw/`.

## Een thema toevoegen = één rij in `src/data/dataThemas.ts`

Een rij (`DataThema`) bevat alles:

- `sleutel` (ook de kleur van het kind, de banner en de klasse `thema-<sleutel>`), `naam`, `kidKleur` (naambordje in De wereld),
  `shirt` (bestaande kleur voor figuurtje-shirt en huisdeur), `verhouding` (tegelhoogte), `ondertitels` per scherm, `klaarTekst` en `nogTeDoen`.
- `licht` en `donker`: de kleurtokens (`bg`, `surface`, `soft`, `ink`, `muted`, `line`, `shade`, `kid`, `kid-tint`, `on-solid`) plus eigen `tn-…`
  tokens voor de prent (`tn-banner`, `tn-titel`, `tn-sub`, `tn-spoor` zijn verplicht). De css (licht, donker, `.kleur-…`, banner, tegels) wordt
  uit deze data gemaakt (`dataThemaCss`) en één keer in de pagina gezet; je schrijft zelf geen css.
- `prent`: SVG-inhoud, getekend op 220 hoog (zie `wikkel`), met `style="fill:var(--tn-…)"` voor kleuren die in donker anders zijn.
  Klassen `tn-nacht` (alleen in donker) en `tn-dag` (alleen in licht) via de tokens `tn-nacht`/`tn-dag` (`none` of `inline`).
  Dezelfde prent wordt kleiner en rechts getekend in de banner en de kop van de subschermen (`dataThemaPrent`), zodat titel en knoppen vrij blijven.
- `voortgang` (`'regenboog'` of een mover en doel), `nieuw`, `vink`, `slot` en `feest`: kleine SVG's in viewBox −22 −22 44 44 (nieuw, vink en slot −24 −24 48 48).
- `tegelRadius` en `tegelRand`: vorm van de spelletjestegels en verhaalkaarten. Houd tegels groot genoeg: tekst mag niet worden afgeknipt (geen cirkels).

## Ook nodig bij een nieuw thema

1. Sleutel toevoegen aan `Kleur` (`src/data/gezin.ts`), `Banner` (`src/data/thema.ts`) en `bannerVoorKleur`.
2. Een migratie die de sleutel toevoegt aan de lijsten in `welkom_afronden` en `thema_kiezen` (zie `20261107000400_nieuwe_themas.sql`).
3. Een nieuwtje bovenaan `src/data/nieuwtjes.ts`.
4. Controleren op een tablet (1194 × 834) en een lage gsm liggend (844 × 390), licht en donker, zonder scrollen.

Een thema is geen winkelitem: een kind kiest het zelf bij Mijn thema, een ouder bij Kinderen.
