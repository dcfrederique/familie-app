// Het menu van het ouderdeel (docs/ouderdeel.md). Onderdelen zonder pad komen later en staan grijs.

export type MenuIcoon =
  | 'vandaag' | 'goedkeuren' | 'taken' | 'kinderen' | 'spelregels'
  | 'onzetaken' | 'boodschappen' | 'notities' | 'gewicht' | 'profiel' | 'fitness'
  | 'chat' | 'weekmenu' | 'toestellen' | 'pincode' | 'winkels' | 'uitgaven' | 'nieuw' | 'aanbod' | 'melding' | 'proberen' | 'springland' | 'wereld' | 'voorraad' | 'recepten'

export interface MenuItem {
  naam: string
  icoon: MenuIcoon
  /** Leeg: komt later. */
  pad?: string
  /** Toont een getal: wat op goedkeuring wacht, je taken in Onze taken voor vandaag en eerder, of nieuw winkelaanbod. */
  teller?: 'goedkeuren' | 'onzetaken' | 'aanbod' | 'chat'
  alleenOuderGsm?: boolean
}

export interface MenuGroep {
  naam?: string
  /** Vaste naam voor de hubpagina's van de onderbalk (/ouder/groep/:sleutel) en de open groep in de stijl Snel. */
  sleutel?: string
  /** Label naast de groepsnaam als de hele groep nog niet bestaat. */
  later?: string
  /** Alleen op de gsm van een ouder, niet op de tablet van een kind. */
  alleenOuderGsm?: boolean
  /** Toont onder de items elk kind met zijn figuurtje. */
  metKinderen?: boolean
  items: MenuItem[]
}

/** Wat in de snelknoppen bovenaan het menu (stijl Snel) komt, op de gsm van een ouder; op een tablet enkel wat daar bestaat. */
export const snelPaden = ['/ouder/goedkeuren', '/ouder/onze-taken', '/ouder/boodschappen', '/ouder/chat']

// Indeling van 28 oktober 2026 (menu herindelen): Kinderen, Spelen en wereld, Huishouden, Gezondheid, Instellingen.
export const ouderMenu: MenuGroep[] = [
  { items: [
    { naam: 'Vandaag', icoon: 'vandaag', pad: '/ouder' },
    { naam: 'Goedkeuren', icoon: 'goedkeuren', pad: '/ouder/goedkeuren', teller: 'goedkeuren' },
  ] },
  { naam: 'Kinderen', sleutel: 'kinderen', metKinderen: true, items: [
    { naam: 'Taken van de kinderen', icoon: 'taken', pad: '/ouder/taken' },
    { naam: 'Kinderen en tijd', icoon: 'kinderen', pad: '/ouder/kinderen' },
    { naam: 'Chat met de kinderen', icoon: 'chat', pad: '/ouder/chat', teller: 'chat', alleenOuderGsm: true },
  ] },
  { naam: 'Spelen en wereld', sleutel: 'spelen', items: [
    { naam: 'Winkelaanbod', icoon: 'aanbod', pad: '/ouder/aanbod', teller: 'aanbod', alleenOuderGsm: true },
    { naam: 'Spelletjes proberen', icoon: 'proberen', pad: '/ouder/proberen' },
    { naam: 'Springland spelen', icoon: 'springland', pad: '/ouder/springland', alleenOuderGsm: true },
    { naam: 'De wereld in', icoon: 'wereld', pad: '/ouder/wereld', alleenOuderGsm: true },
    { naam: 'Kaart bewerken', icoon: 'wereld', pad: '/ouder/kaart', alleenOuderGsm: true },
  ] },
  { naam: 'Huishouden', sleutel: 'huishouden', alleenOuderGsm: true, items: [
    { naam: 'Weekmenu', icoon: 'weekmenu', pad: '/ouder/weekmenu' },
    { naam: 'Onze taken', icoon: 'onzetaken', pad: '/ouder/onze-taken', teller: 'onzetaken' },
    { naam: 'Boodschappen', icoon: 'boodschappen', pad: '/ouder/boodschappen' },
    { naam: 'Voorraad', icoon: 'voorraad', pad: '/ouder/voorraad' },
    { naam: 'Recepten', icoon: 'recepten', pad: '/ouder/recepten' },
    { naam: 'Uitgaven', icoon: 'uitgaven', pad: '/ouder/uitgaven' },
    { naam: 'Notities', icoon: 'notities', pad: '/ouder/notities' },
  ] },
  { naam: 'Gezondheid', sleutel: 'gezondheid', alleenOuderGsm: true, items: [
    { naam: 'Gewicht', icoon: 'gewicht', pad: '/ouder/gewicht' },
  ] },
  { naam: 'Instellingen', sleutel: 'instellingen', items: [
    { naam: 'Spelregels', icoon: 'spelregels', pad: '/ouder/spelregels' },
    { naam: 'Toestellen en meldingen', icoon: 'toestellen', pad: '/ouder/toestellen' },
    { naam: 'Pincode', icoon: 'pincode', pad: '/ouder/pincode', alleenOuderGsm: true },
    { naam: 'Winkels en categorieën', icoon: 'winkels', pad: '/ouder/winkels', alleenOuderGsm: true },
    { naam: 'Wereldinstellingen', icoon: 'wereld', pad: '/ouder/wereld-instellingen', alleenOuderGsm: true },
    { naam: 'Nieuw in de app', icoon: 'nieuw', pad: '/ouder/nieuw', alleenOuderGsm: true },
  ] },
]
