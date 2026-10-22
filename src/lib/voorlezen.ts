// Voorlezen met de stem van de tablet (Web Speech API), bij voorkeur Vlaams, anders Nederlands.

export function kanVoorlezen(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
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

export function leesVoor(tekst: string) {
  if (!kanVoorlezen()) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(maakZin(tekst))
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
 * Leest voor en meldt welk woord er klinkt, zodat het kan oplichten.
 * Niet elke stem meldt woordgrenzen: dan schatten we het tempo. Geeft een functie om te stoppen.
 */
export function leesVoorMetWoorden(tekst: string, opWoord: (woord: number) => void, opEinde: () => void): () => void {
  if (!kanVoorlezen()) { opEinde(); return () => {} }
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
