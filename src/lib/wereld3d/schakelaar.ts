// De schakelaar voor de 3D-wereld (docs/wereld-3d.md): standaard uit. `?3d=1` zet hem op dit toestel aan, `?3d=0` uit;
// ouders kunnen hem ook omzetten in hun eigen wereldscherm. Geen WebGL: dan blijft het de gewone wereld.
const SLEUTEL = 'familie.wereld3d'

export function drieDAan(zoek: string = typeof location === 'undefined' ? '' : location.search): boolean {
  const vraag = new URLSearchParams(zoek).get('3d')
  try {
    if (vraag === '1') localStorage.setItem(SLEUTEL, '1')
    else if (vraag === '0') localStorage.removeItem(SLEUTEL)
    else return localStorage.getItem(SLEUTEL) === '1'
  } catch { /* geen opslag: alleen de URL telt */ }
  return vraag === '1'
}

export function zetDrieD(aan: boolean) {
  try { if (aan) localStorage.setItem(SLEUTEL, '1'); else localStorage.removeItem(SLEUTEL) } catch { /* geen opslag */ }
}

/** Kan dit toestel WebGL? */
export function kanWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}
