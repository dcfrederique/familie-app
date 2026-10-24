// Prent bij een bladzijde: een decor plus figuren uit verhaalFiguren.tsx, beschreven als data in het verhaal.
// Figuur-notatie: naam[:mod…][*aantal][@x,y] met x en y in procent van de prent (y = waar de voeten staan).
import type { ReactNode } from 'react'
import { figuren } from './verhaalFiguren.tsx'

export interface PrentData { decor: string; figuren: string[] }

const B = 400, H = 250

const lucht = {
  dag: ['#BFE3F5', '#E3F3FB'], ochtend: ['#F9D9B4', '#FCEBD7'], avond: ['#7B6FB0', '#F6B48A'], nacht: ['#1E2D55', '#2E3F70'],
  storm: ['#3E4A5C', '#5E6B7D'], grijs: ['#A9AEB4', '#C9CDD2'], ruimte: ['#0F1630', '#1B2550'],
}
const grond = {
  gras: '#6CC070', donkergras: '#3F7A4E', zand: '#E8D3A3', sneeuw: '#F4F7FB', straat: '#9AA3AD', hout: '#C99A6B',
  tegels: '#DDE6EC', water: '#4F9FD6', maan: '#C9CCD3', steen: '#B59A7A', jungle: '#3E8E4A', grijsgras: '#9AA19C', donker: '#2B3440',
}

interface Decor {
  lucht?: keyof typeof lucht
  /** Binnen: effen muur in plaats van lucht. */
  muur?: string
  grond: keyof typeof grond
  horizon?: number
  achter?: ReactNode
  /** Op de grond, vóór de figuren (water). */
  voor?: ReactNode
}

const Heuvels = ({ kleur = '#5AAE62', y = 170 }: { kleur?: string; y?: number }) => (
  <path d={`M0 ${y}q60 -50 130 -10t140 -20t130 10v30h-400z`} fill={kleur} />
)
const Bomenrij = ({ kleur = '#3E8E4A', y = 177, sneeuw = false }: { kleur?: string; y?: number; sneeuw?: boolean }) => (
  <g>{[20, 70, 120, 170, 230, 280, 330, 380].map((x, i) => (
    <g key={x}><rect x={x - 3} y={y - 16} width={6} height={16} fill="#6B4A2A" />
      <path d={`M${x - 22} ${y - 12}l22 -${50 + (i % 3) * 10} 22 ${50 + (i % 3) * 10}z`} fill={kleur} />
      {sneeuw && <path d={`M${x - 8} ${y - 46 - (i % 3) * 6}l8 -${16 + (i % 3) * 4} 8 ${16 + (i % 3) * 4}z`} fill="#fff" />}</g>
  ))}</g>
)
const Bergen = ({ sneeuw = true }) => (
  <g><path d="M0 170l70 -110 60 80 70 -100 80 110 50 -50 70 70z" fill="#8A96A3" />
    {sneeuw && <path d="M58 79l12 -19 14 19zM188 59l12 -19 14 19zM320 128l10 -8 10 8z" fill="#fff" />}</g>
)
const Skyline = ({ kleur = '#7C8A99' }) => (
  <g fill={kleur}>{[[0, 70, 60], [50, 40, 100], [95, 60, 80], [150, 34, 120], [190, 70, 70], [255, 44, 110], [300, 60, 85], [355, 45, 95]].map(([x, w, h]) => (
    <g key={x}><rect x={x} y={175 - h} width={w} height={h} />
      {Array.from({ length: Math.floor(h / 22) }, (_, r) => <rect key={r} x={x + 8} y={185 - h + r * 22} width={w - 16} height={6} fill="#FFE9A8" opacity={0.5} />)}</g>
  ))}</g>
)
const Raam = ({ x, nacht = false }: { x: number; nacht?: boolean }) => (
  <g><rect x={x} y={40} width={70} height={60} fill={nacht ? '#2E3F70' : '#BFE3F5'} stroke="#fff" strokeWidth={5} /><path d={`M${x + 35} 40v60M${x} 70h70`} stroke="#fff" strokeWidth={4} /></g>
)
const Zee = ({ y = 160, kleur = '#4F9FD6' }) => (
  <g><rect x={0} y={y} width={B} height={H - y} fill={kleur} />
    <path d={`M0 ${y + 12}q20 -8 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0`} stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} /></g>
)
const Slingers = () => (
  <g>{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${i * 50} 20l12 18 12 -18`} fill={['#E53935', '#F7C531', '#3FA34D', '#3D7DD8'][i % 4]} />)}<path d="M0 20q200 20 400 0" stroke="#9AA0A6" fill="none" /></g>
)

// Kleine details die elke buitenprent rijker maken (stijl van 24 oktober 2026, docs/prenten.md).
const Wolk = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={0.95}>
    <ellipse cx={0} cy={0} rx={23} ry={11} /><ellipse cx={-15} cy={4} rx={15} ry={8} /><ellipse cx={17} cy={4} rx={17} ry={8} /><ellipse cx={3} cy={-7} rx={14} ry={10} />
  </g>
)
const Pol = ({ x, y, kleur }: { x: number; y: number; kleur: string }) => (
  <path d={`M${x - 5} ${y}q2 -7 5 -8q-1 4 1 8q2 -6 6 -6q-3 3 -2 6z`} fill={kleur} />
)
const Bloempje = ({ x, y, kleur }: { x: number; y: number; kleur: string }) => (
  <g><path d={`M${x} ${y}v-8`} stroke="#3F8F4A" strokeWidth={1.5} />
    {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + Math.cos(a * Math.PI / 180) * 3} cy={y - 10 + Math.sin(a * Math.PI / 180) * 3} r={2.5} fill={kleur} />)}
    <circle cx={x} cy={y - 10} r={2} fill="#F2B33D" /></g>
)
const grasKleur: Partial<Record<keyof typeof grond, string>> = { gras: '#4FA75A', donkergras: '#2F5E3E', jungle: '#2E7A3A' }

const decors: Record<string, Decor> = {
  nacht: { lucht: 'nacht', grond: 'donkergras', horizon: 175, achter: <Heuvels kleur="#2E5E3E" /> },
  'nacht-feest': { lucht: 'nacht', grond: 'donkergras', horizon: 175, achter: <><Heuvels kleur="#2E5E3E" /><Slingers /></> },
  weide: { lucht: 'dag', grond: 'gras', achter: <Heuvels /> },
  'weide-ochtend': { lucht: 'ochtend', grond: 'gras', achter: <Heuvels /> },
  grijs: { lucht: 'grijs', grond: 'grijsgras', achter: <Heuvels kleur="#8A918C" /> },
  lucht: { lucht: 'dag', grond: 'gras', horizon: 225 },
  tuin: { lucht: 'dag', grond: 'gras', achter: <path d="M0 150h400v30h-400z M10 140v40M40 140v40M70 140v40M100 140v40M130 140v40M160 140v40M190 140v40M220 140v40M250 140v40M280 140v40M310 140v40M340 140v40M370 140v40" stroke="#E6D3B3" strokeWidth={6} fill="none" /> },
  park: { lucht: 'dag', grond: 'gras', achter: <Bomenrij kleur="#4FA35B" /> },
  bos: { lucht: 'dag', grond: 'gras', achter: <Bomenrij /> },
  'bos-avond': { lucht: 'avond', grond: 'donkergras', achter: <Bomenrij kleur="#2E5E3E" /> },
  sneeuwbos: { lucht: 'grijs', grond: 'sneeuw', achter: <Bomenrij kleur="#2E5E3E" sneeuw /> },
  jungle: { lucht: 'dag', grond: 'jungle', achter: <><Bomenrij kleur="#2E7A3A" /><path d="M0 60q40 20 30 60M380 50q-40 30 -20 70M120 0q10 40 -10 70" stroke="#3E8E4A" strokeWidth={6} fill="none" /></> },
  rivier: { lucht: 'dag', grond: 'jungle', achter: <Bomenrij kleur="#2E7A3A" />, voor: <path d="M0 190q100 -14 200 0t200 0v14q-100 -14 -200 0t-200 0z" fill="#5DB7E8" /> },
  finish: { lucht: 'dag', grond: 'jungle', achter: <><Bomenrij kleur="#2E7A3A" /><rect x={40} y={60} width={6} height={120} fill="#8B5E3C" /><rect x={354} y={60} width={6} height={120} fill="#8B5E3C" /><rect x={46} y={60} width={308} height={22} fill="#fff" /><path d="M46 60h22v11h-22zM90 60h22v11h-22zM134 60h22v11h-22zM178 60h22v11h-22zM222 60h22v11h-22zM266 60h22v11h-22zM310 60h22v11h-22zM68 71h22v11h-22zM112 71h22v11h-22zM156 71h22v11h-22zM200 71h22v11h-22zM244 71h22v11h-22zM288 71h22v11h-22zM332 71h22v11h-22z" fill={'#26303A'} /></> },
  dal: { lucht: 'dag', grond: 'gras', achter: <><Bergen sneeuw={false} /><Heuvels /></> },
  'dal-storm': { lucht: 'storm', grond: 'donkergras', achter: <><Bergen sneeuw={false} /><path d="M250 20l-20 50h18l-14 40 40 -56h-20l14 -34z" fill="#FFE9A8" /></> },
  bergen: { lucht: 'dag', grond: 'gras', achter: <Bergen /> },
  vijver: { lucht: 'dag', grond: 'gras', achter: <Heuvels />, voor: <ellipse cx={200} cy={222} rx={190} ry={24} fill="#5DB7E8" /> },
  zee: { lucht: 'dag', grond: 'sneeuw', horizon: 205, achter: <Zee y={150} /> },
  kust: { lucht: 'avond', grond: 'steen', horizon: 200, achter: <Zee y={150} kleur="#3E7FB8" /> },
  storm: { lucht: 'storm', grond: 'steen', horizon: 205, achter: <><Zee y={140} kleur="#2E5E8A" /><path d="M60 20l-14 40h14l-10 30 30 -44h-16l10 -26z" fill="#FFE9A8" /></> },
  'storm-donker': { lucht: 'nacht', grond: 'donker', horizon: 205, achter: <Zee y={140} kleur="#1E3A5C" /> },
  stad: { lucht: 'dag', grond: 'straat', horizon: 180, achter: <Skyline /> },
  'storm-stad': { lucht: 'storm', grond: 'water', horizon: 180, achter: <><Skyline kleur="#5E6B7D" /><g stroke="#BFE3F5" strokeWidth={2}>{Array.from({ length: 20 }, (_, i) => <path key={i} d={`M${(i * 41) % 400} ${(i * 29) % 150}l-6 14`} />)}</g></> },
  straat: { lucht: 'dag', grond: 'straat', horizon: 185, achter: <><g transform="translate(70 185)"><HuisAchter /></g><g transform="translate(330 185)"><HuisAchter kleur="#F4E1C1" /></g><path d="M0 185h400" stroke="#E0E3E7" strokeWidth={4} /></> },
  dorp: { lucht: 'dag', grond: 'gras', achter: <>{[50, 140, 260, 350].map((x, i) => <g key={x} transform={`translate(${x} 175) scale(0.7)`}><HuisAchter kleur={['#F2C57C', '#F4E1C1', '#E6EEF2', '#F2C57C'][i]} /></g>)}</> },
  boerderij: { lucht: 'avond', grond: 'gras', achter: <><Heuvels /><path d="M290 175v-60l40 -30 40 30v60z" fill="#C0392B" /><path d="M315 175v-34h30v34z" fill="#8B2A20" /></> },
  'boerderij-avond': { lucht: 'avond', grond: 'donkergras', achter: <><Heuvels kleur="#3F7A4E" /><path d="M290 175v-60l40 -30 40 30v60z" fill="#8B2A20" /></> },
  vulkaan: { lucht: 'avond', grond: 'steen', achter: <Heuvels kleur="#8A7060" /> },
  meer: { lucht: 'dag', grond: 'gras', achter: <Bomenrij />, voor: <ellipse cx={250} cy={200} rx={150} ry={18} fill="#5DB7E8" /> },
  'open-zee': { lucht: 'dag', grond: 'water', horizon: 160, voor: <path d="M0 175q20 -8 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} /> },
  maan: { lucht: 'ruimte', grond: 'maan', achter: <g fill="#B0B4BC"><ellipse cx={80} cy={200} rx={30} ry={6} /><ellipse cx={300} cy={215} rx={40} ry={8} /><circle cx={340} cy={50} r={26} fill="#3D7DD8" /></g> },
  ruimte: { lucht: 'ruimte', grond: 'donker', horizon: 260 },
  groeve: { lucht: 'dag', grond: 'zand', achter: <path d="M0 175l40 -60h80l30 40h90l40 -50h80l40 70z" fill="#D9BE8A" /> },
  // binnen
  kamer: { muur: '#F4E6D4', grond: 'hout', horizon: 180, achter: <Raam x={260} /> },
  huis: { muur: '#E6EEF2', grond: 'hout', horizon: 180, achter: <><Raam x={60} nacht /><rect x={250} y={110} width={90} height={70} rx={6} fill="#5B8DEF" /></> },
  keuken: { muur: '#FCEBD7', grond: 'tegels', horizon: 180, achter: <><rect x={0} y={120} width={400} height={60} fill="#C99A6B" /><rect x={0} y={112} width={400} height={10} fill="#E6D3B3" /><Raam x={160} /></> },
  badkamer: { muur: '#DDF0F5', grond: 'tegels', horizon: 185, achter: <><rect x={250} y={40} width={70} height={60} rx={6} fill="#BFE3F5" stroke="#fff" strokeWidth={5} /><path d="M40 150h130v30h-130z" fill="#fff" /><rect x={262} y={120} width={46} height={60} fill="#fff" /></> },
  klas: { muur: '#F2F0E6', grond: 'hout', horizon: 180, achter: <><rect x={110} y={40} width={180} height={90} fill="#2F5D50" stroke="#B07A45" strokeWidth={6} /><text x={130} y={80} fill="#fff" fontSize={18} fontFamily="sans-serif">1 + 1 = 2</text><text x={130} y={110} fill="#fff" fontSize={18} fontFamily="sans-serif">a b c</text></> },
  speelplaats: { lucht: 'dag', grond: 'straat', horizon: 185, achter: <><rect x={0} y={110} width={400} height={75} fill="#D98B6A" /><path d="M0 110h400" stroke="#B5674A" strokeWidth={4} /><path d="M60 230l20 -20M300 240h40" stroke="#fff" strokeWidth={3} /></> },
  bakkerij: { muur: '#F6E0C8', grond: 'tegels', horizon: 185, achter: <><rect x={0} y={90} width={400} height={8} fill="#B07A45" /><g fill="#D9A066">{[30, 70, 110, 290, 330, 370].map((x) => <ellipse key={x} cx={x} cy={84} rx={16} ry={8} />)}</g></> },
  garage: { muur: '#C9CDD2', grond: 'straat', horizon: 185, achter: <><path d="M0 60h400" stroke="#9AA0A6" strokeWidth={6} /><g fill="#7C8A99">{[40, 80, 120].map((x) => <rect key={x} x={x} y={100} width={8} height={30} />)}</g><rect x={300} y={90} width={70} height={50} fill="#9AA0A6" /></> },
  museum: { muur: '#EFE9DF', grond: 'tegels', horizon: 190, achter: <><rect x={30} y={60} width={80} height={60} fill="#D9C2A0" stroke="#B59A72" strokeWidth={4} /><rect x={290} y={60} width={80} height={60} fill="#D9C2A0" stroke="#B59A72" strokeWidth={4} /></> },
  'binnen-toren': { muur: '#9C8F84', grond: 'donker', horizon: 190, achter: <g stroke="#857970" strokeWidth={2}>{[40, 80, 120, 160].map((y) => <path key={y} d={`M0 ${y}h400`} />)}<rect x={300} y={60} width={50} height={60} fill="#2B3440" /></g> },
  feest: { muur: '#3D2F5C', grond: 'hout', horizon: 185, achter: <><Slingers /><g>{[60, 200, 340].map((x, i) => <circle key={x} cx={x} cy={70} r={30} fill={['#F28DB2', '#F7C531', '#5DB7E8'][i]} opacity={0.35} />)}</g></> },
}

function HuisAchter({ kleur = '#F2C57C' }: { kleur?: string }) {
  return <g><rect x={-45} y={-80} width={90} height={80} fill={kleur} /><path d="M-55 -78l55 -40 55 40z" fill="#C0502B" /><rect x={-30} y={-62} width={20} height={18} fill="#BFE3F5" /><rect x={10} y={-62} width={20} height={18} fill="#BFE3F5" /><rect x={-10} y={-34} width={20} height={34} fill="#8B5E3C" /></g>
}

const ZWEMMERS = new Set(['zwemt'])
const luchtPlekken: [number, number][] = [[330, 60], [80, 60], [200, 50], [270, 80]]

interface Geplaatst { naam: string; mods: string[]; x: number; y: number; schaal: number; spiegel: boolean }

/** Zet de figuren-notatie om in posities op de prent. */
export function plaatsFiguren(lijst: string[], horizon: number): Geplaatst[] {
  const items = lijst.flatMap((s) => {
    const [kop, plek] = s.split('@')
    const [naamDeel, aantal] = kop.split('*')
    const [naam, ...mods] = naamDeel.split(':')
    const pos = plek?.split(',').map(Number) as [number, number] | undefined
    return Array.from({ length: Number(aantal) || 1 }, () => ({ naam, mods, pos }))
  }).filter((i) => figuren[i.naam])
  const grondItems = items.filter((i) => !figuren[i.naam].lucht && !figuren[i.naam].vol && !i.pos)
  let lucht = 0
  const basis = Math.min(H - 14, Math.max(horizon + 40, 222))
  return items.map((it) => {
    const f = figuren[it.naam]
    const schaal = (it.mods.includes('klein') ? 0.65 : it.mods.includes('groot') ? 1.4 : 1) * (f.lucht ? 1 : 1.15)
    if (f.vol) return { ...it, x: 0, y: 0, schaal: 1, spiegel: false }
    if (it.pos) return { ...it, x: it.pos[0] / 100 * B, y: it.pos[1] / 100 * H, schaal, spiegel: it.mods.includes('spiegel') }
    if (f.lucht) { const [x, y] = luchtPlekken[lucht++ % luchtPlekken.length]; return { ...it, x, y: y + f.h / 2, schaal, spiegel: false } }
    const i = grondItems.indexOf(it), n = grondItems.length
    const rand = n > 3 ? 55 : 95
    const x = n === 1 ? B / 2 : rand + (i * (B - 2 * rand)) / (n - 1)
    // Figuren rechts van het midden kijken naar links, zodat ze naar elkaar kijken.
    const spiegel = (n > 1 && x > B / 2 + 1) !== it.mods.includes('spiegel')
    return { ...it, x, y: basis - (i % 2) * 4, schaal, spiegel }
  })
}

export function VerhaalPrent({ prent, label }: { prent: PrentData; label?: string }) {
  return (
    <svg viewBox={`0 0 ${B} ${H}`} className="verhaal-prent" role="img" aria-label={label ?? 'Prent'} preserveAspectRatio="xMidYMid slice">
      <PrentTekening prent={prent} />
    </svg>
  )
}

/** Alleen de tekening (400 × 250), om in een andere SVG te gebruiken, zoals bij de puzzels. */
export function PrentTekening({ prent, idVoorvoegsel = 'l' }: { prent: PrentData; idVoorvoegsel?: string }) {
  const d = decors[prent.decor] ?? decors.weide
  const horizon = d.horizon ?? 175
  const geplaatst = plaatsFiguren(prent.figuren, horizon)
  // Grote figuren eerst, zodat kleine ervoor staan.
  const volgorde = [...geplaatst].sort((a, b) => (figuren[b.naam].vol ? 1 : 0) - (figuren[a.naam].vol ? 1 : 0) || figuren[b.naam].h * b.schaal - figuren[a.naam].h * a.schaal)
  const [boven, onder] = d.lucht ? lucht[d.lucht] : [d.muur!, d.muur!]
  const id = `${idVoorvoegsel}-${prent.decor}`
  return (
    <>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={boven} /><stop offset="1" stopColor={onder} /></linearGradient></defs>
      <rect width={B} height={H} fill={`url(#${id})`} />
      {d.achter}
      {/* Geen extra wolken als een wolk zelf meespeelt (Het kleine wolkje). */}
      {d.lucht === 'dag' && horizon > 120 && !prent.figuren.some((f) => f.startsWith('wolk')) && <><Wolk x={64} y={40} s={0.8} /><Wolk x={318} y={28} s={0.65} /></>}
      <rect x={0} y={horizon} width={B} height={H - horizon} fill={grond[d.grond]} />
      {grasKleur[d.grond] && H - horizon > 30 && <>
        {[[24, 244], [150, 240], [262, 246], [380, 238]].map(([x, y]) => <Pol key={x} x={x} y={y} kleur={grasKleur[d.grond]!} />)}
        {d.grond === 'gras' && <><Bloempje x={44} y={246} kleur="#F28B9B" /><Bloempje x={356} y={244} kleur="#F2B33D" /></>}
      </>}
      {d.voor}
      {volgorde.map((g, i) => {
        const f = figuren[g.naam]
        if (f.vol) return <g key={i}>{f.teken(g.mods)}</g>
        const zwemt = g.mods.some((m) => ZWEMMERS.has(m))
        return (
          <g key={i} transform={`translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) scale(${g.spiegel ? -g.schaal : g.schaal} ${g.schaal})`}>
            {f.teken(g.mods)}
            {zwemt && <path d="M-60 -14q15 -6 30 0t30 0t30 0t30 0v30h-120z" fill="#4F9FD6" />}
          </g>
        )
      })}
    </>
  )
}
