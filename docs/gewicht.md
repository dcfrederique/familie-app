# Gewicht (Gezondheid)

Gebouwd op 24 oktober 2026, op vraag van Frederique. Onderdeel van het ouderdeel (`docs/ouderdeel.md`, groep Gezondheid).

## Wat de ouder ziet

- **Gewicht** (`/ouder/gewicht`, `src/schermen/Gewicht.tsx`)
  - Bovenaan snel een weging toevoegen (gewicht en dag, standaard vandaag). Eén weging per dag: opnieuw wegen op dezelfde dag vervangt de vorige.
  - **Laatste weging** met het verschil over 7 en 30 dagen en hoeveel kg nog tot het doelgewicht.
  - **BMI** met de klasse (ondergewicht, gezond gewicht, overgewicht, obesitas), een balk met de zones, de leeftijd, de lengte en het gezonde gewicht voor die lengte.
  - **Grafiek** van alle wegingen (3 maanden, 1 jaar of alles), met een stippellijn voor het doelgewicht en een groene band voor het gezonde gewicht. Aanraken of erover bewegen toont gewicht en datum.
  - Lijst van de wegingen, met verwijderen.
  - Een grijze kaart **Dieetassistent, komt later** als plaats voor een latere AI-assistent.
- **Mijn profiel** (`/ouder/profiel`, `src/schermen/MijnProfiel.tsx`): geboortedatum, lengte, gewicht van vandaag (wordt een weging) en doelgewicht.

## Regels

- BMI = gewicht / lengte² (m). Gezond volgens de WHO: 18,5 tot 25. Vanaf 70 jaar gebruiken we ruimere grenzen, 22 tot 28. Rekenwerk in `src/lib/gewicht.ts` (met tests).
- De app toont er een korte nuance bij: BMI zegt niets over spieren of buikomtrek.

## Privacy

- Privé per ouder: alleen de ouder zelf leest en schrijft zijn profiel en wegingen. De partner ziet ze niet, de tablets van de kinderen ook niet (RLS op `public.mijn_ouder()`, dat null is op een tablet).
- Op een tablet staat Gezondheid niet in het menu; de schermen tonen daar enkel een melding.

## Database

Migratie `20261024001000_gewicht.sql`: tabellen `gezondheid_profielen` (één rij per ouder) en `wegingen` (uniek per ouder en dag). Tests in `supabase/tests/gewicht.test.sql`.

## Later

- Dieetassistent: een AI-bot om te raadplegen over eten en het doel, met de wegingen en het weekmenu als context. Nog niet beslist welk model of welke dienst (Azure OpenAI of Claude).
- Eventueel delen met de partner (schakelaar), zoals bij Notities.
