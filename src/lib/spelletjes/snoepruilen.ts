// Snoepjes ruilen: een drie-op-een-rij-spel. Ruil twee buren; komt er een rij van drie of meer, dan verdwijnt die, vallen de snoepjes
// erboven naar beneden en vallen er nieuwe bij. Een rij van vier maakt een strooizakje (ruimt zijn hele rij of kolom op), onder
// een ijsvlakje liggen breekt het ijs en een vastgevroren snoepje ontdooit als er naast hem een rij verdwijnt.
import { ruilBord, ruilRondes, type RuilDoel, type RuilNiveau } from '../../data/snoepruilen.ts'
import type { Willekeur } from './kans.ts'

export interface Bord {
  rijen: number; kol: number; soorten: number
  /** Snoepsoort per vak (0 tot soorten − 1). */
  vak: number[]
  ijs: boolean[]
  vast: boolean[]
  zakje: boolean[]
}

export interface Stand { soorten: number[]; totaal: number; ijs: number; bevrijd: number; kettingen: number }
const leegStand = (n: number): Stand => ({ soorten: Array.from({ length: n }, () => 0), totaal: 0, ijs: 0, bevrijd: 0, kettingen: 0 })

/** Een tussenstand voor de animatie: de vakjes die verdwijnen (-1 in `na`), dan het bord na het vallen. */
export interface Stadium { weg: number[]; zonder: Bord; na: Bord }

const kopie = (b: Bord): Bord => ({ ...b, vak: b.vak.slice(), ijs: b.ijs.slice(), vast: b.vast.slice(), zakje: b.zakje.slice() })
const rij = (b: Bord, i: number) => Math.floor(i / b.kol)
const kolom = (b: Bord, i: number) => i % b.kol

/** Buren (boven, onder, links, rechts) van een vak. */
function buren(b: Bord, i: number): number[] {
  const r = rij(b, i), c = kolom(b, i), uit: number[] = []
  if (r > 0) uit.push(i - b.kol)
  if (r < b.rijen - 1) uit.push(i + b.kol)
  if (c > 0) uit.push(i - 1)
  if (c < b.kol - 1) uit.push(i + 1)
  return uit
}

interface Loop { cellen: number[]; hor: boolean }

/** Alle rijen en kolommen van drie of meer dezelfde snoepjes. */
export function zoekRijen(b: Bord): Loop[] {
  const uit: Loop[] = []
  for (let r = 0; r < b.rijen; r++) {
    let c = 0
    while (c < b.kol) {
      const s = b.vak[r * b.kol + c]
      let e = c
      while (e + 1 < b.kol && s >= 0 && b.vak[r * b.kol + e + 1] === s) e++
      if (s >= 0 && e - c >= 2) uit.push({ cellen: Array.from({ length: e - c + 1 }, (_, k) => r * b.kol + c + k), hor: true })
      c = e + 1
    }
  }
  for (let c = 0; c < b.kol; c++) {
    let r = 0
    while (r < b.rijen) {
      const s = b.vak[r * b.kol + c]
      let e = r
      while (e + 1 < b.rijen && s >= 0 && b.vak[(e + 1) * b.kol + c] === s) e++
      if (s >= 0 && e - r >= 2) uit.push({ cellen: Array.from({ length: e - r + 1 }, (_, k) => (r + k) * b.kol + c), hor: false })
      r = e + 1
    }
  }
  return uit
}

function wissel(b: Bord, a: number, c: number): Bord {
  const n = kopie(b)
  ;[n.vak[a], n.vak[c]] = [n.vak[c], n.vak[a]]
  ;[n.zakje[a], n.zakje[c]] = [n.zakje[c], n.zakje[a]]
  return n
}

/** Alle geldige ruilen (a, b): geen vastgevroren snoepje en er ontstaat een rij. */
export function geldigeRuilen(b: Bord): [number, number][] {
  const uit: [number, number][] = []
  for (let i = 0; i < b.vak.length; i++) {
    for (const j of [i + 1, i + b.kol]) {
      if (j >= b.vak.length || (j === i + 1 && kolom(b, i) === b.kol - 1)) continue
      if (b.vast[i] || b.vast[j] || b.vak[i] === b.vak[j]) continue
      if (zoekRijen(wissel(b, i, j)).length) uit.push([i, j])
    }
  }
  return uit
}

function nieuwVak(b: Bord, toeval: Willekeur): number { return Math.floor(toeval() * b.soorten) }

/** Een nieuw bord: geen rij van drie, ijsvlakjes en vastgevroren snoepjes, en minstens één geldige ruil. */
export function maakBord(niveau: RuilNiveau, ronde: number, toeval: Willekeur = Math.random): Bord {
  const cfg = ruilBord[niveau], rd = ruilRondes[niveau][ronde]
  for (let poging = 0; poging < 200; poging++) {
    const n = cfg.rijen * cfg.kol
    const b: Bord = { rijen: cfg.rijen, kol: cfg.kol, soorten: cfg.soorten, vak: Array.from({ length: n }, () => -1), ijs: Array.from({ length: n }, () => false), vast: Array.from({ length: n }, () => false), zakje: Array.from({ length: n }, () => false) }
    for (let i = 0; i < n; i++) {
      let s = nieuwVak(b, toeval)
      for (let k = 0; k < 20; k++) {
        const links = kolom(b, i) >= 2 && b.vak[i - 1] === s && b.vak[i - 2] === s
        const boven = rij(b, i) >= 2 && b.vak[i - b.kol] === s && b.vak[i - 2 * b.kol] === s
        if (!links && !boven) break
        s = (s + 1) % b.soorten
      }
      b.vak[i] = s
    }
    const plekken = Array.from({ length: n }, (_, i) => i)
    for (let i = plekken.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [plekken[i], plekken[j]] = [plekken[j], plekken[i]] }
    for (let k = 0; k < rd.ijs; k++) b.ijs[plekken[k]] = true
    const andere = plekken.slice().reverse()
    for (let k = 0; k < rd.vast; k++) b.vast[andere[k]] = true
    if (!zoekRijen(b).length && geldigeRuilen(b).length) return b
  }
  throw new Error('geen geldig bord gevonden')
}

/** Schudt de snoepjes (behalve de vastgevroren) door elkaar tot er geen rij staat en er minstens één geldige ruil is. */
export function schud(b: Bord, toeval: Willekeur = Math.random): Bord {
  for (let poging = 0; poging < 300; poging++) {
    const n = kopie(b)
    const vrij = n.vak.map((_, i) => i).filter((i) => !n.vast[i])
    const waarden = vrij.map((i) => n.vak[i])
    for (let i = waarden.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [waarden[i], waarden[j]] = [waarden[j], waarden[i]] }
    vrij.forEach((p, k) => { n.vak[p] = waarden[k]; n.zakje[p] = false })
    if (!zoekRijen(n).length && geldigeRuilen(n).length) return n
  }
  // Notoplossing: helemaal opnieuw vullen.
  for (let poging = 0; poging < 300; poging++) {
    const n = kopie(b)
    for (let i = 0; i < n.vak.length; i++) if (!n.vast[i]) { n.vak[i] = nieuwVak(n, toeval); n.zakje[i] = false }
    if (!zoekRijen(n).length && geldigeRuilen(n).length) return n
  }
  return b
}

/** Laat alle snoepjes vallen en vult bovenaan aan. */
function valEnVul(b: Bord, toeval: Willekeur): Bord {
  const n = kopie(b)
  for (let c = 0; c < n.kol; c++) {
    const onder: { s: number; ijsLos: boolean; vast: boolean; zakje: boolean }[] = []
    for (let r = n.rijen - 1; r >= 0; r--) {
      const i = r * n.kol + c
      if (n.vak[i] >= 0) onder.push({ s: n.vak[i], ijsLos: false, vast: n.vast[i], zakje: n.zakje[i] })
    }
    for (let r = n.rijen - 1, k = 0; r >= 0; r--, k++) {
      const i = r * n.kol + c
      const x = onder[k]
      if (x) { n.vak[i] = x.s; n.vast[i] = x.vast; n.zakje[i] = x.zakje }
      else { n.vak[i] = nieuwVak(n, toeval); n.vast[i] = false; n.zakje[i] = false }
    }
  }
  return n
}

export interface Uitkomst { bord: Bord; stadia: Stadium[]; stand: Stand }

/**
 * Verwerkt alle rijen op het bord: weghalen, vallen, bijvullen en herhalen (kettingen). `gewisseld` zijn de twee vakken van de ruil
 * (daar komt een strooizakje als er een rij van vier is). Geeft het bord, de stadia voor de animatie en wat er verzameld werd.
 */
export function verwerk(b0: Bord, toeval: Willekeur, gewisseld: number[] = [], zakjes = true): Uitkomst {
  let b = kopie(b0)
  const stand = leegStand(b.soorten)
  const stadia: Stadium[] = []
  let ronde = 0
  for (let veiligheid = 0; veiligheid < 40; veiligheid++) {
    const rijen = zoekRijen(b)
    if (!rijen.length) break
    const weg = new Set<number>()
    const maak: number[] = []
    for (const l of rijen) {
      if (zakjes && l.cellen.length >= 4) {
        // Een rij van vier of meer maakt een strooizakje op het gewisselde vak (of op het tweede vak van de rij).
        const plek = l.cellen.find((i) => gewisseld.includes(i)) ?? l.cellen[1]
        if (!b.zakje[plek]) maak.push(plek)
      }
      for (const i of l.cellen) weg.add(i)
    }
    // Een strooizakje dat meedoet, ruimt zijn hele rij of kolom op (en andere zakjes daarin doen hetzelfde).
    const wachtrij: { i: number; hor: boolean }[] = []
    for (const l of rijen) for (const i of l.cellen) if (b.zakje[i]) wachtrij.push({ i, hor: l.hor })
    const gedaan = new Set<string>()
    let kettingen = 0
    while (wachtrij.length) {
      const { i, hor } = wachtrij.shift()!
      const sl = `${i}${hor}`
      if (gedaan.has(sl)) continue
      gedaan.add(sl); kettingen++
      const cellen = hor ? Array.from({ length: b.kol }, (_, c) => rij(b, i) * b.kol + c) : Array.from({ length: b.rijen }, (_, r) => r * b.kol + kolom(b, i))
      for (const j of cellen) {
        if (!weg.has(j) && b.zakje[j]) wachtrij.push({ i: j, hor })
        weg.add(j)
      }
    }
    for (const p of maak) weg.delete(p)
    // Tellen.
    const wegLijst = [...weg].sort((x, y) => x - y)
    for (const i of wegLijst) {
      const s = b.vak[i]
      stand.soorten[s]++; stand.totaal++
      if (b.ijs[i]) { stand.ijs++; b.ijs[i] = false }
      if (b.vast[i]) { stand.bevrijd++; b.vast[i] = false }
    }
    if (ronde > 0) stand.kettingen++
    // Vastgevroren snoepjes naast een verdwenen vak ontdooien.
    for (const i of wegLijst) for (const j of buren(b, i)) if (b.vast[j] && !weg.has(j)) { b.vast[j] = false; stand.bevrijd++ }
    for (const p of maak) { b.zakje[p] = true }
    const zonder = kopie(b)
    for (const i of wegLijst) { zonder.vak[i] = -1; zonder.zakje[i] = false }
    for (const i of wegLijst) { b.vak[i] = -1; b.zakje[i] = false; b.vast[i] = false }
    b = valEnVul(b, toeval)
    stadia.push({ weg: wegLijst, zonder, na: kopie(b) })
    ronde++
  }
  // Staat er geen geldige ruil meer, dan schudt het bord zichzelf door.
  if (!geldigeRuilen(b).length) b = schud(b, toeval)
  return { bord: b, stadia, stand }
}

/** Ruilt twee buren; null als dat niet mag (geen buren, vastgevroren of er komt geen rij). */
export function ruil(b: Bord, a: number, c: number, toeval: Willekeur = Math.random, zakjes = true): Uitkomst | null {
  if (a < 0 || c < 0 || a >= b.vak.length || c >= b.vak.length) return null
  if (!buren(b, a).includes(c)) return null
  if (b.vast[a] || b.vast[c] || b.vak[a] === b.vak[c]) return null
  const w = wissel(b, a, c)
  if (!zoekRijen(w).length) return null
  return verwerk(w, toeval, [a, c], zakjes)
}

// ---- Het spel ----

export interface RuilSpel {
  niveau: RuilNiveau
  ronde: number
  bord: Bord
  /** Zetten die nog mogen (0 bij geen limiet). */
  zettenOver: number
  zetten: number
  stand: Stand
  pluimen: number[]
  /** Hoe vaak deze ronde al mislukte (strengere score bij moeilijk). */
  mislukt: number
  klaar: boolean
}

export function isGehaald(doel: RuilDoel, st: Stand): boolean {
  if (doel.totaal !== undefined && st.totaal < doel.totaal) return false
  if (doel.soorten && doel.soorten.some(([s, n]) => st.soorten[s] < n)) return false
  if (doel.ijs !== undefined && st.ijs < doel.ijs) return false
  if (doel.bevrijd !== undefined && st.bevrijd < doel.bevrijd) return false
  return true
}

function beginRonde(niveau: RuilNiveau, ronde: number, toeval: Willekeur): Pick<RuilSpel, 'bord' | 'zettenOver' | 'zetten' | 'stand'> {
  const rd = ruilRondes[niveau][ronde]
  return { bord: maakBord(niveau, ronde, toeval), zettenOver: rd.zetten, zetten: 0, stand: leegStand(ruilBord[niveau].soorten) }
}

export function nieuwSpel(niveau: RuilNiveau, toeval: Willekeur = Math.random, ronde = 0): RuilSpel {
  return { niveau, ronde, ...beginRonde(niveau, ronde, toeval), pluimen: [], mislukt: 0, klaar: false }
}

export interface RuilUitkomst { spel: RuilSpel; gelukt: boolean; stadia: Stadium[]; rondeKlaar: boolean; teKort: boolean }

/** Een ruil in het spel. `teKort`: de zetten zijn op en het doel is niet gehaald. */
export function doeRuil(spel: RuilSpel, a: number, c: number, toeval: Willekeur = Math.random): RuilUitkomst {
  const nee = { spel, gelukt: false, stadia: [], rondeKlaar: false, teKort: false }
  if (spel.klaar) return nee
  const u = ruil(spel.bord, a, c, toeval, ruilBord[spel.niveau].zakjes)
  if (!u) return nee
  const stand: Stand = {
    soorten: spel.stand.soorten.map((x, i) => x + u.stand.soorten[i]), totaal: spel.stand.totaal + u.stand.totaal,
    ijs: spel.stand.ijs + u.stand.ijs, bevrijd: spel.stand.bevrijd + u.stand.bevrijd, kettingen: spel.stand.kettingen + u.stand.kettingen,
  }
  const rd = ruilRondes[spel.niveau][spel.ronde]
  const zettenOver = rd.zetten ? spel.zettenOver - 1 : 0
  let s: RuilSpel = { ...spel, bord: u.bord, stand, zettenOver, zetten: spel.zetten + 1 }
  const gehaald = isGehaald(rd.doel, stand)
  if (gehaald) s = { ...s, pluimen: [...s.pluimen, rondePluimen(rd.zetten, zettenOver, spel.mislukt)] }
  return { spel: s, gelukt: true, stadia: u.stadia, rondeKlaar: gehaald, teKort: !gehaald && !!rd.zetten && zettenOver <= 0 }
}

/** Na een mislukte ronde: een nieuw bord voor dezelfde ronde. */
export function opnieuwRonde(spel: RuilSpel, toeval: Willekeur = Math.random, mislukt = false): RuilSpel {
  return { ...spel, ...beginRonde(spel.niveau, spel.ronde, toeval), mislukt: spel.mislukt + (mislukt ? 1 : 0) }
}

export function volgende(spel: RuilSpel, toeval: Willekeur = Math.random): RuilSpel {
  const ronde = spel.ronde + 1
  if (ronde >= ruilRondes[spel.niveau].length) return { ...spel, klaar: true }
  return { ...nieuwSpel(spel.niveau, toeval, ronde), pluimen: spel.pluimen }
}

/** Pluimen: 3 met minstens 30 % van de zetten over, 2 met minstens 10 %, anders 1; elke mislukte poging kost een pluim (hoogstens twee). Zonder limiet 3. */
export function rondePluimen(limiet: number, over: number, mislukt = 0): number {
  if (!limiet) return 3
  const f = over / limiet
  const basis = f >= 0.3 ? 3 : f >= 0.1 ? 2 : 1
  return Math.max(1, basis - Math.min(2, mislukt))
}

/** Hoe goed een stand het doel dichterbij brengt (voor Tip en de test): getelde stukken die nog nodig waren. */
export function voortgang(doel: RuilDoel, voor: Stand, na: Stand): number {
  let v = 0
  if (doel.totaal !== undefined) v += Math.max(0, Math.min(doel.totaal, na.totaal) - Math.min(doel.totaal, voor.totaal))
  for (const [s, n] of doel.soorten ?? []) v += Math.max(0, Math.min(n, na.soorten[s]) - Math.min(n, voor.soorten[s]))
  if (doel.ijs !== undefined) v += 1.5 * Math.max(0, Math.min(doel.ijs, na.ijs) - Math.min(doel.ijs, voor.ijs))
  if (doel.bevrijd !== undefined) v += 2 * Math.max(0, Math.min(doel.bevrijd, na.bevrijd) - Math.min(doel.bevrijd, voor.bevrijd))
  return v
}

/** De ruil die het doel het meest dichterbij brengt (de Tip), of null als er geen is. */
export function tip(spel: RuilSpel): [number, number] | null {
  const rd = ruilRondes[spel.niveau][spel.ronde]
  const ruilen = geldigeRuilen(spel.bord)
  let beste: [number, number] | null = null, score = -1
  for (const [a, c] of ruilen) {
    let z = 7
    const u = ruil(spel.bord, a, c, () => (z = (z * 9301 + 49297) % 233280) / 233280, ruilBord[spel.niveau].zakjes)
    if (!u) continue
    const sc = voortgang(rd.doel, spel.stand, { soorten: spel.stand.soorten.map((x, i) => x + u.stand.soorten[i]), totaal: spel.stand.totaal + u.stand.totaal, ijs: spel.stand.ijs + u.stand.ijs, bevrijd: spel.stand.bevrijd + u.stand.bevrijd, kettingen: 0 })
    if (sc > score) { score = sc; beste = [a, c] }
  }
  return beste
}
