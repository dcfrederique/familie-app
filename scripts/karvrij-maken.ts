// Maakt de puzzels voor Kar vrij! (src/data/karvrij.ts): willekeurige borden, daarvan de hele toestandsruimte, en dan de toestanden
// met het gewenste kleinste aantal zetten. Gebruik: node --experimental-strip-types scripts/karvrij-maken.ts > /tmp/puzzels.json
import { bordTekst, buren, isKlaar, type Bord, type Kar } from '../src/lib/spelletjes/karvrij.ts'

let zaad = Number(process.env.SEED ?? 12345)
const rnd = () => { zaad = (zaad * 1664525 + 1013904223) % 4294967296; return zaad / 4294967296 }
const geheel = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))

interface Cfg { rijen: number; kol: number; aantal: number; lang: number; blokken: number; lo: number; hi: number; aantalPuzzels: number }

function willekeurigBord(c: Cfg): Bord {
  const poortRij = Math.floor((c.rijen - 1) / 2)
  const blok = new Array<boolean>(c.rijen * c.kol).fill(false)
  const bezet = new Array<boolean>(c.rijen * c.kol).fill(false)
  const karren: Kar[] = []
  const plaats = (len: number, hor: boolean, r: number, col: number): boolean => {
    for (let i = 0; i < len; i++) { const rr = r + (hor ? 0 : i), cc = col + (hor ? i : 0); if (rr >= c.rijen || cc >= c.kol || bezet[rr * c.kol + cc]) return false }
    for (let i = 0; i < len; i++) bezet[(r + (hor ? 0 : i)) * c.kol + col + (hor ? i : 0)] = true
    return true
  }
  const roodC = geheel(0, c.kol - 3)
  plaats(2, true, poortRij, roodC)
  karren.push({ id: 0, r: poortRij, c: roodC, len: 2, hor: true })
  let blokken = 0
  for (let p = 0; p < 200 && blokken < c.blokken; p++) {
    const r = geheel(0, c.rijen - 1), col = geheel(0, c.kol - 1)
    if (r === poortRij || bezet[r * c.kol + col]) continue
    bezet[r * c.kol + col] = true; blok[r * c.kol + col] = true; blokken++
  }
  let langOver = c.lang
  for (let p = 0; p < 600 && karren.length < c.aantal; p++) {
    const len = langOver > 0 ? 3 : 2, hor = rnd() < 0.5
    const r = geheel(0, c.rijen - 1), col = geheel(0, c.kol - 1)
    if (hor && r === poortRij) continue
    if (plaats(len, hor, r, col)) { karren.push({ id: karren.length, r, c: col, len, hor }); if (len === 3) langOver-- }
  }
  return { rijen: c.rijen, kol: c.kol, karren, blok, poortRij }
}

const naarBord = (b: Bord, pos: number[]): Bord => ({ ...b, karren: b.karren.map((k, i) => (k.hor ? { ...k, c: pos[i] } : { ...k, r: pos[i] })) })
const sl = (pos: number[]) => { let s = 0; for (const p of pos) s = s * 8 + p; return s }

/** Alle toestanden van de samenhang, met hun kleinste aantal zetten tot klaar. */
function afstanden(b: Bord, grens: number): Map<number, { pos: number[]; d: number }> | null {
  const alle = new Map<number, { pos: number[]; d: number }>()
  const begin = b.karren.map((k) => (k.hor ? k.c : k.r))
  const lijst: number[][] = [begin]
  alle.set(sl(begin), { pos: begin, d: -1 })
  const buur = new Map<number, number[]>()
  for (let i = 0; i < lijst.length; i++) {
    const pos = lijst[i]
    const nb = naarBord(b, pos)
    const ids: number[] = []
    for (const { pos: p } of buren(nb)) {
      const s = sl(p); ids.push(s)
      if (!alle.has(s)) { alle.set(s, { pos: p, d: -1 }); lijst.push(p); if (lijst.length > grens) return null }
    }
    buur.set(sl(pos), ids)
  }
  let rij: number[] = []
  for (const [s, v] of alle) if (isKlaar(naarBord(b, v.pos))) { v.d = 0; rij.push(s) }
  while (rij.length) {
    const volgend: number[] = []
    for (const s of rij) for (const t of buur.get(s)!) { const v = alle.get(t)!; if (v.d < 0) { v.d = alle.get(s)!.d + 1; volgend.push(t) } }
    rij = volgend
  }
  return alle
}

const EINDE = Date.now() + Number(process.env.MAX_SEC ?? 600) * 1000

function maak(c: Cfg): { bord: string[]; min: number }[] {
  const uit: { bord: string[]; min: number }[] = []
  const gezien = new Set<string>()
  for (let poging = 0; poging < 4000 && uit.length < c.aantalPuzzels && Date.now() < EINDE; poging++) {
    const b = willekeurigBord(c)
    if (b.karren.length < c.aantal) continue
    const al = afstanden(b, Number(process.env.CAP ?? 250000))
    if (!al) continue
    const kandidaten = [...al.values()].filter((v) => v.d >= c.lo && v.d <= c.hi)
    if (!kandidaten.length) continue
    // Liefst de moeilijkste binnen het bereik.
    const hoogste = Math.max(...kandidaten.map((v) => v.d))
    const top = kandidaten.filter((v) => v.d === hoogste)
    const keuze = top[Math.floor(rnd() * top.length)]
    const tekst = bordTekst(naarBord(b, keuze.pos))
    const k = tekst.join('/')
    if (gezien.has(k)) continue
    gezien.add(k)
    uit.push({ bord: tekst, min: keuze.d })
  }
  return uit
}

const configs: Record<string, Cfg[]> = JSON.parse(process.argv[2] ?? '{}')
const uit: Record<string, { bord: string[]; min: number }[][]> = {}
for (const [niveau, rondes] of Object.entries(configs)) uit[niveau] = rondes.map((c) => maak(c))
console.log(JSON.stringify(uit))
