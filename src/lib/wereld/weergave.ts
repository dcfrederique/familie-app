// Hoe de wereld eruitziet en hoe snel het figuurtje loopt (ouderdeel Instellingen → Wereldinstellingen, docs/wereld-25d.md).
// Voor het hele gezin; zonder instellingen blijft alles plat en normaal, zoals voor 0.48.

export interface WereldWeergave {
  /** plat = bovenaanzicht van nu, schuin = 2.5D. */
  stijl: 'plat' | 'schuin'
  /** Camera draaien in graden (0 tot 60). */
  draaien: number
  /** Camera kantelen in graden (28 tot 75; hoe lager, hoe schuiner). */
  kantelen: number
  /** Hoe diep de huizen en gebouwen zijn (0 = plat, 1 = normaal, 1,5 = diep). */
  diepte: number
  /** Lange schaduwen van huizen en gebouwen. */
  schaduw: boolean
  /** Loopsnelheid, 1 = normaal (0,5 tot 2). */
  snelheid: number
  /** Hoe de kinderen lopen: met de joystick, door op de grond te tikken, of allebei. */
  besturing: Besturing
}

export type Besturing = 'beide' | 'joystick' | 'tikken'
export const BESTURINGEN: { id: Besturing; naam: string }[] = [
  { id: 'beide', naam: 'Joystick en tikken' }, { id: 'joystick', naam: 'Alleen joystick' }, { id: 'tikken', naam: 'Alleen tikken' },
]

export const standaardWeergave: WereldWeergave = { stijl: 'plat', draaien: 18, kantelen: 48, diepte: 1, schaduw: true, snelheid: 1, besturing: 'beide' }

export const HOEKEN = [
  { id: 'recht', naam: '3/4 recht', draaien: 0, kantelen: 52 },
  { id: 'gedraaid', naam: '3/4 licht gedraaid', draaien: 18, kantelen: 48 },
  { id: 'iso', naam: 'Isometrisch', draaien: 45, kantelen: 30 },
] as const

const tussen = (v: unknown, min: number, max: number, std: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : std
  return Math.min(max, Math.max(min, n))
}

/** Maakt van wat de database teruggeeft (mogelijk leeg of onvolledig) een geldige instelling. */
export function maakWeergave(ruw: unknown): WereldWeergave {
  const r = (ruw && typeof ruw === 'object' ? ruw : {}) as Record<string, unknown>
  const d = standaardWeergave
  return {
    stijl: r.stijl === 'schuin' ? 'schuin' : 'plat',
    draaien: Math.round(tussen(r.draaien, 0, 60, d.draaien)),
    kantelen: Math.round(tussen(r.kantelen, 28, 75, d.kantelen)),
    diepte: Math.round(tussen(r.diepte, 0, 1.5, d.diepte) * 10) / 10,
    schaduw: typeof r.schaduw === 'boolean' ? r.schaduw : d.schaduw,
    snelheid: Math.round(tussen(r.snelheid, 0.5, 2, d.snelheid) * 10) / 10,
    besturing: r.besturing === 'joystick' || r.besturing === 'tikken' ? r.besturing : 'beide',
  }
}
