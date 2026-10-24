# Drie extra's met Azure (plan)

Stand: 24 oktober 2026. Nog niets gebouwd. Frederique koos op 24 oktober deze drie om uit te werken. De voorleesstem staat apart in `docs/voorleesstem.md` en blijft Azure Speech (Dena of Arnaud).

| # | Wat | Kost | Volgorde |
| --- | --- | --- | --- |
| 1 | Wekelijkse back-up van de database naar Azure Blob Storage | een paar cent per maand | eerst: klein en los van de rest |
| 2 | Leesoefening: Yuna en Luca lezen hardop, de app luistert mee | gratis (5 uur spraakherkenning per maand op F0) | na de voorleesstem: zelfde Speech-resource |
| 3 | Beeldgeneratie voor 100 verhalen, kleurplaten en puzzels | eenmalig ±€10 tot €40 | als één project, samen met nieuwe spelletjes |

Bedragen bij 3 komen uit mijn kennis van de prijzen en zijn bij benadering; ik check ze in stap 3.1.

Alle drie draaien op het Visual Studio-abonnement. Zie `docs/azure.md` over het "dev/test"-tegoed: een eenmalige generatie (3) past daar goed bij. Voor 1 en 2 geldt: valt het abonnement weg, dan stoppen de back-ups en de leesoefening, maar de app zelf blijft werken. Ze verhuizen kan dan naar een pay-as-you-go-abonnement voor enkele cent per maand.

## 1. Back-ups naar Azure Blob Storage

**Stand:** gebouwd op 24 oktober 2026 (`.github/workflows/backup.yml`); de klikstappen staan nu in `docs/hosting.md` stap 5.

**Waarom:** Supabase Free maakt geen back-ups die je zelf kunt terugzetten. Gaat er iets mis (een foute migratie, een per ongeluk gewist kind), dan is de puntengeschiedenis weg.

**Hoe:** een GitHub Action (`.github/workflows/backup.yml`) draait elke zondagnacht:

1. `pg_dump` van de Supabase-database (schema + data), gezipt, met datum in de naam (`2026-10-26.sql.gz`).
2. Upload naar een private container `backups` in een Azure Storage-account.
3. Een lifecycle-regel in Azure wist back-ups ouder dan 90 dagen, zodat het niet blijft groeien.
4. Zonder secrets slaat de workflow zichzelf over, zoals `keep-alive.yml`.

Bewijsfoto's in Supabase Storage nemen we niet mee: die zijn alleen nodig tot een ouder goedkeurt.

**Kost:** de database is een paar MB. 13 back-ups van elk ±1 MB in de Cool-laag kost minder dan €0,05 per maand.

**Wat Frederique doet (±15 minuten):**

1. In portal.azure.com: **Storage accounts → Create**. Resource group `familie-app`, naam bv. `familieappbackup` (kleine letters, uniek), regio West Europe, **Performance Standard**, **Redundancy LRS** (de goedkoopste).
2. In het account: **Containers → + Container**, naam `backups`, toegang **Private**.
3. **Data management → Lifecycle management → Add rule**: blobs verwijderen 90 dagen na aanmaak.
4. **Security + networking → Access keys**: kopieer de **Connection string**.
5. In Supabase: **Project Settings → Database → Connection string**, kies **Session pooler** (werkt vanaf GitHub), en vul je databasewachtwoord in.
6. In GitHub (Settings → Secrets and variables → Actions) twee secrets: `AZURE_BACKUP_CONNECTION_STRING` en `SUPABASE_DB_URL`.

**Wat Claude bouwt:** de workflow, plus een korte uitleg in `docs/supabase.md` hoe je een back-up terugzet (in een nieuw Supabase-project met `psql`). Die terugzetting proberen we één keer echt uit, anders weet je niet of de back-up deugt.

## 2. Leesoefening

**Idee:** in een verhaal uit de reeks Grote ogen of Avonturiers kiest het kind **Ik lees zelf**. Het leest de bladzijde hardop, de app luistert mee, en elk woord dat goed gelezen is kleurt groen. Een woord dat niet lukt, kan het kind aantikken om het te horen met de voorleesstem. Aan het einde van een verhaal: sterren, zoals bij Verhalen nu (pas na goedkeuring van een ouder, binnen het dagplafond voor activiteiten).

**Hoe:**

- Spraakherkenning van Azure Speech in het Vlaams (`nl-BE`), via de Speech SDK in de browser, op dezelfde Free F0-resource als de voorleesstem.
- De sleutel komt **niet** in de app. Een Supabase Edge Function `spraak-token` geeft een tijdelijke token van 10 minuten, alleen aan een aangemelde tablet van het gezin.
- De app vergelijkt de herkende woorden met de tekst van de bladzijde (zonder hoofdletters en leestekens, met wat speling voor kleine verschillen). Zo werkt het ook als de uitspraakbeoordeling van Azure geen Nederlands kent.
- Eerst testen (stap 2.1): kan de uitspraakbeoordeling (*pronunciation assessment*) van Azure Nederlands aan? Zo ja, dan krijgen we per woord ook een score. Zo nee, dan blijft het bij goed of nog niet. De gratis minuten zijn dezelfde.
- Privacy: bij live spraakherkenning bewaart Azure de audio niet (logging staat standaard uit, en we zetten het niet aan). De app bewaart ook niets, alleen het resultaat ("verhaal 12 zelf gelezen").

**Kost:** F0 geeft 5 uur spraakherkenning per maand. Dat is ±10 minuten per dag voor Yuna en Luca samen. We zetten in de app een plafond van 5 minuten lezen per kind per dag. Is de 5 uur toch op, dan weigert Azure tot de volgende maand en valt de knop **Ik lees zelf** weg; voorlezen werkt gewoon verder. Een factuur is niet mogelijk.

**Wat Frederique doet:** niets extra, de Speech-resource uit `docs/voorleesstem.md` volstaat. De sleutel komt ook als secret in Supabase (**Edge Functions → Secrets**: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`).

**Stappen:**

1. Proef: één bladzijde hardop lezen in de browser en kijken wat Azure herkent bij een kinderstem (Yuna en Luca doen even mee).
2. Edge Function `spraak-token` + tests.
3. Woordvergelijking als pure functie in `src/lib/` met tests (o.a. "de" vs "De", "Mo's", getallen als woord).
4. Scherm **Ik lees zelf** in `Verhaal.tsx`, plafond per dag, activiteitlog `zelf-gelezen`.
5. Proefweek: herkent het genoeg, is het niet frustrerend? Bijstellen hoe streng het is.

## 3. Beeldgeneratie: 100 verhalen, kleurplaten en puzzels

**Idee:** de verhalen uitbreiden van 30 naar **100**, met echte prenten in plaats van de huidige SVG-vormpjes, en met dezelfde beeldstijl ook nieuwe kleurplaten en een nieuw spel **Puzzels**. Dit doen we als één project, wanneer we de volgende ronde spelletjes bouwen, zodat er één stijlgids is en alles in één keer gegenereerd wordt.

**Hoe:**

1. **Stijlgids en prijscheck.** Eén stijl voor alles, passend bij `docs/ontwerp.md`: vlakke vormen, effen kleuren, geen merken of bekende personages. Vaste personages (Dirk de draak, Mo, Pip) krijgen een referentieprent die bij elke generatie meegaat, zodat ze er op elke bladzijde hetzelfde uitzien. Model: GPT-image via Azure OpenAI (Azure AI Foundry). Eerst 10 proefprenten, Frederique keurt de stijl goed.
2. **70 nieuwe verhalen schrijven.** Claude schrijft ze als JSON in `src/data/verhalen/`, zoals de bestaande 30, verdeeld over de drie reeksen. Dit kost niets aan Azure. Frederique leest ze na (of een selectie).
3. **Prenten genereren.** Een script maakt per bladzijde een prent: 100 verhalen × ±6 bladzijden = ±600 prenten. Elke prent wordt nagekeken; mislukte opnieuw. De bestaande 30 verhalen krijgen ook nieuwe prenten, zodat de stijl overal gelijk is.
4. **Kleurplaten.** Dezelfde personages als lijntekening. Om ze met één tik in te kleuren (zoals nu in `src/data/kleurplaten.ts`) zetten we de tekening om naar vlakken met een vectorizer (bv. potrace). Dat lukt niet altijd netjes, dus per plaat nakijken; reken op ±30 bruikbare platen.
5. **Puzzels (nieuw spel).** Een prent uit een verhaal in 4, 9 of 16 stukjes, naar de juiste plek slepen. Vrijspelen met sterren zoals de andere spelletjes (`docs/spelletjes.md`).
6. **Voorleesstem bijwerken.** De 70 nieuwe verhalen zijn ±50.000 tekens extra; alles samen ±70.000, nog steeds ver onder de 500.000 gratis tekens per maand.

**Opslag:** 600 prenten als WebP van ±100 KB is ±60 MB. Dat is te veel voor de repo en de precache van de app. Ze komen in een publieke container `prenten` in hetzelfde Azure Storage-account als de back-ups (minder dan €0,05 per maand opslag; het verkeer blijft klein omdat de service worker elke prent maar één keer downloadt). De app laadt een prent pas als het kind het verhaal opent.

**Kost (bij benadering):** GPT-image kost per prent ruwweg €0,01 (lage kwaliteit) tot €0,05 (middel). 600 verhaalprenten + 100 kleurplaten + proeven en herkansingen ≈ 1.000 generaties ≈ **€10 tot €40, eenmalig**, uit het Azure-tegoed. Daarna kost het niets meer.

**Wat Frederique doet:**

1. In portal.azure.com een **Azure OpenAI**-resource (of Azure AI Foundry-project) aanmaken in een regio waar het beeldmodel beschikbaar is, en het beeldmodel uitrollen (*deploy*). Dat kan pas wanneer we aan dit project beginnen; mogelijk moet Microsoft toegang tot het beeldmodel eerst goedkeuren (aanvraagformulier, enkele dagen).
2. De sleutel als GitHub-secret `AZURE_OPENAI_KEY` (+ endpoint en naam van de deployment).
3. De proefprenten en de stijl goedkeuren, en de nieuwe verhalen (deels) nalezen.
