# Lopen (Gezondheid)

Gebouwd op 28 oktober 2026, op vraag van Frederique: zelf lopen invoeren. Een koppeling met Strava is geschrapt (28 oktober 2026): een Strava-API-app vraagt een abonnement, dat het gezin niet heeft.
Onderdeel van het ouderdeel (`docs/ouderdeel.md`, groep Gezondheid). Het grotere plan met GPS-tracking in een Capacitor-app staat in `docs/loopschema.md`; dit is het eerste stuk ervan.

## Wat de ouder ziet

- **Lopen** (`/ouder/lopen`, `src/schermen/Lopen.tsx`)
  - Loop toevoegen: afstand (km), duur (`27:30`, `1:05:12` of enkel minuten), dag, soort (rustig, tempo, interval, lange duurloop, wedstrijd), hoe het ging (1 tot 5) en een notitie. Het tempo per km verschijnt meteen.
  - **Deze week** (vanaf maandag): kilometers, aantal lopen, duur, tempo, vorige week, totaal, en de snelste loop van minstens 5 km.
  - **Per week**: staafjes van de laatste 8 weken.
  - Lijst van alle lopen met aanpassen en verwijderen.

## Privacy

Privé per ouder, net als Gewicht: RLS op `public.mijn_ouder()`. De partner en de tablets zien niets.

## Database

Migratie `20261028000300_lopen.sql`: tabel `loopsessies`. Tests in `supabase/tests/lopen.test.sql`.
Rekenwerk (tempo, duur lezen, weektotalen) in `src/lib/lopen.ts`, met tests.

## Kolommen voor een latere import

De tabel heeft kolommen die de app nog niet invult, zodat een import uit een bestand (GPX of FIT van een horloge, of de export van Strava) later zonder ombouw kan:
- `bron`: `manueel` (nu), later `horloge` of `strava` voor een geïmporteerd bestand.
- `externe_id`: id van de activiteit bij de bron. `unique (eigenaar, bron, externe_id)` voorkomt dubbele imports.
- `hoogte_m`, `hartslag_gem` en `route` (encoded polyline); de app toont ze nog niet.

Een rechtstreekse Strava-koppeling is onderzocht en geschrapt: de API vraagt een Strava-abonnement om een app aan te maken.
