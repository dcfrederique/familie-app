// Vrij tekenen: een tekening is een lijst strepen in een vast blad van 1200 × 900 (zoals de kleurplaten, 4:3).
// Zo tekent elke streep even groot, hoe groot het scherm ook is, en kan de tekening bewaard en opnieuw getekend worden.

export const BREED = 1200
export const HOOG = 900

export type Gereedschap = 'pen' | 'potlood' | 'stift' | 'gum'
export type Dikte = 0 | 1 | 2

export interface Streep {
  g: Gereedschap
  /** Kleur (de gum heeft er geen). */
  k: string
  d: Dikte
  /** Punten na elkaar: x, y, druk (0 tot 1). */
  p: number[]
}

/** Breedte van de lijn per gereedschap en dikte, in punten van het blad. */
export const breedtes: Record<Gereedschap, [number, number, number]> = {
  pen: [4, 8, 15],
  potlood: [6, 11, 20],
  stift: [14, 26, 44],
  gum: [26, 50, 84],
}

/** Pen en potlood worden dikker als je met een stylus harder drukt; stift en gum blijven gelijk. */
export function lijnBreedte(g: Gereedschap, d: Dikte, druk: number): number {
  const b = breedtes[g][d]
  return g === 'pen' || g === 'potlood' ? b * (0.55 + 0.9 * Math.min(1, Math.max(0, druk))) : b
}

const rond = (n: number) => Math.round(n * 10) / 10

/** Voegt een punt toe; punten die bijna op het vorige liggen slaan we over. */
export function puntErbij(s: Streep, x: number, y: number, druk: number): boolean {
  const n = s.p.length
  x = rond(Math.min(BREED, Math.max(0, x)))
  y = rond(Math.min(HOOG, Math.max(0, y)))
  if (n >= 3 && Math.hypot(x - s.p[n - 3], y - s.p[n - 2]) < 1.5) return false
  s.p.push(x, y, Math.round(druk * 100) / 100)
  return true
}

/** Lengte van alle lijnen die je tekende (de gum telt niet mee). */
export function inktLengte(strepen: Streep[]): number {
  let lengte = 0
  for (const s of strepen) {
    if (s.g === 'gum') continue
    for (let i = 3; i < s.p.length; i += 3) lengte += Math.hypot(s.p[i] - s.p[i - 3], s.p[i + 1] - s.p[i - 2])
  }
  return lengte
}

/** Pas sterren als er echt getekend is: minstens vijf strepen en samen ruim anderhalve keer de breedte van het blad. */
export const genoegGetekend = (strepen: Streep[]) =>
  strepen.filter((s) => s.g !== 'gum').length >= 5 && inktLengte(strepen) >= 2000

/** Leest een bewaarde tekening na; wat niet klopt, valt weg. */
export function strepenUit(data: unknown): Streep[] {
  if (!Array.isArray(data)) return []
  return data.filter((s): s is Streep => !!s && typeof s === 'object' && s.g in breedtes && [0, 1, 2].includes(s.d)
    && typeof s.k === 'string' && Array.isArray(s.p) && s.p.length >= 3 && s.p.length % 3 === 0
    && s.p.every((n: unknown) => typeof n === 'number' && Number.isFinite(n)))
}

// ---------- tekenen op een canvas ----------

// Potloodkorrel: een vast patroon van stipjes in de kleur, telkens hetzelfde zodat dubbel tekenen niet donkerder wordt.
const korrels = new Map<string, HTMLCanvasElement>()
function korrel(kleur: string): HTMLCanvasElement {
  let c = korrels.get(kleur)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = 48
  const ctx = c.getContext('2d')!
  ctx.fillStyle = kleur
  let zaad = 7
  const toeval = () => (zaad = (zaad * 16807) % 2147483647) / 2147483647
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) if (toeval() < 0.62) ctx.fillRect(x, y, 1, 1)
  korrels.set(kleur, c)
  return c
}

function stijl(ctx: CanvasRenderingContext2D, s: Streep) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = s.g === 'gum' ? 'destination-out' : 'source-over'
  ctx.strokeStyle = s.g === 'potlood' ? ctx.createPattern(korrel(s.k), 'repeat') ?? s.k : s.g === 'gum' ? '#000' : s.k
}

/** Tekent het stukje van punt `i - 1` naar punt `i` (bij het eerste punt een stip). */
export function tekenStuk(ctx: CanvasRenderingContext2D, s: Streep, i: number) {
  stijl(ctx, s)
  const a = Math.max(0, i - 1) * 3, b = i * 3
  ctx.lineWidth = lijnBreedte(s.g, s.d, s.p[b + 2])
  ctx.beginPath()
  ctx.moveTo(s.p[a], s.p[a + 1])
  ctx.lineTo(s.p[b], s.p[b + 1])
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
}

/** Tekent alle strepen opnieuw; `schaal` zet punten van het blad om naar pixels van het canvas. */
export function tekenAlles(ctx: CanvasRenderingContext2D, strepen: Streep[], schaal: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.setTransform(schaal, 0, 0, schaal, 0, 0)
  for (const s of strepen) for (let i = 0; i < s.p.length / 3; i++) tekenStuk(ctx, s, i)
}

/** De tekening als prent op wit papier. */
export function alsPrent(strepen: Streep[], breed = 800): string {
  const c = document.createElement('canvas')
  c.width = breed
  c.height = Math.round((breed * HOOG) / BREED)
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  tekenAlles(ctx, strepen, breed / BREED)
  // Wit papier eronder: wat de gum wegnam, is dan weer wit.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}
