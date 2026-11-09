// Schuifpuzzel: vakjes 0 .. n²-1; de waarde is het stukje dat er ligt, n²-1 is het lege vakje (rechtsonder als het klopt).
import { schuifNiveaus, schuifRondesAantal, type SchuifNiveau } from '../../data/schuif.ts'
import type { Willekeur } from './kans.ts'

export interface SchuifSpel {
  niveau: SchuifNiveau
  ronde: number
  maat: number
  vak: number[]
  begin: number[]
  zetten: number
  pluimen: number[]
}

const buren = (i: number, n: number) => {
  const x = i % n, y = Math.floor(i / n), uit: number[] = []
  if (x > 0) uit.push(i - 1)
  if (x < n - 1) uit.push(i + 1)
  if (y > 0) uit.push(i - n)
  if (y < n - 1) uit.push(i + n)
  return uit
}

export const leeg = (s: { vak: number[]; maat: number }) => s.vak.indexOf(s.maat * s.maat - 1)
export const klopt = (vak: readonly number[]) => vak.every((v, i) => v === i)

/** Schud met echte schuifjes (dus altijd op te lossen), nooit meteen terug, en nooit al juist. */
export function schud(n: number, stappen: number, rnd: Willekeur): number[] {
  for (;;) {
    const vak = Array.from({ length: n * n }, (_, i) => i)
    let l = n * n - 1, vorig = -1
    for (let k = 0; k < stappen; k++) {
      const opties = buren(l, n).filter((j) => j !== vorig)
      const j = opties[Math.floor(rnd() * opties.length)]
      ;[vak[l], vak[j]] = [vak[j], vak[l]]
      vorig = l; l = j
    }
    if (!klopt(vak)) return vak
  }
}

function beginRonde(niveau: SchuifNiveau, ronde: number, pluimen: number[], rnd: Willekeur): SchuifSpel {
  const n = schuifNiveaus[niveau], r = Math.min(ronde, schuifRondesAantal - 1)
  const vak = schud(n.maat[r], n.schudden[r], rnd)
  return { niveau, ronde, maat: n.maat[r], vak, begin: vak.slice(), zetten: 0, pluimen }
}

export const nieuwSpel = (niveau: SchuifNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Schuif het stukje op vakje i naar het lege vakje (alleen als het ernaast ligt). */
export function schuif(s: SchuifSpel, i: number): SchuifSpel {
  const l = leeg(s)
  if (!buren(l, s.maat).includes(i)) return s
  const vak = s.vak.slice()
  ;[vak[l], vak[i]] = [vak[i], vak[l]]
  return { ...s, vak, zetten: s.zetten + 1 }
}

export const kanSchuiven = (s: SchuifSpel, i: number) => buren(leeg(s), s.maat).includes(i)
export const rondeKlaar = (s: SchuifSpel) => klopt(s.vak)
export const opnieuwRonde = (s: SchuifSpel): SchuifSpel => ({ ...s, vak: s.begin.slice(), zetten: 0 })

export function rondePluimen(s: SchuifSpel, seconden: number): number {
  const n = schuifNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.zetten <= n.zetten) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: SchuifSpel, seconden: number, rnd: Willekeur = Math.random) => beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: SchuifSpel) => s.ronde >= schuifRondesAantal
