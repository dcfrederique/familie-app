# Prenten met Azure OpenAI

**Beslist 24 oktober 2026: geen Azure OpenAI.** Het aanmaken van het beeldmodel liep vast op quotum en was te omslachtig. Claude tekent de prenten zelf als SVG in een rijkere stijl (goedgekeurd door Frederique op 24 oktober): vlak, twee à drie tinten per kleur, wangetjes en glans in de ogen, wolken, graspollen en bloempjes. Dirk, Mo en Pip staan in die stijl in `src/data/verhaalFiguren.tsx`, de details in `src/data/verhaalPrent.tsx`. Kost niets, geen Azure, alles in de repo.

Wat hieronder staat (script, workflow, stappenplan Azure OpenAI) blijft liggen voor als we later toch AI-prenten willen.

Plan en kosten van het oorspronkelijke idee: `docs/azure-extra.md`, deel 3.

## Wat er klaarstaat

| Wat | Waar |
| --- | --- |
| Stijlgids: één stijl voor verhalen, kleurplaten en puzzels, en de vaste personages (Dirk, Mo, Pip) | `scripts/prenten/stijl.ts` |
| 10 proefopdrachten: 3 referentieprenten van de personages, 5 bladzijden uit bestaande verhalen, 2 kleurplaten | `scripts/prenten/proef.ts` |
| Script dat de prenten maakt (`--droog` toont alleen de opdrachten) | `scripts/maak-prenten.ts` |
| Workflow om het vanuit GitHub te doen, zonder iets op je pc | **Actions → Prenten maken** (`.github/workflows/prenten.yml`) |
| Controle of de secrets werken | **Actions → Azure controleren** |

De prenten komen niet in de repo (te groot). De proefprenten staan als zip onderaan de run; de echte prenten gaan later naar een publieke container `prenten` in het Storage-account van de back-ups.

## Wat Frederique doet (±20 minuten, plus eventueel wachten op Microsoft)

1. **Resource aanmaken.** In portal.azure.com: zoek **Azure OpenAI** → **Create**. Resource group `familie-app`, regio **Sweden Central** (dichtstbij met beeldmodellen; staat het beeldmodel daar niet in de lijst bij stap 2, maak de resource dan in **East US 2**), naam bv. `familie-app-prenten`, prijsklasse **Standard S0**. Netwerk: **All networks**. Daarna **Review + create**.
   - Zegt Azure dat je abonnement dit niet toelaat, laat het me weten: dan zoeken we een andere weg.
2. **Beeldmodel uitrollen.** Open de resource → **Go to Azure AI Foundry portal** → **Deployments** (of **Models + endpoints**) → **Deploy model** → **Deploy base model**. Kies het nieuwste **gpt-image**-model dat de lijst toont, deployment type **Global Standard** of **Standard**, en noteer de **deployment name** (bv. `prenten`).
   - Staat er **Request access** bij het model: vul het formulier in (gebruik: illustraties voor een gezinsapp voor eigen kinderen). Goedkeuring duurt meestal enkele dagen; je krijgt een mail.
3. **Sleutel en adres kopiëren.** Terug in portal.azure.com, de resource → **Resource Management → Keys and Endpoint**: kopieer **KEY 1** en het **Endpoint** (zoals `https://familie-app-prenten.openai.azure.com/`).
4. **Drie secrets in GitHub** (repo → **Settings → Secrets and variables → Actions → New repository secret**):
   - `AZURE_OPENAI_ENDPOINT`: het endpoint uit stap 3
   - `AZURE_OPENAI_KEY`: KEY 1
   - `AZURE_OPENAI_DEPLOYMENT`: de deployment name uit stap 2
5. **Kostenalarm (aangeraden).** portal.azure.com → **Cost Management → Budgets → Add**: budget €50 voor het abonnement, met een mail bij 50 % en 90 %.
6. **Proef draaien.** **Actions → Prenten maken → Run workflow**, reeks `proef`, kwaliteit `medium` (10 prenten, ±€0,40). Na een paar minuten staat onderaan de run de zip **prenten-proef**; pak die uit en open `index.html`.
7. **Stijl goedkeuren.** Zeg wat je ervan vindt (of welke personages anders moeten); ik pas de stijlgids aan tot het goed zit.

## Daarna (Claude)

1. Goedgekeurde referentieprenten van Dirk, Mo en Pip vastleggen; die gaan bij elke generatie mee zodat ze er overal hetzelfde uitzien.
2. 70 nieuwe verhalen schrijven als JSON in `src/data/verhalen/` (verdeeld over de drie reeksen); Frederique leest ze (deels) na.
3. Per bladzijde een opdracht maken en de ±600 prenten in reeksen genereren, nakijken, mislukte opnieuw.
4. Container `prenten` in Azure Blob, de app laadt een prent pas als het verhaal opent (`src/data/verhaalPrent.tsx` krijgt een `beeld`-veld, met de SVG als terugval).
5. Kleurplaten als lijntekening omzetten naar vlakken (potrace) en per plaat nakijken; de puzzels krijgen de nieuwe prenten.
