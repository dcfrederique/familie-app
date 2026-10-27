# Echte Android-app met Capacitor (plan, nog niet gebouwd)

Status: stap 1 en 2 gebouwd op 2026-10-27 (`capacitor.config.ts`, `android/`, `src/lib/schil.ts`, CI-job `android` met debug-APK in Releases → android-latest; stand en fullscreen zitten er al in). Meldingen via FCM, vaste handtekening en Play Store volgen nog. Geschreven 2026-10-25, bijgewerkt 2026-10-27. Er is nog geen code geschreven en niets verandert aan de gehoste app.

## Bijgewerkt op 27 oktober: wat er sindsdien veranderde

- **De wereld is een canvas in 2.5D** (`docs/wereld-25d.md`; de echte 3D met Three.js is geschrapt). Dat is gewoon 2D-tekenen in de WebView: geen WebGL-risico, wel dezelfde eis als nu, namelijk soepel op de kindertablets. Immersive fullscreen en vaste liggende stand helpen hier direct: meer beeld, geen verspringende hoogte bij het draaien. Controleer wel dat de wereld bij `server.url` even vlot loopt als in Chrome.
- **Realtime alleen bij gezelschap:** de live verbinding (Supabase Broadcast) opent pas als er nog iemand in de wereld is, met een controle om de 10 seconden. Dat is ook batterijvriendelijk en verandert niets aan de schil. Wel de moeite: een app op de achtergrond (scherm uit) moet de verbinding netjes sluiten; de WebView pauzeert dan meestal zelf.
- **Playwright draait elke nacht** (workflow `e2e.yml` en de schermcontrole, blokkeert deployen niet). Voor de schil zijn geen aparte tests nodig: de webcode blijft dezelfde. Wel nieuw: `platform.ts` krijgt een eenvoudige test (web = geen native), en de schermcontrole meet op een WebView-toestel iets andere hoogtes zonder systeembalken (meer ruimte, dus geen nieuwe scrollproblemen verwacht).
- **PWA-update:** `registerType: 'prompt'` met `src/lib/nieuweversie.ts` kiest zelf een goed moment om te wisselen. Met `server.url` werkt dat ongewijzigd door: de service worker in de WebView haalt de nieuwe versie en wisselt op hetzelfde moment als nu. Dus geen APK-update per deploy, wat de aanbeveling "live laden" versterkt.
- Meldingen (`melding`-functie, `ci.yml` job `meldingen`) zijn niet gewijzigd; de FCM-tak komt er nog bij zoals hieronder.
- Het nieuwtje-nummer staat intussen op 0.51; een Capacitor-stap met zichtbaar effect (meldingen, fullscreen) krijgt weer een item bovenaan `src/data/nieuwtjes.ts`.

## Wat er van Frederique nodig is

| Wat | Wanneer | Moeite |
| --- | --- | --- |
| **Android Studio** op de pc (of enkel de SDK-opdrachtlijn) om de eerste APK te bouwen en te testen met USB-foutopsporing op één tablet | Stap 2. Later bouwt CI de APK zelf en is Android Studio niet meer nodig | ±1 uur installeren |
| **Firebase-project** (gratis, console.firebase.google.com): Android-app toevoegen met het package-id, `google-services.json` downloaden, service-account-JSON aanmaken en als GitHub-secret `FCM_SERVICE_ACCOUNT` zetten | Stap 4 (meldingen) | ±30 min, ik geef de klikstappen |
| **Google Play Console** ($25 eenmalig) | Enkel als we de interne testtrack willen. Niet nodig voor de start | later beslissen |
| Keuze van naam en package-id | Voor stap 1 | 5 min |
| Eén tablet en één ouder-gsm om op te testen, plus nagaan of Family Link het installeren van een app van buiten de Play Store toelaat | Stap 2 | ±15 min |

## Voorstel eerste concrete stap

Stap 1 en 2 samen, zonder meldingen: Capacitor toevoegen met `server.url`, naam en icoon, `android/` in de repo, en CI laat een **debug-APK** als download bouwen (geen Android Studio nodig om hem te krijgen). Frederique installeert die op één kindertablet en kijkt of de app opent, of Family Link het toelaat en hoe het voelt. Zo weten we meteen het grootste risico (installeren op een kindertoestel) voor we Firebase opzetten. Daarna volgt stap 3 (stand en fullscreen), dan meldingen. Geschat: een halve dag werk van mijn kant plus de test.


> **Let op (27 oktober, na de eerste test op een ouder-gsm):** formulieren en selects werkten niet goed in de eerste APK. Vermoedelijke oorzaak: `ImmersiefPlugin` riep `setDecorFitsSystemWindows` aan en kwam daarmee in botsing met de randen- en toetsenbordafhandeling van Capacitor (SystemBars, targetSdk 36). Dat is uit de code gehaald; nog niet op een toestel bevestigd. De CI-job `android` draait voorlopig alleen op aanvraag (workflow_dispatch), tot Frederique een nieuwe APK wil.

## Waarom

- **Meldingen tonen het webadres.** Chrome zet onder elke web-push de site-URL (`thankful-meadow-0d992b403.5.azurestaticapps.net`). Dat is lelijk en niet te verbergen zolang de app een website is. Een echte app toont enkel haar eigen naam en icoon.
- **Echte fullscreen.** Een PWA kan de systeembalken (status- en navigatiebalk) niet echt verbergen; in een native app wel.
- **Schermstand vastzetten** per toestel, wat een PWA op Android niet betrouwbaar doet.
- **Later native dingen** die een website niet kan: offline duels tussen tablets, camera met foto als bewijs.

Aanpak: de bestaande React/Vite-app blijft de enige codebasis. Capacitor stopt die in een Android-schil (WebView). Geen herschrijving.

## Wat de app wordt

- **Naam:** "Familie" (zoals nu in het manifest) of iets warmers; te beslissen. Dit is de naam onder het icoon en in elke melding.
- **Icoon:** variant C "Onder één dak" (`docs/iconen`). Android wil een adaptief icoon (voorgrond + achtergrond, `icon-maskable-512.png` is al een goed begin) en een eenkleurig meldingsicoontje (wit silhouet van het dak).
- **Package-id:** bv. `be.declercq.familie` (kiezen vóór de eerste build; achteraf wijzigen betekent een nieuwe app).

## Schermstand

- **Kindertablets:** vastzetten op liggend (`sensorLandscape`, werkt ook ondersteboven). Eén gedeelde app, dus de stand hangt af van de rol: zodra een tablet aan een kind gekoppeld is (`docs/tablet-per-kind.md`), vergrendelt de app liggend via de plugin `@capacitor/screen-orientation`.
- **Ouder-gsm:** draait vrij. Voor het koppelscherm en alles wat geen kindtablet is blijft de stand `any`.
- Dit lost ook de staande-tablet-problemen op die de schermcontrole nu af en toe meldt, omdat de kinderen niet meer per ongeluk staand kunnen werken.
- De `orientation` in het PWA-manifest blijft `any` voor de webversie op pc/gsm.

## Echte fullscreen (immersive)

- Systeembalken verbergen met `@capawesome/capacitor-android-edge-to-edge-support` of de officiële `StatusBar` plus een kleine eigen plugin voor `WindowInsetsController` (immersive sticky: balken komen tijdelijk terug bij een veeg van de rand en verdwijnen vanzelf).
- Op kindtablets standaard aan, op de ouder-gsm uit (daar wil je de statusbalk en de terugknop zien).
- Veilige zones (camera-uitsparing, afgeronde hoeken) blijven gerespecteerd via `env(safe-area-inset-*)` in de css.
- Het geeft ook meer ruimte voor de wereld en de spelletjes, die nu al het hele scherm willen vullen.

## Meldingen: van web-push naar Firebase (FCM)

Nu: `push_abonnementen` bewaart een Web Push-abonnement, de Edge Function `melding` stuurt met VAPID-sleutels (`docs/meldingen.md`), `public/push-sw.js` toont ze.

Straks: `@capacitor/push-notifications` registreert het toestel bij FCM en geeft een token. De melding komt van Android zelf, met onze naam en ons icoon en zonder webadres.

Wat verandert:

- **Firebase-project** maken (gratis), Android-app registreren met het package-id, `google-services.json` in het Android-project.
- **Database:** `push_abonnementen` krijgt een kolom `soort` (`web` of `fcm`) en een `fcm_token`; of een aparte tabel `fcm_tokens` per gebruiker/toestel. Ongeldige tokens (FCM antwoordt `UNREGISTERED`) automatisch verwijderen, zoals nu met dode abonnementen.
- **Edge Function `melding`:** de tekst, de ontvangers en het geheim (`x-melding-geheim`) blijven. Alleen het verzenden verandert: een tweede tak die de FCM HTTP v1-API aanroept met een OAuth-token uit een service-account. De web-tak mag blijven staan voor de pc-versie van de ouderkant.
- **CI (`ci.yml`, job `meldingen`):** nieuw secret `FCM_SERVICE_ACCOUNT` (JSON van het service-account), door de job met `supabase secrets set` doorgegeven naast de VAPID-sleutels. De controle "VAPID private hoort bij public" blijft voor de web-tak. Zonder het secret slaat de FCM-tak zich over, zodat CI niet breekt.
- **Tikken op een melding** opent Goedkeuren: via een `data`-veld met de route en een luisteraar `pushNotificationActionPerformed`.
- **Meldingskanaal** op Android aanmaken (naam "Goedkeuringen", belangrijkheid hoog) zodat geluid en pop-up goed staan.
- **Android 13+** vraagt toestemming voor meldingen: dezelfde knop "Meldingen aanzetten" onder Ouder → Toestellen.
- Testpagina (Ouder → Instellingen → Testmelding) blijft dezelfde route volgen en toont voortaan ook de FCM-toestellen.

## Updates: live of ingebakken

Twee manieren:

1. **Live laden (`server.url`)**: de app is een schil die gewoon de gehoste site opent (`https://thankful-meadow-0d992b403.5.azurestaticapps.net`). Elke deploy bereikt meteen alle toestellen, zonder nieuwe APK. Past bij hoe we nu werken (CI deployt bij elke push op main; `nieuweversie.ts` wisselt op een goed moment). Nadeel: zonder internet opent de app niet, tenzij de service worker de bestanden bewaard heeft (dat doet hij al, dus meestal gaat het goed). Ook is de WebView daardoor "een browser met een adres": zet `allowNavigation` strak op alleen ons domein.
2. **Ingebakken (`webDir: dist`)**: de bestanden zitten in de APK. Werkt volledig offline, maar elke wijziging vraagt een nieuwe APK installeren op drie tablets en twee gsm's. Voor een gezinsapp die dagelijks groeit niet handig.

**Aanbeveling:** live laden via `server.url`, met de service worker als offline-vangnet. De APK hoeft dan alleen opnieuw wanneer er een native plugin of instelling bijkomt (zeldzaam). Eventueel later Capgo/Capacitor Live Updates als we ingebakken én automatisch willen.

## Ouderkant op pc blijft werken

- De webversie blijft bestaan en wordt altijd gedeeld: `/ouder` op pc werkt gewoon in de browser (zijmenu, boodschappen, gewicht, enzovoort). Capacitor wijzigt de web-code niet.
- Native stukken zitten achter een kleine laag `src/lib/platform.ts` met `Capacitor.isNativePlatform()`; op het web doet die laag niets of valt terug op de huidige aanpak (web-push, geen vergrendelde stand, geen camera-plugin).
- Dus: pc → web-push (met URL onder de melding, daar maakt niemand zich druk om); Android-app → FCM.

## Later: native plugins

- **Offline duels 1 tegen 1 (Google Nearby Connections):** twee tablets vinden elkaar via Bluetooth/wifi-direct zonder internet; spelletjes als penalty's of rekenduel in de auto. Vraagt een eigen of bestaande community-plugin voor Nearby, rechten (nearby devices, locatie op oudere Android), en een ontwerp voor het "wie speelt mee"-scherm. Sterren erbij pas wanneer een tablet weer online is.
- **Camera als bewijs bij taken:** `@capacitor/camera`: kind maakt een foto van de opgeruimde kamer, die gaat met de inzending naar de ouder (Supabase Storage, klein formaat, automatisch opruimen na goedkeuring). Zonder native app kan het ook via `<input capture>`, maar de plugin geeft een nettere ervaring en toestemmingsscherm.
- Beide komen pas ná de basis-app; ze zijn precies de reden om al nu voor Capacitor te kiezen.

## Verspreiding

- **APK sideloaden (start hier):** CI bouwt een ondertekende APK (debug- of release-keystore als GitHub-secret) en zet hem als download in GitHub Releases of op de gehoste site. Eén keer installeren op elke tablet en gsm ("onbekende bronnen" toestaan). Geen kosten, geen review, perfect voor vijf toestellen. Nadeel: Android toont bij sommige tablets Play Protect-waarschuwingen en Family Link kan het installeren van onbekende apps blokkeren; dat moet een ouder op de kindertablets dan eenmalig toelaten.
- **Play Store (later, optioneel):** eenmalig $25 ontwikkelaarsaccount, privacybeleid, "interne testtrack" (tot 100 testers, zonder publieke review) is voor ons genoeg en geeft automatische updates van de APK. Publiek uitbrengen is niet nodig en voor een privé gezinsapp niet gewenst.
- **Aanbeveling:** sideload eerst; interne Play-testtrack als de updates van de schil lastig worden.

## Stappen en grove inschatting

| # | Stap | Inschatting |
| --- | --- | --- |
| 1 | Capacitor toevoegen (`@capacitor/core`, `cli`, `android`), `capacitor.config.ts` met `server.url`, appnaam, package-id, icoon en splash | ½ dag |
| 2 | Android-project in de repo (`android/`), lokaal bouwen in Android Studio, eerste APK op één tablet | ½ dag |
| 3 | Schermstand per rol + immersive fullscreen (`platform.ts`) | ½ dag |
| 4 | Firebase-project, FCM-token registreren, tabel + migratie, Edge Function-tak, CI-secret, testmelding | 1 tot 1½ dag |
| 5 | CI-job die de ondertekende APK bouwt en publiceert (Android SDK, keystore-secret) | ½ tot 1 dag |
| 6 | Installeren op alle toestellen, Family Link nakijken, schermcontrole opnieuw laten lopen | ½ dag |
| 7 (later) | Camera als bewijs | 1 dag |
| 8 (later) | Nearby Connections voor duels | 3 tot 5 dagen (onderzoek + spel + testen op twee tablets) |

Basis-app (stappen 1 tot 6): ongeveer 3 tot 4 werkdagen. Voor een deel moet Frederique zelf iets doen: een Firebase-project aanmaken, de service-account-JSON als GitHub-secret zetten en de APK op de toestellen installeren. De rest kan via CI.

## Snelle tussenoplossing: eigen domein

Wil je het webadres onder de melding nu al mooier, zonder app: een **eigen domein** (bv. `familie.declercq.be`) koppelen aan de Azure Static Web App. Chrome toont dan dat domein in plaats van `thankful-meadow-...azurestaticapps.net`. Het adres verdwijnt niet, maar het leest als een naam. Kost een paar euro per jaar en een uurtje werk (DNS-record, Azure-domein toevoegen, VAPID-`subject` en de push-url bijwerken, toestellen opnieuw laten aanmelden voor meldingen omdat de oorsprong verandert).

## Risico's en open vragen

- **Family Link:** kan een app buiten de Play Store op een kindtoestel installeren? Eerst testen met één tablet vóór de rest.
- **`server.url` en offline:** wat gebeurt er bij geen wifi? Testen met vliegtuigmodus.
- **Spraak en geluid** (Azure-voorleesstem, `/stem/`-cache) moeten in de WebView hetzelfde werken; autoplay is in een Capacitor-WebView soepeler dan in Chrome.
- **Realtime in de wereld** (Supabase Broadcast) blijft ongewijzigd; let wel op batterij met schermen die aan blijven.
- Naam en package-id definitief kiezen vóór de eerste release.
- Wil Frederique de pc-versie van de ouderkant blijven installeren als PWA, of volstaat gewoon de browser?
