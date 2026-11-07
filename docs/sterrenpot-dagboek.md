# Sterrenpot en Dagboek (ontwerp, nog niet gebouwd)

Ontwerp van 7 november 2026, op vraag van Frederique. Mockup: `prototypes/sterrenpot-dagboek.html` (draait in de dev-server met de echte
thema-kopprenten: `npm run dev`, dan `/prototypes/sterrenpot-dagboek.html?scene=pot-luca`; zonder `scene` een lijst met alle scènes).
Schermafdrukken staan in de projectmap onder `schermen/sterrenpot/` en `schermen/dagboek/`. Er is nog niets in de app, geen migratie en
geen nieuwtje; die komen bij de bouw (harde regel: nieuwtje met het volgende `versie`).

---

## 1. Sterrenpot: sparen voor een doel van de ouders

### Idee
Een ouder zet per kind één doel in de pot, bv. "Plopsaland met papa, 120 sterren". Het kind stopt zelf sterren in de glazen pot en ziet
hem vollopen. Is hij vol, dan is er een feestje, en een ouder regelt het echte doel en tikt op **Gedaan**.

### Hoe het samengaat met de winkel (voorstel: een aparte pot)
- Sterren in de pot verhuizen van het **vrije saldo** naar de pot. Wat in de pot zit, kan het kind **niet** uitgeven in de winkel en
  **niet** reserveren voor extra tijd. Zo blijft het sparen echt sparen, en blijft de kernregel "1 ster = 1 minuut, enkel door een
  ouder toegekend" intact.
- Saldo's per kind: `totaal = vrij + gereserveerd + in_pot`. Vrij is wat de winkel en de tijdaanvraag zien.
- Te weinig vrije sterren in de winkel, maar wel sterren in de pot: de kooptip biedt "28 uit de pot en kopen" aan, met duidelijk
  wat dat met de pot doet (`pot-winkel-luca`). Het kind beslist; er gebeurt niets zonder tik.
- Het dagplafond (60 min extra) en de sterrenlimiet per spelletje veranderen niet. Sterren verdienen en uitgeven werkt zoals nu.
- Storten en halen schrijven een regel in het puntenlog (bron `pot`, reden "In de pot" of "Uit de pot"), zodat elke beweging
  zichtbaar blijft. Afronden schrijft de sterren af (bron `pot`, reden "Sterrenpot: Plopsaland met papa").
- Een ouder die sterren bijgeeft of afneemt (Kinderen en tijd) raakt enkel het vrije saldo, zoals nu.

### Schermen
- **Startscherm**: een chip "Pot, 80 van 120" met minipotje naast de sterrenpil (`pot-start-luca`). Voor Feline een potje met
  sterretjes zonder tekst. Tik = het potscherm. Zonder doel is er geen chip.
- **Winkel**: de potchip staat ook in de kop van de Winkel; te weinig sterren geeft de kooptip hierboven.
- **Potscherm** `/kind/:id/pot` (geen scrollen, tablet liggend 1194 × 834, kop met themaprent, onderbalk met Winkel actief):
  links de pot met stickertje van het doel, rechts doelkaart, "Nog 40 sterren" met balk, en `+5 / +10 / +25` plus "Haal er 5 uit".
  Per kind: Luca race (`pot-luca-race`), Yuna kasteel (`pot-yuna-kasteel`), Feline tuin (`pot-feline-tuin`).
- **Feline** (4, leest niet): het doel is een prent (ijsje), de voortgang zijn sterretjes in rijen van vijf (gevuld of leeg), grote
  knoppen `+⭐` en `−⭐` die telkens één ster verplaatsen, een voorleesknop bij het doel. De ouder stelt voor haar een klein aantal in
  (voorstel: 10, hooguit 15) zodat ze kan tellen.
- **Vol** (`pot-vol-luca`, `pot-vol-feline`): confetti, "Je pot is vol!" en "Zeg het aan mama of papa". Storten kan dan niet meer.
  Er gaat meteen een webpushmelding naar de ouders. Het themafeest (`ThemaFeest`) kan hergebruikt worden.

### Ouderdeel (gsm)
- **Kinderen en tijd, per kind**: blok "Sterrenpot" met aan/uit, doelnaam, prentje (pretpark, ijsje, bioscoop, cadeau, zwembad,
  speelgoed), aantal sterren, en twee opties: "kind mag er zelf sterren uithalen" en "wij leggen er X sterren bij als de pot vol is"
  (`pot-ouder-instellen`). Pot leegmaken geeft de sterren terug aan het vrije saldo.
- **Goedkeuren**: een kaart "Pot is vol" met **Gedaan, sterren afschrijven**, **Later** en "Nieuw doel instellen" (`pot-ouder-vol`).
  Een kind kan zich nooit zelf uitbetalen: de ouder beslist.

### Gegevens en server (voorstel)
- Tabel `sterrenpot` (één rij per kind): `kind_id`, `doel_naam`, `doel_prent` (sleutel uit een lijst in `src/data/sterrenpot.ts`),
  `doel_sterren`, `in_pot`, `kind_mag_halen`, `ouder_bonus`, `status` (`sparen`, `vol`, `afgerond`).
- Postgres-functies, naar het voorbeeld van `kopen` en de tijdreservering: `pot_instellen` (ouder), `pot_storten`, `pot_halen` (kind,
  alleen op de eigen tablet), `pot_afronden` (ouder). De server controleert: storten kan niet meer dan het vrije saldo, en `vrij`
  houdt rekening met `in_pot` in `kopen` en in de tijdreservering. Tests in `supabase/tests/` voor storten, halen, kopen met pot,
  tijd reserveren met pot, afronden en een bonus.
- `proefBron` (Spelletjes proberen) blokkeert storten, halen en afronden; zet het potscherm in `GEBLOKKEERD`.

### Acceptatiecriteria (bouw)
1. Een ouder zet een doel; het kind ziet de chip en het potscherm zonder te scrollen op tablets liggend en staand.
2. Storten en halen kloppen met het puntenlog en met het vrije saldo; de winkel kan geen sterren uit de pot uitgeven.
3. Een volle pot geeft het kind het feest en de ouder een melding en een kaart in Goedkeuren; afronden schrijft af.
4. Feline kan alles zonder lezen: prenten, sterretjes tellen, voorleesknop.
5. Licht en donker, drie thema's, knoppen minstens 64 px.

---

## 2. Dagboek ("Mijn dag"): hoe voel ik me vandaag

### Idee
Eén keer per dag kiest het kind een gezichtje, zegt waarover het ging en mag er iets bij schrijven of tekenen. Een ouder ziet het
in het ouderdeel. Het dagboek is bedoeld om te praten, niet om te belonen of te controleren.

### Hoe het werkt
- **Ingang**: een vierde tegel **Mijn dag** in Ik (naast figuurtje, huis, thema), met een label "Nieuw" in het begin (`ik-luca-mijn-dag-tegel`).
  Optioneel opent het vanzelf als de taken van vandaag klaar zijn (instelling per gezin).
- **Drie stappen**, elk één scherm zonder scrollen, met stippen onderaan:
  1. **Gevoel**: zes grote gezichtjes (super blij, blij, gewoon, moe, verdrietig, boos). De vorm van het gezichtje verschilt, niet enkel
     de kleur. Feline ziet geen woorden: tik leest het gevoel voor (`stap1-gevoel-luca / -yuna / -feline`).
  2. **Waarom**: acht prentjes (school, vrienden, thuis, slapen, eten, spelen, ziek of pijn, iets anders); kies er één of twee
     (`stap2-waarom-luca / -feline`).
  3. **Erbij** (mag overgeslagen worden): schrijven (kort, met snelle beginzinnen "Ik ben blij omdat…"), **tekenen** (hergebruikt het
     tekenvlak van Zelf tekenen), later **inspreken**. Daarbij de schakelaar **"Ik wil graag praten met mama of papa"**, die meteen een
     melding geeft (`stap3-schrijven-luca`, `stap3-tekenen-yuna`). Feline krijgt hier enkel tekenen en de praat-schakelaar.
- **Klaar**: bedankt-scherm met de gezichtjes van de week (`klaar-feline`). Aanpassen kan tot middernacht, daarna is het bevroren.
- **Geen sterren.** Gevoelens verdienen niets, anders gaat het kind kiezen wat loont. Het is ook geen app-tijd.
- Het kind weet in woorden of een prentje dat mama en papa meelezen. Kinderen zien elkaars dagboek nooit.

### Ouderdeel (gsm)
- **Kinderen → Dagboek**: weekstrook per kind met de gezichtjes, een badge "Wil praten", en onderaan de laatste berichten
  (`ouder-gsm-week-overzicht`). Tik op een dag: gevoel, redenen, tekst, tekening en **Antwoorden in de chat** (`ouder-gsm-dag-detail`).
- **Dagboek instellen**: aan of uit per kind, wie meeleest, meldingen (altijd bij "Ik wil praten"; optioneel na 3 sombere dagen op
  rij; optioneel bij elke boze of verdrietige dag) en de herinnering (`ouder-gsm-instellen`).
- Meldingen via de bestaande web-push (`docs/meldingen.md`), met als tekst enkel "Luca wil praten", nooit de inhoud.

### Gegevens (voorstel)
- Tabel `dagboek`: `kind_id`, `dag`, `gevoel`, `redenen` (tekstlijst), `tekst`, `tekening` (lijnen als JSON, klein; of een bestand in
  Supabase Storage), `wil_praten`, `gezien_op`. Uniek per kind en dag.
- RLS: een tablet schrijft enkel de eigen rij van vandaag (zoals de tablet-per-kind regel), alleen ouder-accounts lezen. Gezinsinstellingen
  in `gezinnen` of de kindrij (`dagboek_aan`, `dagboek_melding`).
- Inspreken (fase 2) bewaart audio in Storage en brengt privacyvragen mee; pas bouwen na akkoord.

### Acceptatiecriteria (bouw)
1. Mijn dag verschijnt in Ik voor de kinderen waarvoor een ouder het aanzette; een tweede keer op één dag past de rij aan.
2. Alle drie de stappen passen op tablets liggend en staand zonder scrollen; Feline kan het zonder te lezen.
3. Een ouder ziet week, details en tekening, en krijgt een melding bij "Ik wil praten".
4. Geen kind kan andermans dagboek zien; RLS getest.
5. Geen sterren, niets in het puntenlog, niet meegeteld in de app-tijd.

---

## Open vragen
Zie het antwoord in de thread: het gaat om (1) pot apart of enkel een markering, (2) mag het kind sterren terughalen, (3) telt de
pot mee voor het spaarmaximum, (4) bonus van de ouders, (5) inspreken ja of nee, (6) meldingen bij sombere dagen, (7) naam "Mijn dag".
