# Loop-feature – MVP-plan ("light Strava" voor de ouders)

## Context
- Onderdeel van de bestaande familie-app (PWA).
- Doelgroep: de twee ouders. Geen kinderfeatures in deze feature.
- **Enkel Android.** Geen iOS-ondersteuning nodig.
- De native app wordt gebouwd met **Capacitor** rond de bestaande PWA-code.
- **Enkel gratis libraries**; backend op Azure met zo weinig mogelijk kosten.

## Scope MVP
**Erin**
- Run starten, pauzeren en stoppen
- Live tijd, afstand en tempo (min/km)
- Route achteraf op een kaart
- Runs opslaan + geschiedenis per ouder
- Weektotaal per ouder
- Eenvoudige gezinsfeed met kudos / kort bericht

**Bewust (nog) niet**
- Trainingsschema's, audio-cues, persoonlijke records, uitdagingen
- Strava-/Garmin-koppeling
- iOS

## Stack (allemaal gratis)
| Onderdeel | Keuze |
|---|---|
| Native shell | Capacitor (Android) |
| GPS op achtergrond | `@capacitor-community/background-geolocation` |
| Lokale opslag | `@capacitor-community/sqlite` |
| Kaart | Leaflet + OpenStreetMap-tiles (bronvermelding tonen) |
| Backend | Azure Functions (Consumption-plan) |
| Opslag backend | Azure Table Storage (of Cosmos DB free tier) |

Live tracking alleen activeren als `Capacitor.isNativePlatform()` true is; in de gewone PWA enkel weergave en handmatig loggen.

## Datamodel
```ts
type Run = {
  id: string;
  ouder: string;            // profiel-id
  bron: "telefoon" | "horloge";
  start: string;            // ISO-datum
  eind: string;
  afstandM: number;
  duurS: number;            // zonder pauzes
  route: string;            // encoded polyline
  kudos: { van: string; bericht?: string }[];
};
```

## Fasen

### Fase 1 – Basis
- Capacitor + Android-platform toevoegen aan de bestaande PWA.
- Background-geolocation-plugin installeren.
- Testknop die GPS-punten logt.
- ✅ Klaar als: punten blijven binnenkomen met scherm uit en telefoon in de zak.

### Fase 2 – Tracking
- Start / pauze / stop + timer (pauzetijd telt niet mee).
- Punten met nauwkeurigheid slechter dan 20 m negeren.
- Starten met tellen pas als de eerste punten nauwkeurig genoeg zijn.
- Afstand via haversine tussen opeenvolgende punten; tempo in min/km.
- Live scherm met grote cijfers: tijd, km, tempo.
- ✅ Klaar als: een gelopen testrondje een realistische afstand geeft (±5%).

### Fase 3 – Opslaan
- Run eerst lokaal in SQLite (werkt zonder netwerk).
- Na afronden synchroniseren naar Azure Function → Table Storage.
- Route opslaan als encoded polyline (één string).
- Geen live sync van individuele punten.
- ✅ Klaar als: een run zonder netwerk later alsnog synchroniseert.

### Fase 4 – Weergave
- Leaflet-kaart met de route als polyline + samenvatting.
- Lijst met runs per ouder + weektotaal.
- ✅ Klaar als: elke opgeslagen run opent met correcte kaart en cijfers.

### Fase 5 – Gezinslaag
- Twee ouderprofielen.
- Feed met runs van beide ouders, kudos en een kort bericht.

### Fase 6 – Verspreiden
- Signed APK bouwen in Android Studio.
- Installeren op beide telefoons (of interne test via Play).

### Fase 7 – Smartwatch (na de MVP)
- Workouts van het horloge inlezen via **Health Connect** op de telefoon
  (afstand, duur, hartslag, route indien beschikbaar).
- Via een community-Capacitor-plugin of een kleine eigen Kotlin-plugin.
- Geïmporteerde runs krijgen `bron: "horloge"`.
- Alternatief: handmatige GPX-import.
- Geen eigen Wear OS-app.

## Aandachtspunten Android
- **Batterijoptimalisatie**: sommige merken (Samsung, Xiaomi) stoppen de tracking. Gebruiker vragen de app uit te zonderen.
- **Android 13+**: meldingspermissie vragen, anders verschijnt de verplichte trackingmelding niet.
- **Android 14+**: foreground service moet type `location` hebben; controleren in het manifest.
- **Permissies**: locatie (ook op achtergrond) duidelijk uitleggen aan de gebruiker.

## Kosten
- Alle libraries gratis / open source.
- Azure Functions en Table Storage blijven bij dit gebruik binnen de gratis quota of op enkele centen per maand.
- OSM-tiles: gratis bij laag gebruik, bronvermelding verplicht.

## Open vragen
- Welk merk en model smartwatch? (bepaalt of synchronisatie naar Health Connect werkt) **Nog open.**
- Welk frontend-framework en welke backendstructuur gebruikt de familie-app nu? **Beantwoord, zie hieronder.**

## Huidige stack van de familie-app (ingevuld uit de repo, 24 oktober 2026)
- **Frontend:** React 19 + Vite, als PWA (`vite-plugin-pwa`), in TypeScript.
- **Backend:** Supabase (Postgres met RLS, Auth, Edge Functions in `supabase/functions`). Migraties staan in `supabase/migrations` en lopen automatisch via CI bij elke groene main.
- **Hosting:** Azure Static Web Apps, auto-deploy vanuit GitHub (`docs/hosting.md`). Er draait dus nog geen Azure Functions of Table Storage in dit project.
- **Ouderdeel:** het loopschema komt in de menugroep **Gezondheid** (`src/data/ouderMenu.ts`), naast Gewicht en Mijn profiel. Gezondheidsdata is privé per ouder (RLS op `mijn_ouder()`, zie `docs/gewicht.md`).

## Suggestie: Supabase in plaats van Azure Functions + Table Storage
Dit overschrijft de keuze hierboven niet; het is een voorstel om te wegen.
- **Opslag van runs** past in een gewone Postgres-tabel `runs` (kolommen uit het datamodel, `route` als tekst, kudos in een tabel `run_kudos`). Geen tweede backend, geen extra CORS of sleutelbeheer.
- **Authenticatie en privacy** bestaan al: dezelfde RLS-patronen als bij `wegingen` en `gezondheid_profielen`. Gezinsfeed = RLS die beide ouders laat lezen.
- **Sync vanaf SQLite** (fase 3) wordt een `upsert` met `supabase-js` op `id`, dus herhaalde sync is veilig.
- **Kosten:** het Supabase-project bestaat al; geen nieuwe Azure-resources om gratis te houden.
- **Migraties** lopen al automatisch via CI.
- Azure Functions blijft zinvol als je bewust alles op Azure wilt, maar dan moeten auth, opslag en CI er apart bij.
- De rest van de stack (Capacitor, background-geolocation, SQLite, Leaflet) blijft ongewijzigd.

## Opmerking bij `docs/ouderdeel.md`
Daar staat het loopschema als opbouwschema in weken (bijvoorbeeld 0 naar 5 km) met afvinken. Dit plan is een trackingfunctie en sluit trainingsschema's bewust uit. Te beslissen of dat later een aparte laag bovenop deze MVP wordt.
