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
