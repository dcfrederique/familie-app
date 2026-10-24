// Het menu van het ouderdeel (docs/ouderdeel.md). Onderdelen zonder pad komen later en staan grijs.

export type MenuIcoon =
  | 'vandaag' | 'goedkeuren' | 'taken' | 'kinderen' | 'spelregels'
  | 'onzetaken' | 'boodschappen' | 'notities' | 'gewicht' | 'fitness' | 'lopen'
  | 'weekmenu' | 'toestellen' | 'pincode'

export interface MenuItem {
  naam: string
  icoon: MenuIcoon
  /** Leeg: komt later. */
  pad?: string
  /** Toont het aantal dingen dat op goedkeuring wacht. */
  teller?: boolean
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
    { naam: 'Goedkeuren', icoon: 'goedkeuren', pad: '/ouder/goedkeuren', teller: true },
  ] },
  { naam: 'Kinderen', metKinderen: true, items: [
    { naam: 'Taken van de kinderen', icoon: 'taken', pad: '/ouder/taken' },
    { naam: 'Kinderen en tijd', icoon: 'kinderen', pad: '/ouder/kinderen' },
    { naam: 'Spelregels', icoon: 'spelregels', pad: '/ouder/spelregels' },
  ] },
  { naam: 'Wij', alleenOuderGsm: true, items: [
    { naam: 'Weekmenu', icoon: 'weekmenu', pad: '/ouder/weekmenu' },
    { naam: 'Onze taken', icoon: 'onzetaken' },
    { naam: 'Boodschappen', icoon: 'boodschappen' },
    { naam: 'Notities', icoon: 'notities' },
  ] },
  { naam: 'Gezondheid', later: 'nog later', alleenOuderGsm: true, items: [
    { naam: 'Gewicht', icoon: 'gewicht' },
    { naam: 'Fitness', icoon: 'fitness' },
    { naam: 'Loopschema', icoon: 'lopen' },
  ] },
  { naam: 'Instellingen', items: [
    { naam: 'Toestellen en meldingen', icoon: 'toestellen', pad: '/ouder/toestellen' },
    { naam: 'Pincode', icoon: 'pincode', pad: '/ouder/pincode', alleenOuderGsm: true },
  ] },
]
