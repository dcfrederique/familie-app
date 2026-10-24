// Stijlgids voor de prenten (docs/prenten.md): één stijl voor verhalen, kleurplaten en puzzels.
// Elke opdracht aan het beeldmodel begint met STIJL, plus de beschrijving van de vaste personages die erin staan.
// Zo zien Dirk, Mo en Pip er op elke bladzijde hetzelfde uit. Na de proef komen hier ook de goedgekeurde
// referentieprenten bij (referentie), die bij elke generatie meegaan.

export const STIJL = [
  'Prentenboekillustratie voor kinderen van 4 tot 8 jaar.',
  'Vlakke vormen met effen kleuren, geen verlopen, geen texturen, geen omlijnde contouren, zachte afgeronde vormen.',
  'Warm en rustig palet: hemelblauw #BFE3F5, grasgroen #6CC070, zandbeige #E8D3A8, zonnegeel #F2B33D, paars #7A3DB0 als accent; nachtscènes op donkerblauw #1E2D55.',
  'Eenvoudige achtergrond met weinig details, het hoofdpersonage groot en duidelijk in beeld.',
  'Geen tekst, letters of cijfers in de prent. Geen merken, logo\'s of bekende personages uit films of tekenfilms.',
  'Liggend formaat.',
].join(' ')

/** Kleurplaat: dezelfde personages, maar als lijntekening om in te kleuren. */
export const KLEURPLAAT = [
  'Kleurplaat voor kinderen van 4 tot 8 jaar: alleen dikke zwarte lijnen op wit, geen grijs, geen schaduw, geen arcering.',
  'Grote gesloten vlakken (elk vlak volledig omlijnd), weinig kleine details, zodat een kind elk vlak met één tik kan inkleuren.',
  'Geen tekst. Geen merken of bekende personages.',
].join(' ')

export interface Personage { naam: string; beschrijving: string; referentie?: string }

/** De vaste personages uit de verhalen, zoals ze nu als SVG getekend zijn (src/data/verhaalFiguren.tsx). */
export const personages: Record<string, Personage> = {
  dirk: {
    naam: 'Dirk de draak',
    beschrijving: 'Dirk is een vriendelijke, ronde, mollige draak, grasgroen (#3FA34D) met een lichtgroene buik (#A8D86E), '
      + 'kleine donkergroene vleugeltjes, twee kleine crèmekleurige hoorntjes, grote vriendelijke ogen, een korte staart. Niet eng.',
  },
  mo: {
    naam: 'Mo de muis',
    beschrijving: 'Mo is een kleine grijze muis (#9AA0A6) met grote ronde roze oren, een roze neusje, een lange dunne roze staart en kraaloogjes.',
  },
  pip: {
    naam: 'Pip de pinguïn',
    beschrijving: 'Pip is een klein rond pinguïnkuiken, donkergrijs (#2B3440) met een witte buik en wit gezichtje, oranje snavel en oranje voetjes.',
  },
}

/** Volledige opdracht voor één prent. */
export function opdracht(scene: string, figuren: string[], soort: 'prent' | 'kleurplaat' = 'prent'): string {
  const wie = figuren.map((f) => personages[f]?.beschrijving).filter(Boolean)
  return [soort === 'kleurplaat' ? KLEURPLAAT : STIJL, ...wie, `Scène: ${scene}`].join('\n\n')
}
