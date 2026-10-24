// Voorlezen: eerst een vooraf ingesproken Vlaamse opname (Azure, zie src/lib/stem.ts en docs/voorleesstem.md),
// anders de stem van de tablet (Web Speech API), bij voorkeur Vlaams, anders Nederlands.
import opnames from '../data/opnames.json'
import { opnameSleutel, stemVoorZin, woordOpTijd, type Stem, type StemKeuze, type Woordtijden } from './stem.ts'

const ingesproken = new Set<string>(opnames)

/** Is er een opname van deze tekst met deze stem? */
export const heeftOpname = (stem: Stem, tekst: string) => ingesproken.has(opnameSleutel(stem, tekst))

export function kanVoorlezen(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || (ingesproken.size > 0 && 'Audio' in window))
}

/** Stem van het kind dat nu de tablet gebruikt (voor korte zinnen); SpelKader en KindStart zetten die. */
let kindStem: StemKeuze = 'afwisselend'
export function gebruikStem(keuze: StemKeuze) {
  kindStem = keuze
}

let stopHuidige: (() => void) | null = null

/** Stopt wat er nu voorgelezen wordt, opname of tabletstem. */
export function stopVoorlezen() {
  stopHuidige?.()
  stopHuidige = null
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
}

function maakZin(tekst: string): SpeechSynthesisUtterance {
  const zin = new SpeechSynthesisUtterance(tekst)
  const stemmen = window.speechSynthesis.getVoices()
  const stem = stemmen.find((s) => s.lang === 'nl-BE') ?? stemmen.find((s) => s.lang.startsWith('nl'))
  if (stem) zin.voice = stem
  zin.lang = stem?.lang ?? 'nl-BE'
  zin.rate = 0.9
  return zin
}

function tabletLeesVoor(tekst: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.speak(maakZin(tekst))
}

/**
 * Speelt een opname. De mp3 wordt met fetch opgehaald (zo bewaart de service worker hem gewoon, zonder
 * range-verzoeken van het audio-element). Lukt het niet, dan opFout. Geeft een functie om te stoppen.
 */
function speelOpname(stem: Stem, tekst: string, opFout: () => void, opEinde?: () => void,
  opWoord?: (woord: number) => void): () => void {
  const sleutel = opnameSleutel(stem, tekst)
  let gestopt = false, audio: HTMLAudioElement | null = null, url = '', raf = 0
  const opruimen = () => {
    cancelAnimationFrame(raf)
    if (url) URL.revokeObjectURL(url)
    url = ''
  }
  const haal = <T,>(pad: string, als: (r: Response) => Promise<T>) =>
    fetch(pad).then((r) => { if (!r.ok) throw new Error(`${pad}: ${r.status}`); return als(r) })

  Promise.all([
    haal(`/stem/${sleutel}.mp3`, (r) => r.blob()),
    opWoord ? haal(`/stem/${sleutel}.json`, (r) => r.json() as Promise<Woordtijden>) : Promise.resolve([] as Woordtijden),
  ]).then(([mp3, tijden]) => {
    if (gestopt) return
    url = URL.createObjectURL(mp3)
    const a = audio = new Audio(url)
    let laatste = -1
    const volg = () => {
      if (gestopt) return
      const w = woordOpTijd(tijden, a.currentTime * 1000)
      if (w !== laatste) { laatste = w; opWoord?.(w) }
      raf = requestAnimationFrame(volg)
    }
    a.onended = () => { opruimen(); if (!gestopt) opEinde?.() }
    return a.play().then(() => { if (opWoord) volg() })
  }).catch(() => {
    opruimen()
    if (!gestopt) opFout()
  })

  return () => {
    gestopt = true
    audio?.pause()
    opruimen()
  }
}

/** Leest een korte zin voor: met de opname als die er is voor de stem van het kind. */
export function leesVoor(tekst: string) {
  if (!kanVoorlezen()) return
  stopVoorlezen()
  const stem = stemVoorZin(kindStem)
  if (stem && heeftOpname(stem, tekst)) stopHuidige = speelOpname(stem, tekst, () => tabletLeesVoor(tekst))
  else tabletLeesVoor(tekst)
}

/** Begin van elk woord in de tekst (tekenpositie). */
export function woordGrenzen(tekst: string): number[] {
  return [...tekst.matchAll(/\S+/g)].map((m) => m.index)
}

/** Welk woord hoort bij een tekenpositie. */
export function woordBij(grenzen: number[], positie: number): number {
  let i = 0
  while (i + 1 < grenzen.length && grenzen[i + 1] <= positie) i++
  return i
}

/**
 * Leest voor en meldt welk woord er klinkt, zodat het kan oplichten. Met een stem en een opname: de opname
 * met de woordtijden van Azure. Anders de tabletstem; niet elke tabletstem meldt woordgrenzen, dan schatten
 * we het tempo. Geeft een functie om te stoppen.
 */
export function leesVoorMetWoorden(tekst: string, opWoord: (woord: number) => void, opEinde: () => void,
  stem: Stem | null = null): () => void {
  if (!kanVoorlezen()) { opEinde(); return () => {} }
  stopVoorlezen()
  let stop: () => void
  if (stem && heeftOpname(stem, tekst)) {
    stop = speelOpname(stem, tekst, () => { stop = tabletMetWoorden(tekst, opWoord, opEinde) }, opEinde, opWoord)
  } else {
    stop = tabletMetWoorden(tekst, opWoord, opEinde)
  }
  const stopAlles = () => stop()
  stopHuidige = stopAlles
  return () => {
    stopAlles()
    if (stopHuidige === stopAlles) stopHuidige = null
  }
}

function tabletMetWoorden(tekst: string, opWoord: (woord: number) => void, opEinde: () => void): () => void {
  if (!('speechSynthesis' in window)) { opEinde(); return () => {} }
  const synth = window.speechSynthesis
  synth.cancel()
  const grenzen = woordGrenzen(tekst)
  const zin = maakZin(tekst)
  let gestopt = false, grensGezien = false, klok = 0
  const schat = (woord: number) => {
    if (gestopt || grensGezien || woord >= grenzen.length) return
    opWoord(woord)
    const lengte = (grenzen[woord + 1] ?? tekst.length) - grenzen[woord]
    klok = window.setTimeout(() => schat(woord + 1), 90 + lengte * 62)
  }
  zin.onstart = () => { opWoord(0); klok = window.setTimeout(() => schat(1), 700) }
  zin.onboundary = (e) => {
    if (e.name !== 'word' || gestopt) return
    if (!grensGezien) { grensGezien = true; clearTimeout(klok) }
    opWoord(woordBij(grenzen, e.charIndex))
  }
  zin.onend = () => { clearTimeout(klok); if (!gestopt) opEinde() }
  zin.onerror = () => { clearTimeout(klok); if (!gestopt) opEinde() }
  synth.speak(zin)
  return () => { gestopt = true; clearTimeout(klok); synth.cancel() }
}
