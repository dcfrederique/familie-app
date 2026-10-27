// Wat er nieuw is in de app, nieuwste eerst. ELKE nieuwe functie krijgt hier een item bovenaan met het volgende
// versienummer (harde regel, CLAUDE.md). Ouders lezen het onder "Nieuw in de app" (/ouder/nieuw).

export interface Nieuwtje {
  /** Oplopend versienummer voor de ouders, '0.N': telkens het hoogste nummer plus 1. */
  versie: string
  /** YYYY-MM-DD */
  datum: string
  titel: string
  /** Kort, voor ouders: wat het is en waar je het vindt. */
  tekst: string
  verhaal?: string
  spel?: { naam: string; prijs: number }
  /** Nieuwe stukken voor het figuurtje of Mijn huis, met hun prijs in sterren. */
  stukken?: string[]
  /** Wat niet lukte of nog open staat. */
  open?: string
}

export const nieuwtjes: Nieuwtje[] = [
  {
    versie: '0.55',
    datum: '2026-10-27',
    titel: 'Voorraad en recepten',
    tekst: 'Onder Wij staan nu Voorraad en Recepten. In Voorraad zet je wat er in huis is (drank, blikken, diepvries) met een plek, een eenheid en eventueel een minimum en een houdbaarheidsdatum; met min en plus pas je het aantal aan. Afvinken op de boodschappenlijst telt automatisch bij de voorraad (een pak van 6 flessen = 6, instelbaar per artikel) en terugzetten haalt het er weer af. Zakt een artikel tot zijn minimum, dan komt het vanzelf op de boodschappenlijst. In Recepten geef je per gerecht van het weekmenu op wat het van de voorraad gebruikt, voor een aantal personen; op de dag zelf tik je in Voorraad op Gekookt en gaat het eraf, omgerekend naar het aantal eters (standaard 6: Maxim eet mee). De app toont ook wat er voor de gerechten van de komende dagen te weinig in huis is, met een knop om het op de lijst te zetten. Alle wijzigingen staan in een logboek. Alleen op de gsm van een ouder.',
    open: 'Nog niet: automatisch afboeken zonder tikken, omrekenen tussen eenheden (gram en kilo moeten in dezelfde eenheid als het artikel staan) en een scanner voor streepjescodes.',
  },
  {
    versie: '0.54',
    datum: '2026-10-27',
    titel: 'Springland: vijanden verslaan door erop te springen',
    tekst: 'In Springland kan het kind de beestjes nu verslaan door erop te springen: poef, een wolkje sterretjes. Elke soort heeft een eigen manier: de slak is na één hup weg, de egel rolt zich bij de eerste hup op tot een onschadelijk stekelbolletje en gaat bij de tweede hup weg, en de vogel fladdert op en neer en moet je op het juiste moment raken. Van opzij raken kost nog altijd een hartje. Nieuwe levels van de nachtelijke bouw mogen deze soorten gebruiken.',
  },
  {
    versie: '0.53',
    datum: '2026-10-27',
    titel: 'Springland: hartjes, vlaggetjes en een baas',
    tekst: 'Springland is uitdagender. Het figuurtje heeft nu 2 hartjes (3 bij Vanzelf lopen, voor Feline en Yuna): een beestje van opzij raken kost een hartje, erop springen kost niets, vallen in het water ook niet. Zijn de hartjes op, dan sta je met alle hartjes weer terug bij het laatste vlaggetje (of de start) en behoud je de sterren die je al had. Elke wereld eindigt nu met een baas: in Zonnevallei de pompoenbaas, die je met 3 hupjes op zijn hoofd (2 bij Vanzelf lopen) duizelig en dan verslaan moet, waarna het hekje bij het huisje open gaat. Een wereld heeft nu zes plekjes (vijf levels en de baas). Levels mogen voortaan soms moeilijk zijn: dat staat in het plan voor de nachtelijke bouw (docs/springland.md).',
  },
  {
    versie: '0.52',
    datum: '2026-10-27',
    titel: 'Eerste Android-app (proefversie)',
    tekst: 'De Familie-app bestaat nu ook als echte Android-app (een schil rond de gewone app, zodat nieuwe versies vanzelf binnenkomen). Op een kindertablet blijft het scherm altijd liggend en verdwijnen de systeembalken; op een ouder-gsm draait het scherm vrij. De APK om te installeren staat na elke groene bouw in GitHub bij Releases (android-latest). De gewone webversie op pc en gsm blijft werken. Plan en vervolg (meldingen zonder webadres, camera, duels) staan in docs/capacitor.md.',
    open: 'Nog niet: meldingen via Firebase (die tonen nog het webadres), een vaste handtekening voor updates (een nieuwe APK installeren vraagt voorlopig eerst de oude te verwijderen) en een test of Family Link het installeren toelaat.',
  },
  {
    versie: '0.51',
    datum: '2026-10-27',
    titel: 'Geen verspringen meer in de wereld',
    tekst: 'Het figuurtje sprong soms terug naar een andere plek terwijl je rondliep: dat gebeurde wanneer de app op de achtergrond gezinsgegevens ververste. Nu blijft het staan waar het is. Daarnaast opent de live verbinding (je ziet elkaar lopen) pas als er nog iemand van het gezin in de wereld is; alleen in de wereld kijkt de app om de 10 seconden of er iemand bijkwam. Zo gaan er geen onnodige Realtime-berichten over de lijn.',
  },
  {
    versie: '0.50',
    datum: '2026-10-27',
    titel: 'Boodschappen: prijs per eenheid',
    tekst: 'Bij een artikel (Wij → Boodschappen, tikken om te bewerken, en bij Afrekenen) kies je nu Totaal of Per eenheid. Bij Per eenheid vul je de prijs per stuk, kilo of liter in en het aantal (ook 1,5 kan), en de app rekent het totaal zelf uit: prijs × aantal. Dat totaal telt mee in Wij → Uitgaven.',
  },
  {
    versie: '0.49',
    datum: '2026-10-27',
    titel: 'De wereld in gebieden, en de kaart bewerken',
    tekst: 'Nieuw onder Wij → Kaart bewerken (gsm van een ouder, achter de pincode): jullie bepalen zelf waar alles in de wereld staat. Per gebied kun je de huizen van de kinderen, de gebouwen, bomen, banken, lantaarns, speeltoestellen en paden verplaatsen, erbij zetten of wissen, en dus elk kind zijn huis ver van de andere zetten. De wereld bestaat nu uit acht gebieden die elk apart laden als je er binnenloopt: het dorp met poorten naar Berg, Meer en Springland, en daarachter bos, platteland, stadje, strand en sportpark, nog leeg op de wegen na. Springland opent gewoon de bestaande kaart. Wat de nachtroutine later bouwt, komt als standaard op de kaart en kunnen jullie verschuiven of weghalen.',
    open: 'Het plein met speeltuin, de vijver en het voetbalveld in het dorp liggen nog vast. Het dorp heeft nog geen zuidpoort (de vijver ligt in de weg).',
  },
  {
    versie: '0.48',
    datum: '2026-10-27',
    titel: 'De wereld in 2.5D om te proberen, met loopsnelheid',
    tekst: 'Nieuw onder Instellingen → Wereldinstellingen (gsm van een ouder): een schakelaar tussen Plat (zoals nu) en 2.5D schuin. In 2.5D kijkt de camera schuin van boven: de grond staat schuin, elk huis (het eigen Mijn huis van het kind) en elk gebouw krijgt een zijkant, dak en schaduw, en bomen en figuurtjes staan rechtop. Je kiest 3/4 recht, 3/4 licht gedraaid of Isometrisch, of stelt draaien, kantelen, diepte en schaduw zelf in. Daarnaast stel je de loopsnelheid in (half tot dubbel). Alles geldt voor alle kinderen en wordt meteen bewaard; in De wereld in (ouderdeel) staat een tandwiel om het live uit te proberen. Standaard blijft de wereld plat. Eerste proefversie, gebaseerd op docs/wereld-25d.md.',
    open: 'Niet getest op de echte tablets: kijk of het vlot loopt, en zeg welke hoek je het mooist vindt.',
  },
  {
    versie: '0.47',
    datum: '2026-10-27',
    titel: 'Spelen in de wereld: schommel, glijbaan en voetbal',
    tekst: 'In De wereld kan het figuurtje nu echt spelen op het speelplein: sta je vlak voor de schommel, de glijbaan, de wip of de zandbak, dan ga je er automatisch op en weer af. Op het voetbalveldje ligt een bal: loop ertegenaan om hem weg te schoppen en rol hem in het doel voor een doelpunt. Eerste versie; wat er nog bij komt staat in docs/wereld-levendig.md.',
  },
  {
    versie: '0.46',
    datum: '2026-10-27',
    titel: 'Dag, nacht en weer in de wereld',
    tekst: 'In De wereld volgt het licht nu de klok: overdag fris, bij zonsopgang en -ondergang een warme gloed en \'s nachts donker met lichtjes. Het weer wisselt per blok van drie uur tussen zon, bewolkt, regen en in de winter sneeuw. Ook is het grindpad weer plat zoals het was. Binnenkort volgen bruikbare speeltoestellen, een bal en meer stad (plan in docs/wereld-levendig.md).',
  },
  {
    versie: '0.45',
    datum: '2026-10-27',
    titel: 'Nieuw poppetje in de wereld',
    tekst: 'In De wereld loopt elk kind nu als een stoer poppetje met grote kop en een dikke rand, zoals de oude Pokémon-spellen. Het is nog altijd het eigen figuurtje: kapsel, pet of kroontje, shirt, broek en schoenen komen uit de Kleerkast. Het poppetje in de Kleerkast zelf blijft zoals het was.',
  },
  {
    versie: '0.44',
    datum: '2026-10-27',
    titel: 'Lopen in de wereld: tegel voor tegel',
    tekst: 'In de wereld loopt het figuurtje nu tegel voor tegel, zoals de eerste Pokémon-spellen: een stapje per tegel, even omdraaien als je van richting verandert, wippen tegen een muur, en tikken op de grond loopt het pad af. Het figuurtje zet bij elke stap één voet voor, veert mee en zwaait met de armen. Het blijft het eigen figuurtje van elk kind. Een ouder kan het per kind terugzetten naar vrij lopen bij Kinderen → Lopen in de wereld.',
  },
  {
    versie: '0.43',
    datum: '2026-10-27',
    titel: 'De 3D-wereld is geschrapt',
    tekst: 'De proef met een 3D-wereld (versie 0.41) is weer weggehaald: het speelde niet goed en de kinderen vonden het niet leuk. De wereld blijft zoals ze was, in 2D. Het menu-item De wereld in 3D (proef) bestaat niet meer. Wel wordt gekeken of het figuurtje in de wereld mooier en natuurlijker kan bewegen.',
  },
  {
    versie: '0.42',
    datum: '2026-10-27',
    titel: 'Berichten, Huisdier wassen, Koken, Pompoenen en Schrijven passen op elke tablet',
    tekst: 'Deze schermen scrollen niet meer, op geen enkele gangbare tablet, liggend of staand. Koken en Huisdier wassen schalen mee met de hoogte, ook tijdens het spel. In Koken stond de kast soms als één lange lijst onder elkaar: dat is hersteld. Pompoenen maken zet op een liggende tablet de pompoen links en de keuzes rechts, en bij Schrijven staat het prentje naast het blad. Op een liggende gsm is de kop bovenaan lager, en passen Berichten, Huisdier wassen, Koken en Herfstketting nu ook. Kleine extra\'s: zeepbelletjes in het bad en een zwevend briefje in een leeg gesprek.',
    open: 'Nog niet overal: Tekenen, het startscherm en Taken staand, Thema kiezen, Memory staand en Rekenen op lage tablets, en de meeste schermen op een liggende gsm. De nachtelijke controle gaat verder.',
  },
  {
    versie: '0.41',
    datum: '2026-10-27',
    titel: 'De wereld in 3D (proefversie)',
    tekst: 'De eerste 3D-versie van de wereld staat klaar, nog verborgen achter een schakelaar: de straat, de huizen van de kinderen (met hun kleuren en dak), de gebouwen, bomen, het speelplein en de vijver met een schuine camera, een chibi-figuurtje dat loopt met joystick of tik, en de anderen live. Ouders openen hem via het menu Wij → De wereld in 3D (proef) (zet hem op dit toestel aan; de knop linksboven in het wereldscherm zet hem weer uit); op een tablet kan het met ?3d=1 achter het adres. De gewone wereld blijft de standaard; Mijn huis en de Kleerkast blijven zoals ze zijn. Nog niet alle stukken hebben een 3D-versie (dan ziet het kind een eenvoudige vorm); die komen stap voor stap erbij.',
  },
  {
    versie: '0.40',
    datum: '2026-10-27',
    titel: 'De wereld ziet er rijker uit',
    tekst: 'De wereld kreeg meer sfeer, naar het voorbeeld van Frederique: grindpaden met steentjes en een opgehoogde rand met schaduw, grasplukjes, fruitbomen met appels of sinaasappels en een brede schaduw, en vlinders die rondfladderen (niet bij minder beweging). Dit is de eerste stap; huizen met zichtbaar dak en een meebewegende camera zijn voorgesteld in docs/wereld-isometrisch.md.',
  },
  {
    versie: '0.39',
    datum: '2026-10-27',
    titel: 'Herfstketting, een eekhoornboom in de wereld en het paddenstoelenpad',
    tekst: 'De herfst gaat door met een cadeau maken. Het verhaal is meteen te lezen (Grote ogen). In het spelletje Herfstketting maak je een ketting van bessen, bladeren, eikels en paddenstoelen af: kies telkens de kraal die er daarna komt (tikken, niet slepen). Het kost sterren in de winkel en ligt er pas als jullie het vrijgeven in Kinderen → Winkelaanbod, net als de zes nieuwe stukken. Wie het spelletje mag zien, ziet in de wereld ook de eekhoornboom, eerst met een gouden rand en een slot tot het gekocht is.',
    verhaal: 'De herfstketting van Siep (Grote ogen, 10 bladzijden)',
    spel: { naam: 'Herfstketting', prijs: 20 },
    stukken: [
      'Figuurtje: Eikelmuts (15), Met eekhoorn (20), Paraplu (15)',
      'Mijn huis: Notenboom (25), Egel (15), Herfstkrans (20)',
      'Springland: Het paddenstoelenpad (vijfde en laatste level van Zonnevallei; de volgende nacht begint een nieuwe wereld)',
      'De wereld: de eekhoornboom naast het bladerhuisje',
    ],
    open: 'De voorleesopnames voor het nieuwe verhaal en de nieuwe zinnen komen met de volgende ronde van de stemworkflow. De eekhoornboom en de Herfstketting zijn op een tablet nog niet bekeken.',
  },
  {
    versie: '0.38',
    datum: '2026-10-26',
    titel: 'Sint-Maarten: nieuw verhaal, Bladeren sorteren en een bladerhuisje in de wereld',
    tekst: 'Over twee weken is het Sint-Maarten, dus de nacht maakte een herfstpakket. Het verhaal is meteen te lezen (Grote ogen). Het spelletje Bladeren sorteren en de zes nieuwe stukken kosten sterren in de winkel en liggen er pas als jullie ze vrijgeven in Kinderen → Winkelaanbod. Het spelletje heeft ook een eigen gebouw in De wereld, het bladerhuisje. Zolang het nieuw is (14 dagen) heeft het een gouden rand, en zolang een kind het spel niet kocht staat er een slotje op de deur. Het gebouw staat er voor een kind pas als jullie het spel voor dat kind vrijgaven. Er is ook een nieuw Springland-level bij: Het herfstbos, het vierde in Zonnevallei.',
    verhaal: 'De lampion van Sint-Maarten (Grote ogen, 10 bladzijden)',
    spel: { naam: 'Bladeren sorteren', prijs: 20 },
    stukken: [
      'Figuurtje: Herfstmuts (15), Met herfstblad (20), Lampion (15)',
      'Mijn huis: Bladerhoop (15), Paddenstoelen (20), Lampionnenslinger (25)',
      'Springland: Het herfstbos (vierde level in Zonnevallei, open door het vorige uit te spelen)',
      'De wereld: het bladerhuisje met gouden rand en slot',
    ],
    open: 'De voorleesopnames voor het nieuwe verhaal en de nieuwe zinnen komen met de volgende ronde van de stemworkflow. Het bladerhuisje is op een tablet nog niet bekeken.',
  },
  {
    versie: '0.37',
    datum: '2026-10-25',
    titel: 'In de wereld zie je elkaar rondlopen',
    tekst: 'Wie in de wereld is, ziet nu de anderen van het gezin rondlopen, met hun naam boven het hoofd: Luca, Yuna, Feline en ook mama en papa als zij zelf in de wereld lopen (menu Wij → De wereld in). Je ziet elkaar vloeiend bewegen, met stappende voetjes. Er kan niets getypt of bewaard worden. Het verkeer is klein: er gaat alleen een bericht weg terwijl iemand loopt, hoogstens twee per seconde. Je kunt het verbruik volgen in het Supabase-dashboard onder Reports → Realtime; het gratis plan geeft 2 miljoen berichten per maand en we evalueren na een week. Meer in docs/wereld.md.',
    open: 'Live werkt alleen als in Supabase (Project Settings → Realtime) "Allow public access" aanstaat; anders lopen de kinderen gewoon alleen. Nog niet: elkaar aanspreken, bij elkaar binnengaan en zelf bouwen.',
  },
  {
    versie: '0.36',
    datum: '2026-10-25',
    titel: 'De wereld vult het scherm',
    tekst: 'Op het startscherm van de kinderen is De wereld nu de grote tegel links, met een plaatje van het straatje. Mijn taken staat als gewone tegel bij de andere (met het aantal taken dat nog moet; voor Feline een ronde knop) en opent een eigen pagina. In de wereld zelf vult het beeld het hele scherm: rechtsboven staan de sterren en een houten huisje-bordje om terug te keren naar het startscherm, links onder de joystick. Je ziet nu ook meer of minder wereld naargelang het toestel, liggend of staand. Ouders kunnen zelf ook in de wereld lopen: menu Wij → De wereld in, met het eigen figuurtje.',
    open: 'In de wereld van een ouder zijn de gebouwen en huizen alleen om naar te kijken. Het startscherm op een staande tablet scrolt nog (dat was al zo).',
  },
  {
    versie: '0.35',
    datum: '2026-10-25',
    titel: 'De wereld: loop door het straatje',
    tekst: 'Op het startscherm van elk kind staat nu een kaart Naar de wereld (voor Feline een ronde knop). Daar loopt het figuurtje door een straatje van bovenaf: sleep de joystick of tik op de grond. Je ziet de huizen van Luca, Yuna en Feline met hun eigen huis, het speelplein, de vijver, het voetbalveldje, de Winkel en het Spellenhuis. Lopen naar een deur opent het gewone scherm (winkel, spelletjes, of Mijn huis bij je eigen deur); terug brengt je weer in de wereld. De knop Startscherm rechtsboven brengt je altijd terug naar het gewone startscherm, dat de basis blijft. De wereld zelf telt niet mee voor de schermtijd, de spelletjes in het Spellenhuis tellen zoals altijd wel mee. Het ontwerp en het plan staan in docs/wereld.md.',
    open: 'Eerste versie: je kunt nog niet naar binnen bij een ander, niets zelf bouwen en elkaar niet live zien; dat zijn de volgende fases. Gebouwen volgen het Winkelaanbod nog niet.',
  },
  {
    versie: '0.34',
    datum: '2026-10-25',
    titel: 'Weekmenu bewaart vanzelf',
    tekst: 'Wat je bij Wat eten we invult, wordt na een seconde of twee automatisch bewaard, en ook als je naar een andere week of een ander scherm gaat. Voorheen was alles weg als je niet op Bewaren drukte, en bij terugkeren naar een week kon een bestaand gerecht zelfs gewist worden.',
  },
  {
    versie: '0.33',
    datum: '2026-10-25',
    titel: 'Weekmenu bewaard bij het karretje',
    tekst: 'Vulde je het weekmenu van volgende week in en zette je de ingrediënten meteen op de boodschappenlijst, dan bleef het gerecht niet bewaard als je daarna het scherm verliet zonder op Bewaren te drukken. Nu wordt het gerecht van die dag mee bewaard zodra je "Op de lijst" kiest.',
  },
  {
    versie: '0.32',
    datum: '2026-10-25',
    titel: 'Schermen passen op elke tablet, ook staand',
    tekst: 'Alle kinderschermen zijn nagekeken op gangbare tablets (iPad, Samsung Galaxy Tab, Fire, Lenovo), liggend en staand. Mijn huis en Mijn figuurtje passen nu altijd op één scherm: de keuzes bladeren met pijlen links en rechts in plaats van te scrollen, en op een staande tablet staat het huis bovenaan met de keuzes eronder. Ook verdween een klein stukje scrollen op bijna elk scherm met een themakop, en vullen Racen, Penalty\'s, Basket en Touwspringen precies het scherm. De puzzels kies je nu per bladzijde. In de lucht van Mijn huis vliegen vogeltjes, zweeft een luchtballon en valt er \'s nachts soms een ster. Voortaan controleert de app dit elke nacht.',
    open: 'Op een gsm in liggende stand moet je in sommige schermen nog scrollen; de nachtelijke controle pakt de overige schermen stap voor stap aan.',
  },
  {
    versie: '0.31',
    datum: '2026-10-25',
    titel: 'Dagplafond voor activiteiten instelbaar',
    tekst: 'Het aantal sterren dat een kind per dag hoogstens verdient met alle leerspelletjes samen (standaard 20) pas je nu zelf aan: menu Spelregels → Sterren per kind per dag uit activiteiten. De limieten per spelletje (versie 0.30) gelden daarbovenop.',
  },
  {
    versie: '0.30',
    datum: '2026-10-25',
    titel: 'Sterrenlimiet per spelletje',
    tekst: 'Je bepaalt nu zelf hoeveel sterren een kind per dag hoogstens verdient met elk lerend spelletje (rekenen, verhaal luisteren, zelf gelezen, kleuren en tekenen, schrijven): menu Spelregels → Sterren per spelletje per dag. Vul een getal in voor iedereen of voor één kind (dat gaat voor); leeg laten betekent geen eigen limiet, met 0 levert het spelletje niets meer op. De server houdt zich eraan, naast het gezamenlijke dagplafond voor activiteiten.',
  },
  {
    versie: '0.29',
    datum: '2026-10-25',
    titel: 'Springland spelen als ouder',
    tekst: 'Ook de ouders kunnen Springland spelen, op hun eigen gsm en met hun eigen figuurtje uit de chat: menu Wij → Springland spelen. Draai de gsm liggend; het spel vult dan het hele scherm. Je speelt de levels zelf vrij, je voortgang blijft op je gsm en er komt niets in het overzicht van de kinderen. Je figuurtje pas je aan via Chat met de kinderen → Mijn figuurtje aanpassen.',
  },
  {
    versie: '0.28',
    datum: '2026-10-25',
    titel: 'Springland: mooiere landkaart en spelen op de gsm',
    tekst: 'De landkaart van Springland is aangekleed en beweegt een beetje: bomen wiegen, een molen draait, een eendje zwemt in de vijver, vlinders en schaduwen van wolken drijven over. Het pad kronkelt vrij door de wereld en elk level is nu een klein 3D-eilandje in zijn eigen stijl (grasheuvel, bosje, wolkeneiland met regenboog, en later een strandje of een ijsberg). Springland werkt ook op een gsm in liggende stand: het spel vult dan het hele scherm met kleine knoppen in de hoeken, zodat je evenveel van de wereld ziet als op de tablet. Met "minder beweging" op het toestel staat de kaart stil.',
  },
  {
    versie: '0.27',
    datum: '2026-10-25',
    titel: 'Springland: landkaart met werelden',
    tekst: 'Springland opent nu op een landkaart van bovenaf. Elk level is een plekje op een slingerend pad; het kind tikt erop en zijn figuurtje wandelt erheen en begint te spelen. Uitgespeelde levels krijgen een gouden rand met het record, de volgende gaan open en wie een wereld uitspeelt, wandelt over het bruggetje naar de volgende wereld. De eerste wereld heet Zonnevallei (De weide, Het bos, De wolken). Elke nacht komt er een level bij; is een wereld vol (5 levels), dan begint er een nieuwe.',
    open: 'Uitgespeelde levels en waar het figuurtje staat, worden per tablet onthouden.',
  },
  {
    versie: '0.26',
    datum: '2026-10-25',
    titel: 'Spelletjes proberen vanuit het ouderdeel',
    tekst: 'Op vraag van de ouders: onder Kinderen → Spelletjes proberen speel je zelf elk spelletje en leerdeel (rekenen, verhalen, kleurplaten, zelf tekenen, schrijven), ook wat nog niet in de winkel ligt of nog niet gekocht is. Je kiest eerst als welk kind je speelt (kleuren, thema en leesniveau zijn dan die van het kind). Het spelletje opent beeldvullend, alleen met een smalle strook en een Stop-knop. Er wordt niets bewaard voor het kind: geen sterren, geen activiteit in het log en dus geen app-tijd. In Springland staan alle levels meteen open.',
  },
  {
    versie: '0.25',
    datum: '2026-10-25',
    titel: 'Springland: lopen en springen met je eigen figuurtje',
    tekst: 'Op vraag van de kinderen: een spelletje in de stijl van een platformspel waarin ze met hun eigen figuurtje (met alles wat ze kochten) lopen, springen en sterren en fruit pakken. Drie levels (De weide, Het bos, De wolken); het volgende gaat open als het vorige uitgespeeld is. Wie nog klein is (Feline) laat het figuurtje vanzelf lopen en tikt om te springen, de anderen lopen met pijltjes en een springknop. Er is geen verliezen: wie in het water valt, staat meteen terug, en een slakje of egeltje duwt alleen zacht terug. Het ligt meteen in de winkel (de kinderen vroegen er zelf om); verbergen kan bij Kinderen → Winkelaanbod.',
    spel: { naam: 'Springland', prijs: 30 },
    open: 'De voorleesstem leest de nieuwe uitlegzinnen nog met de tabletstem tot de opnames (scripts/maak-stem.ts) bijgemaakt zijn. Welke levels uitgespeeld zijn, wordt per tablet onthouden.',
  },
  {
    versie: '0.24',
    datum: '2026-10-25',
    titel: 'Schrijven: vrij over de lijn tekenen',
    tekst: 'Kinderen die lezen tekenen bij Schrijven nu vrij over de grijze lijn. Wat naast de lijn komt, kleurt meteen oranje. Met Klaar! krijgen ze een percentage (hoeveel ze volgden en hoeveel op de lijn lag). Onder de 40% proberen ze dezelfde opdracht opnieuw; een rondje van 5 geeft nog steeds 3 sterren. Wie niet leest (Feline) volgt zoals voorheen met de stip.',
  },
  {
    versie: '0.23',
    datum: '2026-10-25',
    titel: 'Schrijven met de vinger',
    tekst: 'Nieuw onder Spelen en leren: een kind volgt met de vinger grijze lijntjes, letters of woorden. Vier niveaus (Lijntjes, Letters, Korte woorden, Lange woorden); het kind hoort wat het moet schrijven en elk rondje van 5 levert 3 sterren op, zonder goedkeuring en niet meegeteld als app-tijd. Nog niet: hoofdletters, cijfers en schoonschrift.',
  },
  {
    versie: '0.22',
    datum: '2026-10-25',
    titel: 'Taken die om de zoveel dagen terugkomen',
    tekst: 'Onze taken en de taken van de kinderen kunnen nu ook om de N dagen of tweewekelijks herhalen, naast elke dag.',
  },
  {
    versie: '0.21',
    datum: '2026-10-25',
    titel: 'Dagelijks hoera met cadeautje',
    tekst: 'De eerste keer per dag dat een kind de app opent, komt er een feestelijke melding: welke spelletjes jullie sinds de vorige keer vrijgaven en een gratis cadeautje uit de winkel (een stuk voor het figuurtje of het huis dat het nog niet heeft, hoogstens 40 sterren waard en alleen uit wat vrijgegeven is). Het kind kan het meteen aandoen.',
  },
  {
    versie: '0.20',
    datum: '2026-10-25',
    titel: 'Pompoenen maken: bewaarde pompoenen',
    tekst: 'Bij het spelletje Pompoenen maken staan bewaarde pompoenen nu bovenaan en krijg je een melding Bewaard als je een pompoen bewaart (die bewaar-knop deed eerst niets zichtbaars).',
  },
  {
    versie: '0.19',
    datum: '2026-10-25',
    titel: 'Halloween: Boe het spookje en Pompoenen maken',
    tekst: 'Een lief Halloweenverhaal, een nieuw spelletje en zes nieuwe stukken voor het figuurtje en het huis. Het verhaal kunnen de kinderen meteen lezen (reeks Grote ogen). Het spelletje en de stukken liggen nog niet in de winkel: de kinderen kopen ze met sterren zodra jullie ze vrijgeven.',
    verhaal: 'Boe het spookje (Grote ogen, 11 bladzijden)',
    spel: { naam: 'Pompoenen maken', prijs: 25 },
    stukken: ['Figuurtje: Heksenhoed (25), Met pompoen (20), Pompoenlantaarn (15)', 'Huis: Pompoenen (15), Vogelverschrikker (25), Papieren vleermuisjes (20)'],
    open: 'De voorleesstem leest dit verhaal nog met de tabletstem: de opnames (scripts/maak-stem.ts) en prenten van de nieuwe figuren in de stijl van de andere verhalen moeten nog gemaakt worden. De nieuwe stukken zijn alleen voor lezers (Feline ziet er maximaal zes per soort).',
  },
  {
    versie: '0.18',
    datum: '2026-10-24',
    titel: 'Voetbalthema en je eigen thema kiezen',
    tekst: 'Nieuw kinderthema met voetbal. Kinderen kiezen zelf hun thema via Mijn thema; het thema loopt door in alle spelletjes, verhalen en schermen.',
  },
  {
    versie: '0.17',
    datum: '2026-10-24',
    titel: 'Meldingen op de gsm',
    tekst: 'Ouders krijgen een melding op de gsm bij nieuwe aanvragen en berichten. Zet ze aan in het menu; er is ook een testpagina om een melding naar een andere ouder te sturen.',
  },
  {
    versie: '0.16',
    datum: '2026-10-24',
    titel: 'Sterren bijgeven of afnemen',
    tekst: 'Een ouder kan bij Kinderen en tijd zelf sterren bijgeven of afnemen, met een reden. Het kind ziet een melding op het startscherm en het staat in het puntenlog.',
  },
  {
    versie: '0.15',
    datum: '2026-10-24',
    titel: 'Chat van de kinderen naar de ouders',
    tekst: 'Per kind aan te zetten (Kinderen). Kinderen die nog niet lezen sturen stickers; bij een antwoord krijgt de tablet een melding. Elk bericht toont figuurtje en naam.',
  },
  {
    versie: '0.14',
    datum: '2026-10-24',
    titel: 'Mijn huis',
    tekst: 'Het idee van de kinderen zelf: naast hun figuurtje hebben ze nu een eigen huis (het huisje naast het figuurtje op hun startscherm). Ze starten met een hutje en kleden het aan. Groter bouwen (huisje, verdieping, garage, torenhuis) en nieuwe stukken kopen ze met sterren in de winkel, tab Mijn huis.',
    open: 'Het huis ligt nog niet in de winkel: geef het vrij bij Kinderen → Winkelaanbod, tab Huis (of "Alles vrijgeven" bij Nieuw). Het hutje en de gratis stukken werken meteen.',
  },
  {
    versie: '0.13',
    datum: '2026-10-24',
    titel: 'Elke nacht iets nieuws',
    tekst: 'Vanaf vannacht komt er elke nacht een nieuw verhaal en een nieuw spelletje bij. Verhalen zijn meteen te lezen, spelletjes kopen de kinderen met sterren in de winkel. Hier zie je telkens wat er bij kwam.',
  },
  {
    versie: '0.12',
    datum: '2026-10-24',
    titel: 'Winkelaanbod voor ouders',
    tekst: 'Onder Kinderen, Winkelaanbod: geef spelletjes en stukken vrij, kies per kind wat het ziet en stel de prijs per item in. Nieuw aanbod ligt pas in de winkel na jullie vrijgave.',
  },
  {
    versie: '0.11',
    datum: '2026-10-24',
    titel: 'Boodschappen',
    tekst: 'Boodschappenlijst per winkel, ingrediënten uit het weekmenu, prijs en categorie per artikel, Afrekenen en het overzicht Uitgaven per maand, winkel en categorie.',
  },
  {
    versie: '0.10',
    datum: '2026-10-24',
    titel: 'Gewicht en Mijn profiel',
    tekst: 'Per ouder, privé: wegingen, BMI, grafiek met doel. Te vinden onder Mijn profiel.',
  },
  {
    versie: '0.9',
    datum: '2026-10-24',
    titel: 'Onze taken en Notities',
    tekst: 'Onder Wij: gedeelde taken voor de ouders (ook elke dag herhalend, met teller in het menu) en notities.',
  },
  {
    versie: '0.8',
    datum: '2026-10-24',
    titel: 'Weekmenu',
    tekst: 'Ouders vullen onder Wij de warme maaltijd per dag in; de kinderen zien die van vandaag op hun startscherm.',
  },
  {
    versie: '0.7',
    datum: '2026-10-24',
    titel: 'Winkel voor de kinderen',
    tekst: 'Kinderen kopen spelletjes en stukken voor hun figuurtje met sterren, via de sterren op het startscherm. Spelsterren komen zonder goedkeuring binnen.',
  },
  {
    versie: '0.6',
    datum: '2026-10-24',
    titel: 'Rekenen tot 1000',
    tekst: 'Nieuw niveau Tot 1000 (honderdtallen en tientallen) bij Rekenen.',
  },
  {
    versie: '0.5',
    datum: '2026-10-24',
    titel: 'Zelf tekenen en vrije kleuren',
    tekst: 'Bij de kleurplaten kunnen kinderen ook zelf tekenen (pen, potlood, stift, gum) en vrij een kleur kiezen.',
  },
  {
    versie: '0.4',
    datum: '2026-10-24',
    titel: 'Puzzels',
    tekst: 'Nieuw spel Puzzels: verhaalprenten in 4 tot 20 stukjes met nopjes.',
  },
  {
    versie: '0.3',
    datum: '2026-10-24',
    titel: 'Vlaamse voorleesstem',
    tekst: 'Verhalen worden voorgelezen door Dena en Arnaud om beurten. Per kind instelbaar door de ouders.',
  },
  {
    versie: '0.2',
    datum: '2026-10-24',
    titel: 'Tablet per kind en welkomstpad',
    tekst: 'Elke tablet hoort bij één kind; een ander kind kiezen kan alleen met de pincode. Nieuw welkomstpad voor het kind met 10 sterren als bonus op het einde.',
  },
  {
    versie: '0.1',
    datum: '2026-10-24',
    titel: 'Nieuw ouderdeel en nieuwe naam',
    tekst: 'De app heet nu Familie, met een nieuw icoon (het gezin onder één dak). Het ouderdeel heeft een hamburgermenu (zijbalk op pc).',
  },
]
