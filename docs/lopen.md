# Lopen (Gezondheid)

Gebouwd op 28 oktober 2026, op vraag van Frederique: eerst zelf lopen invoeren, later een koppeling met Strava.
Onderdeel van het ouderdeel (`docs/ouderdeel.md`, groep Gezondheid). Het grotere plan met GPS-tracking in een Capacitor-app staat in `docs/loopschema.md`; dit is het eerste stuk ervan.

## Wat de ouder ziet

- **Lopen** (`/ouder/lopen`, `src/schermen/Lopen.tsx`)
  - Loop toevoegen: afstand (km), duur (`27:30`, `1:05:12` of enkel minuten), dag, soort (rustig, tempo, interval, lange duurloop, wedstrijd), hoe het ging (1 tot 5) en een notitie. Het tempo per km verschijnt meteen.
  - **Deze week** (vanaf maandag): kilometers, aantal lopen, duur, tempo, vorige week, totaal, en de snelste loop van minstens 5 km.
  - **Per week**: staafjes van de laatste 8 weken.
  - Lijst van alle lopen met aanpassen en verwijderen.
  - Een grijze kaart **Strava, komt later**.

## Privacy

Privé per ouder, net als Gewicht: RLS op `public.mijn_ouder()`. De partner en de tablets zien niets.

## Database

Migratie `20261028000300_lopen.sql`: tabel `loopsessies`. Tests in `supabase/tests/lopen.test.sql`.
Rekenwerk (tempo, duur lezen, weektotalen) in `src/lib/lopen.ts`, met tests.

## Klaar voor Strava (nog niet gebouwd)

De tabel heeft al de kolommen voor een import, zodat er later niets omgebouwd moet worden:
- `bron`: `manueel` (nu), later `strava` of `horloge`.
- `externe_id`: id van de activiteit bij de bron. `unique (eigenaar, bron, externe_id)` voorkomt dubbele imports; een import is dus een `upsert` op die sleutel.
- `hoogte_m`, `hartslag_gem` en `route` (encoded polyline) staan klaar voor gegevens die Strava meelevert; de app toont ze nog niet.
- De update-rechten van de app dekken enkel wat een ouder zelf invult; `bron` en `externe_id` kan de app niet wijzigen.

Aanpak voor later: een Edge Function die de OAuth-tokens van Strava per ouder bewaart (aparte tabel, niet leesbaar voor de app), de activiteiten van het type Run ophaalt (webhook of handmatige synchronisatie) en ze met de service-rol in `loopsessies` zet.
