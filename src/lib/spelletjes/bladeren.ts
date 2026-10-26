// Bladeren sorteren: leg elk blad in het mandje met dezelfde kleur (of vorm). Een foute zet kost niets, het blad glijdt terug.
import {
  bladerenNiveaus, bladerenPerRonde, bladKleuren, bladVormen, type BladerenNiveau, type BladKleur, type BladVorm,
} from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Blad { kleur: BladKleur; vorm: BladVorm }

export interface BladerenSpel {
  niveau: BladerenNiveau
  /** De bladeren van de ronde, in de volgorde waarin ze komen. */
  bladeren: Blad[]
  /** Het blad dat nu aan de beurt is. */
  nu: number
  /** Hoeveel bladeren er al in elk mandje liggen. */
  mandjes: Record<string, number>
  /** Aantal keer dat een blad in het verkeerde mandje werd gelegd. */
  misser: number
}

/** In welk mandje hoort dit blad op dit niveau? */
export const mandjeVoor = (niveau: BladerenNiveau, blad: Blad): string => blad[bladerenNiveaus[niveau].op]

/**
 * Tien bladeren, eerlijk verdeeld over de mandjes (elk mandje minstens twee keer), en door elkaar.
 * Op het moeilijke niveau wordt gesorteerd op vorm, dus de kleur is er willekeurig bij om te verwarren.
 */
export function nieuwSpel(niveau: BladerenNiveau, rnd: Willekeur = Math.random): BladerenSpel {
  const { op, mandjes } = bladerenNiveaus[niveau]
  const lijst: Blad[] = []
  for (let i = 0; i < bladerenPerRonde; i++) {
    const doel = mandjes[i % mandjes.length]
    lijst.push(op === 'kleur'
      ? { kleur: doel as BladKleur, vorm: bladVormen[geheelGetal(0, bladVormen.length - 1, rnd)] }
      : { vorm: doel as BladVorm, kleur: bladKleuren[geheelGetal(0, bladKleuren.length - 1, rnd)] })
  }
  return { niveau, bladeren: schud(lijst, rnd), nu: 0, mandjes: Object.fromEntries(mandjes.map((m) => [m, 0])), misser: 0 }
}

export const huidigBlad = (spel: BladerenSpel): Blad | null => spel.bladeren[spel.nu] ?? null
export const isKlaar = (spel: BladerenSpel) => spel.nu >= spel.bladeren.length

export type Zet = 'goed' | 'fout' | 'klaar'

/** Leg het huidige blad in een mandje; fout of een onbekend mandje laat alles staan. */
export function leg(spel: BladerenSpel, mandje: string): { spel: BladerenSpel; zet: Zet } {
  const blad = huidigBlad(spel)
  if (!blad || !(mandje in spel.mandjes)) return { spel, zet: 'fout' }
  if (mandjeVoor(spel.niveau, blad) !== mandje) return { spel: { ...spel, misser: spel.misser + 1 }, zet: 'fout' }
  const na: BladerenSpel = { ...spel, nu: spel.nu + 1, mandjes: { ...spel.mandjes, [mandje]: spel.mandjes[mandje] + 1 } }
  return { spel: na, zet: isKlaar(na) ? 'klaar' : 'goed' }
}
