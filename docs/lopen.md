# Lopen (Gezondheid)

Gebouwd op 28 oktober 2026, op vraag van Frederique: zelf lopen invoeren. Een koppeling met Strava is geschrapt (28 oktober 2026): een Strava-API-app vraagt een abonnement, dat het gezin niet heeft.
Onderdeel van het ouderdeel (`docs/ouderdeel.md`, groep Gezondheid). Het grotere plan met GPS-tracking in een Capacitor-app staat in `docs/loopschema.md`; dit is het eerste stuk ervan.

## Wat de ouder ziet

- **Lopen** (`/ouder/lopen`, `src/schermen/Lopen.tsx`)
  - Loop toevoegen: afstand (km), duur (`27:30`, `1:05:12` of enkel minuten), dag, soort (rustig, tempo, interval, lange duurloop, wedstrijd), hoe het ging (1 tot 5) en een notitie. Het tempo per km verschijnt meteen.
  - **Deze week** (vanaf maandag): kilometers, aantal lopen, duur, tempo, vorige week, totaal, en de snelste loop van minstens 5 km.
  - **Per week**: staafjes van de laatste 8 weken.
  - Lijst van alle lopen met aanpassen en verwijderen.

## Analyse en loopschema (28 oktober 2026)

Mockup: `prototypes/loop-analyse.html`; plan en uitleg van de formules: `docs/loop-analyse.md`. Rekenwerk in `src/lib/loopanalyse.ts` en `src/lib/loopschema.ts` (met tests), schermen `src/schermen/LoopAnalyse.tsx` (`/ouder/lopen-analyse`) en `src/schermen/Loopschema.tsx` (`/ouder/loopschema`), migratie `20261028000600_lopen_analyse.sql`.

- **Analyse:** voortgang (tempo met gemiddelde van de laatste 5 lopen, vergeleken met de periode ervoor), doelen (km per maand of jaar, lopen per week, met prognose), weekverslag, records (1, 5, 10 km en halve, geschat uit het tempo van de hele loop), belasting en vorm (fitness ±6 weken, vermoeidheid ±1 week, inspanning uit duur × soort × hoe het ging), voorspelling met Riegel, schoenen (kilometers uit de lopen plus een startstand) en lopen per weekdag.
- **Loopschema:** doel, aantal keer per week, lange loop nu en startdag zijn de enige opgeslagen waarden (`loopschemas`); de weken worden berekend. De lange loop groeit hoogstens 10% per week (minstens een halve km), om de vierde week is het een rustweek, het schema stopt na twee pieklopen. Een training is afgevinkt als er die week een loop van minstens 90% van de afstand is.
- **Later:** een AI-assistent (Azure) die een schema voorstelt; de knop staat grijs op het scherm.

## Privacy

Privé per ouder, net als Gewicht: RLS op `public.mijn_ouder()`. De partner en de tablets zien niets.

## Database

Migratie `20261028000300_lopen.sql`: tabel `loopsessies`. Tests in `supabase/tests/lopen.test.sql`.
Rekenwerk (tempo, duur lezen, weektotalen) in `src/lib/lopen.ts`, met tests.

## Kolommen voor een latere import

De tabel heeft kolommen die de app nog niet invult, zodat een import uit een bestand (GPX of FIT van een horloge, of de export van Strava) later zonder ombouw kan:
- `bron`: `manueel`, `horloge` of `strava` (geïmporteerd bestand) of `android` (de Android-app Trackd, zie onder).
- `externe_id`: id van de activiteit bij de bron. `unique (eigenaar, bron, externe_id)` voorkomt dubbele imports.
- `hoogte_m`, `hartslag_gem` en `route` (encoded polyline); de app toont ze nog niet. `route` is een encoded polyline (Google-formaat, precisie 5).

Een rechtstreekse Strava-koppeling is onderzocht en geschrapt: de API vraagt een Strava-abonnement om een app aan te maken.

## Trackd (Android)

De Android-app Trackd stuurt lopen rechtstreeks naar `loopsessies` met bron `android` en `externe_id` = UUID van de loop. Ze voegt in met `on_conflict=eigenaar,bron,externe_id` en `resolution=ignore-duplicates`, zonder eigenaar of gezin: de kolomstandaarden (`mijn_ouder()`, `mijn_gezin()`) vullen die in voor de ingelogde ouder; rechten en RLS blijven zoals ze waren. Migratie `20261029000200_loopsessies_android.sql`. In het Lopen-scherm staat zo'n loop als "via Trackd".
