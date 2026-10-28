# Lopen: wat achter de Strava-betaalmuur zit en wat we zelf kunnen maken

Plan (28 oktober 2026, op vraag van Frederique). Niets hiervan is gebouwd; kies later wat je wilt. Uitgangspunt: de lopen staan al in `loopsessies` (`docs/lopen.md`), met afstand, duur, dag, soort, gevoel en, via Strava, hoogte, hartslag en route. Wat Strava in het betaalde abonnement verkoopt is meestal rekenwerk op die gegevens, en dat kunnen we zelf, privé per ouder en gratis.

Overzicht, van weinig werk en veel nut naar meer werk:

| # | Idee | Strava-abonnement | Nodig aan gegevens | Werk |
|---|---|---|---|---|
| 1 | Doelen (week, maand, jaar) met voortgang en prognose | Goals (gratis ook, maar beperkt) | enkel wat er al is | klein |
| 2 | Persoonlijke records en trend (beste 1 km, 5 km, 10 km, halve) | Best efforts / PR-historiek | `best_efforts` van Strava | klein tot middel |
| 3 | Weekverslag en vergelijking met vorige weken | Weekly summary, Year in Sport | enkel wat er al is | klein |
| 4 | Schoenen-teller (kilometers per paar, waarschuwing bij ±700 km) | Gear tracking (gratis) | `gear_id` van Strava, of zelf kiezen | klein |
| 5 | Hartslagzones en tempo-zones per loop | Zones, Relative Effort | gemiddelde en liefst per-seconde hartslag | middel |
| 6 | Trainingsbelasting en vorm: fitness, vermoeidheid, frisheid | Fitness & Freshness, Relative Effort | hartslag of ervaren inspanning | middel |
| 7 | Race-voorspelling (5 / 10 km / halve / marathon) | Gedeeltelijk (Athlete Intelligence) | recente goede lopen | klein |
| 8 | Persoonlijke heatmap | Personal Heatmaps | `route` (polyline) | middel |
| 9 | Routes, rondjes herkennen en vergelijken | Segments, Route Builder | polyline | groot |
| 10 | Opbouwschema (bv. 0 naar 5 km) met afvinken, gekoppeld aan echte lopen | Training plans | niets extra | middel |

## Per idee

**1. Doelen.** Een doel per periode (bv. 100 km deze maand, 1000 km dit jaar, 3 lopen per week). Scherm toont voortgang, "je moet nog X km per dag" en een prognose met het huidige tempo. Tabel `loopdoelen` (ouder, periode, soort doel, waarde), privé zoals de rest.

**2. Records.** Strava levert in de detailgegevens van een activiteit `best_efforts` (snelste 400 m, 1 km, 1 mijl, 5 km, 10 km, …) binnen die loop. Bewaren in een `jsonb`-kolom en per afstand de beste tijd plus de evolutie tonen. Voor handmatige lopen kunnen we enkel de volledige loop als record rekenen (bv. een loop van 5,0 tot 5,5 km telt als 5 km-poging). Nieuw record = een bericht in de app.

**3. Weekverslag.** Elke maandag een kaart: km, aantal lopen, tijd, tempo, vergelijking met de vorige week en het gemiddelde van de laatste 8 weken, langste loop. Eventueel als melding op de gsm (bestaande web-push). Geen nieuwe gegevens nodig.

**4. Schoenen.** Eigen lijst met schoenen (naam, start, maximum km); elke loop krijgt een schoen (Strava stuurt `gear_id` mee, de naam halen we eenmalig op). Teller en een waarschuwing.

**5. Zones.** Maximale hartslag instellen (of 220 − leeftijd, met geboortedatum uit Mijn profiel) en zones 1 tot 5; per loop de tijd per zone vraagt de per-seconde-hartslag (Strava "streams", een extra oproep per loop). Zonder streams: enkel de zone van het gemiddelde.

**6. Belasting en vorm.** Per loop een inspanningsscore: TRIMP uit hartslag en duur, of als er geen hartslag is een schatting uit duur × gevoel (1 tot 5) × soort. Daarna dezelfde methode als de bekende fitness-grafieken: fitness (CTL) = exponentieel gewogen gemiddelde over ±42 dagen, vermoeidheid (ATL) over ±7 dagen, vorm = fitness − vermoeidheid. Eén lijngrafiek met drie lijnen (zoals de gewichtsgrafiek) en een zin als "je bent frisser dan normaal" of "pas op, de laatste week was zwaar". Zonder dure data blijft het een schatting, dat zeggen we erbij. Dit is het onderdeel waar het abonnement het meest voor betaald wordt.

**7. Voorspelling.** Uit de beste recente loop van minstens 3 km de tijd op andere afstanden met de formule van Riegel (T2 = T1 × (D2 / D1)^1,06). Eenvoudig, met de nuance dat het enkel klopt als je ook echt traint voor die afstand.

**8. Heatmap.** De polylines van alle lopen decoderen en over een kaart tekenen (Leaflet + OpenStreetMap, zoals gepland in `docs/loopschema.md`; bronvermelding tonen). Alles blijft op onze eigen server. Eerst een kaart per loop, daarna alle lopen samen.

**9. Routes.** Rondjes herkennen door routes te vergelijken (zelfde start en eind, vergelijkbare lengte) en ze te groeperen: "je 5 km-rondje in het park: 12 keer, beste 24:10, trend −35 s over 3 maanden". Echte Strava-segmenten kopiëren we niet; een eigen lichte versie met herkende rondjes volstaat.

**10. Opbouwschema.** Zoals in `docs/ouderdeel.md`: een schema in weken (bv. 3 keer per week afwisselend lopen en wandelen), "volgende training" op Vandaag, en een training wordt vanzelf afgevinkt als er die dag een loop binnenkomt (Strava of manueel). Sluit aan op het eerdere plan "Plan voor het loopschema".

## Gegevens die we er bij moeten bewaren

Nu staan in `loopsessies`: afstand, duur, soort, gevoel, notitie, hoogte, gemiddelde hartslag, route. Voor het plan zijn later nodig:
- `max_hartslag`, `best_efforts jsonb`, `gear_id`/`schoen_id`, `splits jsonb` (tijd per km, komt gratis mee in het detail van een activiteit).
- Per-seconde-gegevens (streams) bewaren we liever niet: groot, en meestal overbodig. Bij de import rekenen we de zones uit en bewaren enkel de uitkomst.

## Voorwaarden van Strava

De voorwaarden voor de Strava-API zijn streng over wat je met de gegevens mag: ze enkel aan de atleet zelf tonen, geen verkoop of delen met anderen, en (sinds 2024) niet gebruiken om AI-modellen te trainen. Onze aanpak (privé per ouder, berekeningen in de eigen app) past daarbij, maar lees de actuele voorwaarden na voor je iets bouwt dat gegevens van de twee ouders samen toont, zoals een gezinsklassement. Dat laten we daarom weg.

## Voorstel voor een volgorde

1. Eerst de Strava-koppeling aan de praat (`docs/strava.md`).
2. Doelen (1) en weekverslag (3): snel, veel zichtbaar nut.
3. Records (2) en voorspelling (7).
4. Belasting en vorm (6) met zones (5): het hoofdstuk dat het abonnement vervangt.
5. Heatmap (8), schoenen (4), dan routes (9) en het opbouwschema (10).
