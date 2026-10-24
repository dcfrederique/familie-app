// Het menu van het ouderdeel (docs/ouderdeel.md). Onderdelen zonder pad komen later en staan grijs.

export type MenuIcoon =
  | 'vandaag' | 'goedkeuren' | 'taken' | 'kinderen' | 'spelregels'
  | 'onzetaken' | 'boodschappen' | 'notities' | 'gewicht' | 'profiel' | 'fitness' | 'lopen'
  | 'chat' | 'weekmenu' | 'toestellen' | 'pincode' | 'winkels' | 'nieuw' | 'aanbod' | 'melding'

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
  /** Label naast de groepsnaam als de hele groep nog niet bestaat. */
  later?: string
  /** Alleen op de gsm van een ouder, niet op de tablet van een kind. */
  alleenOuderGsm?: boolean
  /** Toont onder de items elk kind met zijn figuurtje. */
  metKinderen?: boolean
  items: MenuItem[]
}

export const ouderMenu: MenuGroep[] = [
  { items: [
    { naam: 'Vandaag', icoon: 'vandaag', pad: '/ouder' },
    { naam: 'Goedkeuren', icoon: 'goedkeuren', pad: '/ouder/goedkeuren', teller: 'goedkeuren' },
    { naam: 'Nieuw in de app', icoon: 'nieuw', pad: '/ouder/nieuw', alleenOuderGsm: true },
  ] },
  { naam: 'Kinderen', metKinderen: true, items: [
    { naam: 'Taken van de kinderen', icoon: 'taken', pad: '/ouder/taken' },
    { naam: 'Kinderen en tijd', icoon: 'kinderen', pad: '/ouder/kinderen' },
    { naam: 'Spelregels', icoon: 'spelregels', pad: '/ouder/spelregels' },
    { naam: 'Winkelaanbod', icoon: 'aanbod', pad: '/ouder/aanbod', teller: 'aanbod', alleenOuderGsm: true },
  ] },
  { naam: 'Wij', alleenOuderGsm: true, items: [
    { naam: 'Weekmenu', icoon: 'weekmenu', pad: '/ouder/weekmenu' },
    { naam: 'Onze taken', icoon: 'onzetaken', pad: '/ouder/onze-taken', teller: 'onzetaken' },
    { naam: 'Boodschappen', icoon: 'boodschappen', pad: '/ouder/boodschappen' },
    { naam: 'Notities', icoon: 'notities', pad: '/ouder/notities' },
    { naam: 'Chat met de kinderen', icoon: 'chat', pad: '/ouder/chat', teller: 'chat' },
  ] },
  { naam: 'Gezondheid', alleenOuderGsm: true, items: [
    { naam: 'Gewicht', icoon: 'gewicht', pad: '/ouder/gewicht' },
    { naam: 'Mijn profiel', icoon: 'profiel', pad: '/ouder/profiel' },
    { naam: 'Fitness', icoon: 'fitness' },
    { naam: 'Loopschema', icoon: 'lopen' },
  ] },
  { naam: 'Instellingen', items: [
    { naam: 'Toestellen en meldingen', icoon: 'toestellen', pad: '/ouder/toestellen' },
    { naam: 'Testmelding', icoon: 'melding', pad: '/ouder/testmelding', alleenOuderGsm: true },
    { naam: 'Pincode', icoon: 'pincode', pad: '/ouder/pincode', alleenOuderGsm: true },
    { naam: 'Winkels', icoon: 'winkels', pad: '/ouder/winkels', alleenOuderGsm: true },
  ] },
]
