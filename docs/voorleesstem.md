# Vlaamse voorleesstem met Azure Speech (stappenplan)

Stand: 24 oktober 2026. Nog niets gebouwd; dit is het plan.

## Kort

Vandaag leest de app voor met de stem van de tablet (`src/lib/voorlezen.ts`, Web Speech API). Die stem is Nederlands of Vlaams afhankelijk van het toestel, klinkt robotachtig en meldt niet altijd woordgrenzen, zodat het oplichten van woorden soms geschat is.

Voorstel: de 30 verhalen (en de vaste zinnen in de spelletjes) **één keer** laten inspreken door een Vlaamse neurale stem van Azure AI Speech, de mp3's met woordtijden **mee in de app** zetten, en op de tablet gewoon die bestanden afspelen. Wat niet vooraf gekend is (namen, taaktitels, getallen) blijft de tabletstem gebruiken.

**Dit blijft gratis**, en ruim:

| | Waarde |
| --- | --- |
| Gratis tier (F0) neurale stemmen | 500.000 tekens per maand ([prijzen](https://azure.microsoft.com/pricing/details/speech/)) |
| Alle 30 verhalen samen (175 bladzijden + titels) | ±20.700 tekens, geteld op de JSON in `src/data/verhalen/` |
| Dus | alle verhalen ±24 keer per maand opnieuw maken past nog in het gratis deel |
| Wat als het op is? | F0 rekent niets aan: verzoeken worden geweigerd tot de volgende maand. Er is geen factuur mogelijk. |
| Snelheidslimiet F0 | 20 verzoeken per minuut ([limieten](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits)); alle verhalen maken duurt dus ±10 minuten |
| Batch-synthese | niet beschikbaar op F0, en ook niet nodig |

Omdat de audio vooraf gemaakt wordt en in de repo staat, gebruikt de app Azure **nooit tijdens het spelen**. De sleutel komt nooit in de app. Valt het Azure-abonnement ooit weg (bv. als de Visual Studio-licentie stopt), dan blijven alle bestaande opnames gewoon werken; alleen nieuwe verhalen inspreken kan dan niet meer.

Over het Visual Studio-abonnement: F0 kost niets, dus het tegoed wordt niet aangesproken. De voorwaarde "dev/test only" (zie `docs/azure.md`) geldt strikt genomen voor het abonnement; wie dat netjes wil, maakt de Speech-resource op een apart gratis pay-as-you-go-abonnement. Op F0 kost dat evenmin iets.

## Stemmen

Azure heeft twee Vlaamse (nl-BE) neurale stemmen: **Dena** (`nl-BE-DenaNeural`, vrouw) en **Arnaud** (`nl-BE-ArnaudNeural`, man). In stap 2 maken we van één bladzijde een proefopname met elk, zodat Frederique (en de kinderen) kunnen kiezen. Tempo iets trager dan normaal (`rate="-10%"`), zoals de tabletstem nu op 0,9 staat.

## Waarom niet live of via Supabase

Het eerste idee was een Supabase Edge Function die Azure aanroept en de audio in Supabase Storage bewaart. Voor de verhalen is dat onnodig ingewikkeld: de verhalen staan als JSON in de repo en veranderen alleen als wij ze aanpassen. Een script dat bij een wijziging de opnames maakt is eenvoudiger, werkt offline (de service worker bewaart de mp3's) en hangt niet af van Supabase (dat pauzeert na 7 dagen zonder gebruik). De Edge Function blijft een optie voor later, voor teksten die ouders zelf typen (stap 7).

## Stappen

### 1. Speech-resource aanmaken (Frederique, ±10 minuten)

1. Ga naar [portal.azure.com](https://portal.azure.com) en log in met het account van je Visual Studio-abonnement.
2. Zoek bovenaan **Speech** en kies **Speech services** (onder Azure AI services), dan **Create**.
3. Vul in:
   - **Subscription**: je Visual Studio-abonnement (of een apart pay-as-you-go-abonnement, zie hierboven)
   - **Resource group**: nieuw, `familie-app`
   - **Region**: **West Europe** (dichtbij; beide Vlaamse stemmen zijn daar beschikbaar)
   - **Name**: bv. `familie-app-stem` (moet uniek zijn)
   - **Pricing tier**: **Free F0**. Belangrijk: niet Standard S0. Staat F0 er niet, dan heb je op dat abonnement al een gratis Speech-resource (er mag er één per abonnement); gebruik dan die.
4. **Review + create**, daarna **Create**. Wacht tot "Your deployment is complete" en klik **Go to resource**.
5. Open links **Keys and Endpoint** (of **Resource Management → Keys and Endpoint**). Kopieer **KEY 1** en noteer de **Location/Region** (`westeurope`).
6. Zet ze als secrets in GitHub: repo `dcfrederique/familie-app` → **Settings → Secrets and variables → Actions → New repository secret**:
   - `AZURE_SPEECH_KEY` = KEY 1
   - `AZURE_SPEECH_REGION` = `westeurope`
7. Zeg in de chat dat het klaar is. Plak de sleutel **niet** in de chat.

Wil je zelf lokaal opnames kunnen maken, zet dezelfde twee waarden dan in een bestand `.env.local` in de projectmap (staat in `.gitignore`, gaat dus niet mee naar GitHub).

### 2. Proefopname en stemkeuze

Een klein script maakt van bladzijde 1 van "Dirk de draak telt sterren" een mp3 met Dena en een met Arnaud. Frederique luistert en kiest de stem (en eventueel het tempo). De keuze komt in dit document.

### 3. Script dat de verhalen inspreekt (`scripts/maak-stem.ts`)

- Leest alle `src/data/verhalen/*.json`.
- Per bladzijde: SSML met de gekozen stem en tempo, synthese via de Speech SDK (`microsoft-cognitiveservices-speech-sdk`, alleen als dev-dependency), uitvoer mp3 24 kHz mono 48 kbps.
- Vangt de **WordBoundary**-events op: per woord de tekenpositie en het tijdstip in milliseconden. Die komen in een klein JSON-bestand naast de mp3.
- Schrijft naar `public/stem/verhalen/<nr>/<bladzijde>.mp3` en `.json`, plus de titel als `titel.mp3`.
- Houdt per bestand een hash bij van tekst + stem + tempo (`public/stem/index.json`). Alleen gewijzigde bladzijden worden opnieuw gemaakt, dus een tikfout verbeteren kost een paar honderd tekens, niet 20.000.
- Wacht tussen verzoeken zodat het onder 20 per minuut blijft, en probeert bij een 429 later opnieuw.
- Schatting grootte: ±25 minuten audio voor alle verhalen, ±10 MB. Dat kan gewoon in de repo en kost niets op Vercel.
- Test: een unit-test op het opbouwen van de SSML (speciale tekens zoals `&` en `<` escapen) en op het omzetten van woordtijden naar woordnummers zoals `woordGrenzen()` ze telt.

### 4. GitHub Action die het script draait

Workflow `.github/workflows/stem.yml`:

- Start handmatig (**Run workflow**) en bij een push naar `main` die `src/data/verhalen/**` of de lijst vaste zinnen wijzigt.
- Draait `scripts/maak-stem.ts` met de twee secrets, en commit nieuwe of gewijzigde mp3's terug naar `main`.
- Zonder secrets slaat de workflow zichzelf over (zoals `keep-alive.yml`), zodat CI nooit faalt.

### 5. Afspelen in de app (`src/lib/voorlezen.ts`)

- Nieuwe functie `speelOpname(pad, woorden, opWoord, opEinde)` met een `HTMLAudioElement`. Tijdens het afspelen kijkt `requestAnimationFrame` naar `audio.currentTime` en licht het juiste woord op. Dat is preciezer dan nu, omdat de tijden uit Azure komen en niet geschat zijn.
- `Verhaal.tsx` probeert eerst de opname. Is er geen bestand (nieuw verhaal nog niet ingesproken) of lukt afspelen niet, dan valt het terug op `leesVoorMetWoorden()` met de tabletstem. Zo breekt er nooit iets.
- Service worker: een Workbox-regel `runtimeCaching` voor `/stem/**` (CacheFirst), zodat een verhaal dat één keer gespeeld is ook zonder wifi werkt. De mp3's gaan niet in de precache, anders downloadt elke tablet bij elke update 10 MB.
- Bestaande regels blijven: Kleine oortjes altijd voorlezen, Grote ogen aan/uit, Avonturiers standaard uit; verder pas als het voorlezen klaar is.

### 6. Vaste zinnen in de spelletjes en het startscherm

Zinnen zoals "Wat ga je koken?", "Roer maar goed rond!" en de uitleg van Racen en Touwspringen staan vast in de code. We verzamelen die in één lijst (`src/data/zinnen.ts`), het script spreekt ze ook in (`public/stem/zinnen/<sleutel>.mp3`), en `leesVoor()` speelt een opname als er een is voor die exacte tekst. Dat zijn enkele duizenden tekens extra, nog steeds ver onder de limiet.

Teksten met een naam, getal of taaktitel ("Hoera, 12 keer gesprongen!", taken die ouders typen) blijven op de tabletstem. Feline merkt het verschil, maar het blijft verstaanbaar.

### 7. Later, optioneel: ook dynamische teksten

Als de tabletstem bij taaktitels te storend is: een Supabase Edge Function `stem` die een tekst ontvangt, eerst in Supabase Storage kijkt of die al bestaat (hash van tekst + stem), en anders Azure aanroept en het resultaat bewaart. De sleutel staat dan als secret in Supabase. Taaktitels veranderen zelden, dus ook dat blijft ver onder 500.000 tekens. Niet nodig voor de eerste versie.

### 8. Proberen met de kinderen

Een week gebruiken op de tablets. Vragen: verstaat Feline alles, is het tempo goed, loopt het oplichten gelijk met de stem? Bijstellen kost alleen opnieuw inspreken (stap 4).

## Wat Frederique moet doen

1. Stap 1: Speech-resource op **Free F0** aanmaken en de twee secrets in GitHub zetten.
2. Stap 2: de proefopnames beluisteren en een stem kiezen.

De rest (stappen 3 tot 6) bouwt Claude, zonder nieuwe Supabase-migraties.
