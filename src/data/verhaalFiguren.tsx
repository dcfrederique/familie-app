// Figuren voor de prenten bij de verhalen: eigen ontwerp, vlakke vormen, effen kleuren.
// Elke figuur tekent rond (0, 0) = midden onderaan en kijkt naar rechts; de prent schaalt en plaatst ze.
// Dirk, Mo en Pip hebben één vaste tekening die in elk verhaal terugkomt.
import type { ReactNode } from 'react'

export interface Figuur {
  /** Natuurlijke hoogte in eenheden van de prent (400 × 250). */
  h: number
  /** Hangt in de lucht in plaats van op de grond. */
  lucht?: boolean
  /** Tekent over de hele prent en negeert de plaatsing. */
  vol?: boolean
  teken: (mods: string[]) => ReactNode
}

const INKT = '#26303A'

function Oog({ x, y, dicht = false, r = 3 }: { x: number; y: number; dicht?: boolean; r?: number }) {
  return dicht
    ? <path d={`M${x - r} ${y}q${r} ${r} ${r * 2} 0`} stroke={INKT} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    : <><circle cx={x} cy={y} r={r} fill={INKT} /><circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" /></>
}

const Zz = ({ x, y }: { x: number; y: number }) => (
  <g fill={INKT} fontFamily="sans-serif" fontWeight={700}>
    <text x={x} y={y} fontSize={12}>z</text><text x={x + 10} y={y - 12} fontSize={16}>z</text>
  </g>
)

const Lach = ({ x, y, b = 8 }: { x: number; y: number; b?: number }) => (
  <path d={`M${x - b / 2} ${y}q${b / 2} ${b / 2} ${b} 0`} stroke={INKT} strokeWidth={1.8} fill="none" strokeLinecap="round" />
)

// ---------- mensen ----------
interface Mens {
  volwassen?: boolean; huid: string; haar: string; kapsel: 'kort' | 'lang' | 'staart' | 'kaal'
  shirt: string; onder: string; rok?: boolean; extra?: ('bril' | 'heksenhoed' | 'koksmuts' | 'pet' | 'muts' | 'baard' | 'jas')[]
}

function mens(m: Mens): Figuur {
  const s = m.volwassen ? 1.3 : 1
  return {
    h: 95 * s,
    teken: (mods) => {
      const dicht = mods.includes('slaapt')
      const x = m.extra ?? []
      return (
        <g transform={`scale(${s})`}>
          {m.kapsel === 'lang' && <path d="M-15 -78q15 -12 30 0v34h-30z" fill={m.haar} />}
          {/* benen en lijf */}
          <rect x={-10} y={-32} width={8} height={32} rx={3} fill={m.rok ? m.huid : m.onder} />
          <rect x={2} y={-32} width={8} height={32} rx={3} fill={m.rok ? m.huid : m.onder} />
          <ellipse cx={-6} cy={-1} rx={7} ry={3} fill={INKT} /><ellipse cx={7} cy={-1} rx={7} ry={3} fill={INKT} />
          {m.rok
            ? <path d="M-13 -60h26l7 32h-40z" fill={m.shirt} />
            : <><rect x={-13} y={-60} width={26} height={30} rx={8} fill={m.shirt} /><rect x={-11} y={-36} width={22} height={8} fill={m.onder} /></>}
          {x.includes('jas') && <path d="M-15 -60h30l3 34h-36z" fill="#F4F6F8" opacity={0.95} />}
          <rect x={-20} y={-58} width={7} height={24} rx={3.5} fill={x.includes('jas') ? '#F4F6F8' : m.shirt} />
          <rect x={13} y={-58} width={7} height={24} rx={3.5} fill={x.includes('jas') ? '#F4F6F8' : m.shirt} />
          <circle cx={-16.5} cy={-33} r={4} fill={m.huid} /><circle cx={16.5} cy={-33} r={4} fill={m.huid} />
          {/* hoofd */}
          <circle cx={0} cy={-74} r={14} fill={m.huid} />
          {m.kapsel !== 'kaal' && <path d="M-14 -76q2 -16 14 -16t14 16q-8 -6 -14 -6t-14 6z" fill={m.haar} />}
          {m.kapsel === 'kaal' && <path d="M-14 -72q0 -8 4 -10M14 -72q0 -8 -4 -10" stroke={m.haar} strokeWidth={4} fill="none" />}
          {m.kapsel === 'staart' && <path d="M12 -82q14 2 10 20q-4 -10 -12 -12z" fill={m.haar} />}
          <Oog x={-5} y={-75} dicht={dicht} r={2.2} /><Oog x={6} y={-75} dicht={dicht} r={2.2} />
          <circle cx={-9} cy={-69} r={2.5} fill="#F28B82" opacity={0.5} /><circle cx={10} cy={-69} r={2.5} fill="#F28B82" opacity={0.5} />
          <Lach x={0.5} y={-68} b={6} />
          {x.includes('bril') && <g stroke={INKT} strokeWidth={1.3} fill="none"><circle cx={-5} cy={-75} r={4} /><circle cx={6} cy={-75} r={4} /><path d="M-1 -75h3" /></g>}
          {x.includes('baard') && <path d="M-12 -70q12 18 24 0q-2 10 -12 12q-10 -2 -12 -12z" fill={m.haar} />}
          {x.includes('heksenhoed') && <><ellipse cx={0} cy={-86} rx={22} ry={4} fill="#5B3F8C" /><path d="M-12 -87l14 -34 10 34z" fill="#6E4FA8" /><circle cx={3} cy={-104} r={2.5} fill="#FFD84D" /></>}
          {x.includes('koksmuts') && <><rect x={-11} y={-94} width={22} height={8} fill="#fff" /><circle cx={-6} cy={-99} r={8} fill="#fff" /><circle cx={6} cy={-99} r={8} fill="#fff" /><circle cx={0} cy={-104} r={8} fill="#fff" /></>}
          {x.includes('pet') && <path d="M-14 -82q14 -16 28 0zM10 -84h12v3h-12z" fill="#2F6FB5" />}
          {x.includes('muts') && <><path d="M-14 -80q14 -22 28 0z" fill="#3FA34D" /><circle cx={0} cy={-96} r={4} fill="#3FA34D" /></>}
          {dicht && <Zz x={14} y={-90} />}
        </g>
      )
    },
  }
}

// ---------- dieren ----------
// Dirk, Mo en Pip in de rijkere stijl (goedgekeurd 24 oktober 2026, docs/prenten.md): vlak, twee à drie tinten
// per kleur, wangetjes en glans in de ogen. Getekend op een groter raster en geschaald naar h.
const Wang = ({ x, y, r = 6 }: { x: number; y: number; r?: number }) => (
  <ellipse cx={x} cy={y} rx={r} ry={r * 0.65} fill="#F28B9B" opacity={0.55} />
)
const GrootOog = ({ x, y, r, dicht }: { x: number; y: number; r: number; dicht: boolean }) => dicht
  ? <path d={`M${x - r} ${y}q${r} ${r * 1.1} ${r * 2} 0`} stroke={INKT} strokeWidth={r * 0.5} fill="none" strokeLinecap="round" />
  : <><ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={INKT} /><circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.38} fill="#fff" /></>

const dirk: Figuur = {
  h: 105,
  teken: (mods) => {
    const dicht = mods.includes('slaapt')
    return (
      <g transform="scale(0.57)">
        <path d="M-56 -30q-38 4 -54 -26q16 8 22 -2q-2 18 32 20z" fill="#2E8A3C" />
        <path d="M-110 -56l-14 -6 6 14z" fill="#F2B33D" />
        <path d="M-18 -112q-40 -60 -78 -46q22 12 12 30q-22 -6 -28 10q26 6 30 30z" fill="#2E8A3C" />
        <path d="M-30 -112q-30 -36 -54 -34q12 10 6 22z" fill="#58B868" />
        <ellipse cx={0} cy={-58} rx={64} ry={54} fill="#3FA34D" />
        <ellipse cx={14} cy={-48} rx={38} ry={38} fill="#B5DE7A" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${-10 + i * 2} ${-76 + i * 16}q24 6 48 0`} stroke="#9BCB62" strokeWidth={3} fill="none" strokeLinecap="round" />)}
        <path d="M-34 -108l10 -18 10 18zM-6 -114l10 -18 10 18zM22 -110l10 -16 8 18z" fill="#2E8A3C" />
        <rect x={-40} y={-14} width={26} height={22} rx={10} fill="#2E8A3C" /><rect x={18} y={-14} width={26} height={22} rx={10} fill="#2E8A3C" />
        <path d="M-36 8h4M-28 8h4M22 8h4M30 8h4" stroke="#FFE9A8" strokeWidth={3} strokeLinecap="round" />
        <path d="M30 -62q22 -4 30 10" stroke="#3FA34D" strokeWidth={14} fill="none" strokeLinecap="round" />
        <circle cx={54} cy={-126} r={40} fill="#3FA34D" />
        <ellipse cx={86} cy={-112} rx={28} ry={21} fill="#3FA34D" />
        <ellipse cx={90} cy={-106} rx={20} ry={12} fill="#58B868" />
        <circle cx={100} cy={-116} r={2.6} fill={INKT} /><circle cx={108} cy={-112} r={2.6} fill={INKT} />
        <path d="M34 -160l4 -22 12 18zM62 -164l12 -18 2 22z" fill="#FFE9A8" />
        <GrootOog x={62} y={-134} r={6.5} dicht={dicht} />
        <Wang x={78} y={-110} r={8} />
        <path d="M74 -98q12 8 26 -2" stroke={INKT} strokeWidth={3} fill="none" strokeLinecap="round" />
        {dicht && <g transform="scale(1.75)"><Zz x={56} y={-96} /></g>}
        {mods.includes('vuur') && <path d="M114 -116q30 -18 52 -4q-18 0 -14 10q18 0 24 14q-24 -6 -38 4q-10 -16 -24 -24z" fill="#F2994A" />}
        {mods.includes('vuur') && <path d="M118 -114q16 -8 28 -2q-8 2 -6 8q-10 -2 -22 -6z" fill="#F7D774" />}
        {mods.includes('spuit') && <path d="M114 -116q52 -10 104 34" stroke="#5DB7E8" strokeWidth={12} fill="none" strokeLinecap="round" />}
      </g>
    )
  },
}

const mo: Figuur = {
  h: 42,
  teken: (mods) => (
    <g transform="scale(0.44)">
      <path d="M-30 -14q-36 4 -44 -28q-4 -18 10 -22" stroke="#F2A7B6" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-28} rx={32} ry={26} fill="#9AA0A6" />
      <ellipse cx={8} cy={-22} rx={18} ry={16} fill="#C4C8CC" />
      <ellipse cx={-16} cy={-2} rx={10} ry={5} fill="#F2A7B6" /><ellipse cx={14} cy={-2} rx={10} ry={5} fill="#F2A7B6" />
      <circle cx={26} cy={-56} r={21} fill="#9AA0A6" />
      <circle cx={12} cy={-80} r={15} fill="#9AA0A6" /><circle cx={12} cy={-80} r={10} fill="#F2A7B6" />
      <circle cx={40} cy={-78} r={13} fill="#9AA0A6" /><circle cx={40} cy={-78} r={8.5} fill="#F2A7B6" />
      <ellipse cx={44} cy={-50} rx={10} ry={8} fill="#C4C8CC" />
      <circle cx={53} cy={-52} r={4.5} fill="#E57373" />
      <GrootOog x={32} y={-60} r={3.6} dicht={mods.includes('slaapt')} />
      <Wang x={38} y={-46} r={5} />
      <path d="M46 -56l14 -4M46 -52l15 1" stroke="#6B7178" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  ),
}

function pinguin(h: number): Figuur {
  return {
    h,
    teken: (mods) => (
      <g transform={`scale(${(h / 55) * 0.46})`}>
        <ellipse cx={-12} cy={-2} rx={13} ry={6} fill="#F2994A" /><ellipse cx={14} cy={-2} rx={13} ry={6} fill="#F2994A" />
        <ellipse cx={0} cy={-46} rx={34} ry={44} fill="#2B3440" />
        <ellipse cx={6} cy={-40} rx={22} ry={34} fill="#F4F6F8" />
        <path d="M-30 -62q-22 18 -10 44" stroke="#2B3440" strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d="M34 -62q18 10 18 30" stroke="#2B3440" strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={4} cy={-90} r={25} fill="#2B3440" />
        <ellipse cx={10} cy={-86} rx={15} ry={13} fill="#F4F6F8" />
        <path d="M22 -86l16 4 -16 6z" fill="#F2994A" />
        <GrootOog x={12} y={-92} r={3.6} dicht={mods.includes('slaapt')} />
        <Wang x={6} y={-78} r={5} />
        {h < 60 && <path d="M-4 -114q4 -10 10 -2q4 -8 8 0" stroke="#2B3440" strokeWidth={4} fill="none" strokeLinecap="round" />}
      </g>
    ),
  }
}

function kat(kleur: string, h = 52): Figuur {
  return {
    h,
    teken: (mods) => {
      const vacht = mods.includes('groen') ? '#5DBB63' : kleur
      return (
        <g transform={`scale(${h / 52})`}>
          <path d="M-20 -14q-18 -6 -14 -30" stroke={vacht} strokeWidth={5} fill="none" strokeLinecap="round" />
          <ellipse cx={-2} cy={-16} rx={20} ry={15} fill={vacht} />
          <rect x={-16} y={-8} width={6} height={8} rx={3} fill={vacht} /><rect x={6} y={-8} width={6} height={8} rx={3} fill={vacht} />
          <circle cx={14} cy={-34} r={13} fill={vacht} />
          <path d="M4 -42l2 -12 8 8zM16 -46l8 -8 2 12z" fill={vacht} />
          <Oog x={11} y={-35} r={2} dicht={mods.includes('slaapt')} /><Oog x={20} y={-35} r={2} dicht={mods.includes('slaapt')} />
          <path d="M15 -29l2 2 2 -2" stroke={INKT} strokeWidth={1.4} fill="none" />
          <path d="M22 -29h8M22 -27l7 3" stroke={INKT} strokeWidth={0.8} />
          {mods.includes('sok') && <path d="M2 -44q12 -16 26 -2l-2 4q-10 -6 -22 2zM22 -50q8 -8 12 2l-6 4z" fill="#E53935" />}
        </g>
      )
    },
  }
}

const eend: Figuur = {
  h: 34,
  teken: () => (
    <g>
      <ellipse cx={-2} cy={-11} rx={15} ry={10} fill="#F7D046" />
      <path d="M-16 -14l-6 -6 2 10z" fill="#F7D046" />
      <circle cx={10} cy={-24} r={8} fill="#F7D046" />
      <path d="M16 -24l9 2 -9 3z" fill="#F2994A" />
      <Oog x={12} y={-26} r={1.6} />
      <path d="M-8 -12q6 5 12 0" stroke="#E0B52E" strokeWidth={2} fill="none" />
    </g>
  ),
}

function beerVorm(vacht: string, buik: string, h: number): Figuur {
  return {
    h,
    teken: (mods) => (
      <g transform={`scale(${h / 78})`}>
        <ellipse cx={0} cy={-26} rx={22} ry={26} fill={vacht} />
        <ellipse cx={0} cy={-22} rx={13} ry={16} fill={buik} />
        <ellipse cx={-11} cy={-3} rx={9} ry={5} fill={vacht} /><ellipse cx={11} cy={-3} rx={9} ry={5} fill={vacht} />
        <circle cx={-14} cy={-72} r={7} fill={vacht} /><circle cx={14} cy={-72} r={7} fill={vacht} />
        <circle cx={0} cy={-60} r={17} fill={vacht} />
        <ellipse cx={3} cy={-55} rx={8} ry={6} fill={buik} /><circle cx={3} cy={-58} r={2.5} fill={INKT} />
        <Oog x={-5} y={-64} r={2.2} dicht={mods.includes('slaapt')} /><Oog x={9} y={-64} r={2.2} dicht={mods.includes('slaapt')} />
        {mods.includes('slaapt') && <Zz x={16} y={-80} />}
      </g>
    ),
  }
}

function konijnVorm(bril: boolean): Figuur {
  return {
    h: 72,
    teken: (mods) => (
      <g>
        <ellipse cx={-6} cy={-58} rx={5} ry={16} fill="#E9E4DD" transform="rotate(-10 -6 -58)" />
        <ellipse cx={8} cy={-58} rx={5} ry={16} fill="#E9E4DD" transform="rotate(12 8 -58)" />
        <ellipse cx={-6} cy={-58} rx={2.5} ry={11} fill="#F2A7B6" transform="rotate(-10 -6 -58)" />
        <ellipse cx={8} cy={-58} rx={2.5} ry={11} fill="#F2A7B6" transform="rotate(12 8 -58)" />
        {bril
          ? <path d="M-14 -32h28l6 30h-40z" fill="#5B8DEF" />
          : <ellipse cx={0} cy={-18} rx={16} ry={18} fill="#E9E4DD" />}
        <ellipse cx={-7} cy={-2} rx={7} ry={3.5} fill="#E9E4DD" /><ellipse cx={8} cy={-2} rx={7} ry={3.5} fill="#E9E4DD" />
        <circle cx={-17} cy={-14} r={5} fill="#fff" />
        <circle cx={2} cy={-38} r={13} fill="#E9E4DD" />
        <circle cx={7} cy={-34} r={2} fill="#F2A7B6" />
        <Oog x={-2} y={-40} r={2} dicht={mods.includes('slaapt')} /><Oog x={8} y={-40} r={2} dicht={mods.includes('slaapt')} />
        {bril && <g stroke={INKT} strokeWidth={1.2} fill="none"><circle cx={-2} cy={-40} r={4} /><circle cx={8} cy={-40} r={4} /><path d="M2 -40h2" /></g>}
      </g>
    ),
  }
}

const tijs: Figuur = {
  h: 72,
  teken: (mods) => (
    <g>
      <ellipse cx={-6} cy={-28} rx={34} ry={26} fill="#9C8AB4" />
      <rect x={-34} y={-14} width={12} height={14} rx={5} fill="#8A78A3" /><rect x={8} y={-14} width={12} height={14} rx={5} fill="#8A78A3" />
      <ellipse cx={24} cy={-48} rx={22} ry={20} fill="#9C8AB4" />
      <circle cx={14} cy={-68} r={5} fill="#8A78A3" /><circle cx={28} cy={-68} r={5} fill="#8A78A3" />
      <Oog x={18} y={-56} r={2.6} /><Oog x={30} y={-56} r={2.6} />
      <ellipse cx={36} cy={-40} rx={13} ry={mods.includes('lacht') ? 11 : 8} fill="#B5A6CA" />
      {mods.includes('lacht')
        ? <><path d="M26 -40q10 12 22 0z" fill="#7A3B52" /><path d="M28 -40h4v4h-4zM34 -40h4v4h-4zM40 -40h4v4h-4z" fill="#fff" /></>
        : <><circle cx={33} cy={-44} r={1.5} fill={INKT} /><circle cx={40} cy={-44} r={1.5} fill={INKT} /></>}
    </g>
  ),
}

const hond: Figuur = {
  h: 50,
  teken: (mods) => (
    <g>
      <path d="M-20 -24q-10 -8 -8 -18" stroke="#C8945B" strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={-2} cy={-20} rx={20} ry={13} fill="#C8945B" />
      <rect x={-16} y={-12} width={7} height={12} rx={3} fill="#C8945B" /><rect x={8} y={-12} width={7} height={12} rx={3} fill="#C8945B" />
      <circle cx={16} cy={-34} r={13} fill="#C8945B" />
      <ellipse cx={8} cy={-36} rx={5} ry={10} fill="#8B5E3C" transform="rotate(20 8 -36)" />
      <ellipse cx={26} cy={-30} rx={8} ry={6} fill="#E8C9A0" />
      <circle cx={32} cy={-32} r={2.6} fill={INKT} />
      <Oog x={19} y={-38} r={2.2} dicht={mods.includes('slaapt')} />
      {mods.includes('room') && <><circle cx={26} cy={-25} r={3.5} fill="#fff" /><circle cx={31} cy={-26} r={2.5} fill="#fff" /><circle cx={22} cy={-27} r={2} fill="#E53935" /></>}
    </g>
  ),
}

function viervoeter(vacht: string, h: number, kop: (dicht: boolean) => ReactNode, vlekken?: ReactNode, staart?: string): Figuur {
  return {
    h,
    teken: (mods) => (
      <g transform={`scale(${h / 70})`}>
        {staart && <path d={staart} stroke={vacht} strokeWidth={4} fill="none" strokeLinecap="round" />}
        <rect x={-26} y={-24} width={8} height={24} rx={3} fill={vacht} /><rect x={-12} y={-24} width={8} height={24} rx={3} fill={vacht} />
        <rect x={8} y={-24} width={8} height={24} rx={3} fill={vacht} /><rect x={20} y={-24} width={8} height={24} rx={3} fill={vacht} />
        <ellipse cx={0} cy={-34} rx={32} ry={18} fill={vacht} />
        {vlekken}
        {kop(mods.includes('slaapt'))}
        {mods.includes('slaapt') && <Zz x={40} y={-70} />}
      </g>
    ),
  }
}

const koe = viervoeter('#F4F6F8', 70, (d) => (
  <g>
    <path d="M28 -66l-6 -8M46 -66l6 -8" stroke="#C9B48A" strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={37} cy={-54} rx={14} ry={15} fill="#F4F6F8" />
    <ellipse cx={40} cy={-43} rx={12} ry={8} fill="#F2A7B6" />
    <Oog x={33} y={-58} r={2.2} dicht={d} /><Oog x={43} y={-58} r={2.2} dicht={d} />
  </g>
), <><circle cx={-12} cy={-38} r={8} fill={INKT} /><circle cx={10} cy={-28} r={6} fill={INKT} /></>, 'M-30 -40q-10 10 -6 24')

const varken = viervoeter('#F5A9B8', 52, (d) => (
  <g>
    <circle cx={34} cy={-44} r={14} fill="#F5A9B8" />
    <path d="M26 -56l-2 -10 8 6zM38 -58l6 -8 0 10z" fill="#E88CA0" />
    <ellipse cx={44} cy={-40} rx={7} ry={5} fill="#E88CA0" />
    <circle cx={42} cy={-40} r={1.2} fill={INKT} /><circle cx={46} cy={-40} r={1.2} fill={INKT} />
    <Oog x={33} y={-48} r={2} dicht={d} />
  </g>
), undefined, 'M-32 -36q-8 -4 -4 -10q4 -4 0 -8')

const schaap: Figuur = viervoeter('#4A4F57', 56, (d) => (
  <g>
    <ellipse cx={36} cy={-46} rx={10} ry={13} fill="#4A4F57" />
    <Oog x={38} y={-50} r={2} dicht={d} />
  </g>
), (
  <g fill="#F4F6F8">
    <circle cx={-20} cy={-38} r={12} /><circle cx={-4} cy={-44} r={14} /><circle cx={14} cy={-40} r={13} /><circle cx={-12} cy={-26} r={11} /><circle cx={8} cy={-26} r={12} /><circle cx={24} cy={-30} r={9} />
  </g>
))

const kip: Figuur = {
  h: 40,
  teken: (mods) => (
    <g>
      <path d="M-4 0v-8M4 0v-8" stroke="#F2994A" strokeWidth={2.5} />
      <ellipse cx={-2} cy={-16} rx={15} ry={11} fill="#fff" stroke="#E6E1D8" />
      <path d="M-16 -18l-6 -10 4 14z" fill="#fff" />
      <circle cx={10} cy={-28} r={8} fill="#fff" />
      <path d="M6 -36q2 -6 4 0q2 -6 4 0q2 -4 3 2z" fill="#E53935" />
      <path d="M17 -28l6 2 -6 2z" fill="#F2994A" />
      <circle cx={14} cy={-22} r={2} fill="#E53935" />
      <Oog x={12} y={-30} r={1.5} dicht={mods.includes('slaapt')} />
    </g>
  ),
}

const paard = viervoeter('#A0522D', 92, (d) => (
  <g>
    <path d="M20 -44l10 -30 24 8 -6 16 -14 -2 -4 14z" fill="#A0522D" />
    <path d="M26 -72q-8 14 -12 30l6 2q2 -18 10 -30z" fill="#4A2A18" />
    <path d="M30 -76l2 -8 5 7z" fill="#A0522D" />
    <circle cx={50} cy={-60} r={1.6} fill={INKT} />
    <Oog x={38} y={-68} r={2.2} dicht={d} />
  </g>
), undefined, 'M-30 -42q-12 8 -10 26')

const vos = viervoeter('#E8742C', 54, (d) => (
  <g>
    <circle cx={34} cy={-46} r={13} fill="#E8742C" />
    <path d="M26 -56l-2 -12 10 6zM38 -58l8 -8 0 12z" fill="#E8742C" />
    <path d="M40 -44l14 2 -12 6z" fill="#fff" />
    <circle cx={53} cy={-42} r={1.8} fill={INKT} />
    <Oog x={36} y={-50} r={2} dicht={d} />
    <path d="M22 -38q12 6 22 0v6q-12 4 -22 -2z" fill="#D7263D" />
  </g>
), undefined, 'M-30 -36q-24 -4 -20 -22')

function eekhoorn(kleur: string): Figuur {
  return {
    h: 50,
    teken: (mods) => (
      <g>
        <path d="M-12 -12q-26 -10 -14 -38q10 -10 18 -2q-12 6 -4 20z" fill={kleur} />
        <ellipse cx={2} cy={-16} rx={11} ry={15} fill={kleur} />
        <ellipse cx={5} cy={-14} rx={6} ry={9} fill="#F3D9B1" />
        <circle cx={8} cy={-34} r={10} fill={kleur} />
        <path d="M2 -42l2 -8 4 6z" fill={kleur} />
        <circle cx={17} cy={-33} r={1.5} fill={INKT} />
        <Oog x={10} y={-37} r={1.8} dicht={mods.includes('slaapt')} />
      </g>
    ),
  }
}

const kikker: Figuur = {
  h: 34,
  teken: (mods) => (
    <g>
      <ellipse cx={0} cy={-12} rx={18} ry={12} fill="#5DBB63" />
      <ellipse cx={-14} cy={-2} rx={8} ry={3} fill="#4A9E50" /><ellipse cx={14} cy={-2} rx={8} ry={3} fill="#4A9E50" />
      <circle cx={-8} cy={-24} r={6} fill="#5DBB63" /><circle cx={8} cy={-24} r={6} fill="#5DBB63" />
      <Oog x={-8} y={-25} r={2.5} /><Oog x={8} y={-25} r={2.5} />
      <Lach x={0} y={-12} b={12} />
      {mods.includes('hoed') && <><rect x={-12} y={-33} width={24} height={3} fill={INKT} /><rect x={-8} y={-48} width={16} height={16} fill={INKT} /><rect x={-8} y={-36} width={16} height={3} fill="#E53935" /></>}
    </g>
  ),
}

const dinoKleuren: Record<string, string> = { paars: '#8E6CC9', oranje: '#F2994A', groen: '#7CC36E', blauw: '#2BB3A3' }

function dino(standaard: string): Figuur {
  return {
    h: 80,
    teken: (mods) => {
      const k = dinoKleuren[mods.find((m) => m in dinoKleuren) ?? standaard]
      return (
        <g>
          <path d="M-14 -36q-30 0 -44 10q20 0 40 10z" fill={k} />
          <ellipse cx={0} cy={-36} rx={22} ry={20} fill={k} />
          <path d="M-12 -52l4 -8 4 8M-2 -56l4 -8 4 8M8 -54l4 -8 4 8" fill={k} />
          <rect x={-12} y={-22} width={9} height={22} rx={4} fill={k} /><rect x={4} y={-22} width={9} height={22} rx={4} fill={k} />
          <ellipse cx={22} cy={-62} rx={18} ry={14} fill={k} />
          <rect x={12} y={-44} width={12} height={5} rx={2.5} fill={k} transform="rotate(25 12 -44)" />
          <Oog x={26} y={-66} r={2.6} dicht={mods.includes('slaapt')} />
          <Lach x={32} y={-56} b={8} />
          <ellipse cx={4} cy={-32} rx={10} ry={11} fill="#fff" opacity={0.25} />
        </g>
      )
    },
  }
}

const grotedino: Figuur = {
  h: 175,
  teken: (mods) => (
    <g>
      <path d="M-50 -50q-50 10 -80 40q40 -10 80 -20z" fill="#7A9E5B" />
      <ellipse cx={-10} cy={-56} rx={56} ry={38} fill="#7A9E5B" />
      <rect x={-50} y={-30} width={18} height={30} rx={6} fill="#6A8C4E" /><rect x={-24} y={-30} width={18} height={30} rx={6} fill="#6A8C4E" />
      <rect x={10} y={-30} width={18} height={30} rx={6} fill="#6A8C4E" /><rect x={30} y={-30} width={18} height={30} rx={6} fill="#6A8C4E" />
      <path d="M26 -80q20 -50 30 -86l20 4q-10 40 -30 90z" fill="#7A9E5B" />
      <ellipse cx={72} cy={-164} rx={20} ry={13} fill="#7A9E5B" />
      <Oog x={76} y={-168} r={2.6} />
      <Lach x={84} y={-158} b={8} />
      {mods.includes('mo') && <g transform="translate(64 -176) scale(0.6)">{mo.teken([])}</g>}
    </g>
  ),
}

const robot: Figuur = {
  h: 86,
  teken: (mods) => (
    <g>
      <rect x={-12} y={-24} width={8} height={24} rx={2} fill="#8A96A3" /><rect x={4} y={-24} width={8} height={24} rx={2} fill="#8A96A3" />
      <rect x={-20} y={-56} width={40} height={34} rx={6} fill="#B8C2CC" />
      <circle cx={-8} cy={-42} r={4} fill="#5DB7E8" /><circle cx={4} cy={-42} r={4} fill="#F7D046" /><circle cx={12} cy={-34} r={3} fill="#E57373" />
      <rect x={-27} y={-54} width={7} height={22} rx={3} fill="#8A96A3" /><rect x={20} y={-54} width={7} height={22} rx={3} fill="#8A96A3" />
      <rect x={-16} y={-82} width={32} height={24} rx={6} fill="#B8C2CC" />
      <path d="M0 -82v-8" stroke="#8A96A3" strokeWidth={2} /><circle cx={0} cy={-91} r={3} fill="#E57373" />
      <rect x={-10} y={-76} width={7} height={7} rx={2} fill="#5DB7E8" /><rect x={4} y={-76} width={7} height={7} rx={2} fill="#5DB7E8" />
      {mods.includes('lacht')
        ? <path d="M-8 -66q8 8 16 0" stroke={INKT} strokeWidth={2} fill="none" strokeLinecap="round" />
        : <path d="M-7 -65h14" stroke={INKT} strokeWidth={2} strokeLinecap="round" />}
      {mods.includes('blaft') && <g><rect x={20} y={-110} width={50} height={22} rx={10} fill="#fff" stroke={INKT} /><text x={27} y={-94} fontSize={13} fontWeight={700} fill={INKT} fontFamily="sans-serif">Woef!</text></g>}
      {mods.includes('lacht') && <text x={20} y={-86} fontSize={12} fontWeight={700} fill={INKT} fontFamily="sans-serif">hihi</text>}
    </g>
  ),
}

// ---------- dingen ----------
const SterVorm = ({ x, y, r, kleur = '#FFD84D' }: { x: number; y: number; r: number; kleur?: string }) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`
  })
  return <polygon points={p.join(' ')} fill={kleur} />
}

const Wolk = ({ s = 1, kleur = '#fff' }: { s?: number; kleur?: string }) => (
  <g transform={`scale(${s})`} fill={kleur}>
    <circle cx={-18} cy={-10} r={12} /><circle cx={0} cy={-18} r={16} /><circle cx={18} cy={-10} r={12} /><rect x={-30} y={-12} width={60} height={12} rx={6} />
  </g>
)

const Huis = ({ muur = '#F2C57C', dak = '#D9534F' }: { muur?: string; dak?: string }) => (
  <g>
    <rect x={-40} y={-60} width={80} height={60} fill={muur} />
    <path d="M-50 -58l50 -40 50 40z" fill={dak} />
    <rect x={-10} y={-34} width={20} height={34} fill="#8B5E3C" />
    <rect x={-32} y={-48} width={16} height={14} fill="#BFE3F5" /><rect x={16} y={-48} width={16} height={14} fill="#BFE3F5" />
  </g>
)

const Boom = ({ om = false }: { om?: boolean }) => (
  <g transform={om ? 'rotate(80)' : undefined}>
    <rect x={-8} y={-70} width={16} height={70} fill="#8B5E3C" />
    <circle cx={0} cy={-96} r={34} fill="#3E8E4A" /><circle cx={-24} cy={-78} r={22} fill="#4FA35B" /><circle cx={24} cy={-80} r={24} fill="#4FA35B" />
  </g>
)

function vast(h: number, teken: (mods: string[]) => ReactNode, lucht = false): Figuur {
  return { h, lucht, teken }
}

const kleurAuto: Record<string, string> = { rood: '#E53935', geel: '#F7C531', blauw: '#3D7DD8' }

export const figuren: Record<string, Figuur> = {
  // vaste personages
  dirk, mo, pip: pinguin(52), pipmama: pinguin(78),
  // dieren
  kat: kat('#F2994A'), poes: kat('#B9BDC2', 34), eend, beer: beerVorm('#8B5E3C', '#C8A27C', 78), konijn: konijnVorm(false),
  juf: konijnVorm(true), tijs, hond, koe, varken, schaap, kip, paard, vos, eekhoorn: eekhoorn('#C1662F'),
  eekhoorn2: eekhoorn('#8E4B2A'), kikker, rex: dino('blauw'), dino: dino('paars'), grotedino, robot,
  // mensen
  noor: mens({ huid: '#F5CBA7', haar: '#7B4A2A', kapsel: 'lang', shirt: '#F28DB2', onder: '#5B6B8C', rok: true }),
  meisje: mens({ huid: '#C68B59', haar: '#2B2B2B', kapsel: 'staart', shirt: '#F7C531', onder: '#3D7DD8' }),
  jongen: mens({ huid: '#F5CBA7', haar: '#E3B04B', kapsel: 'kort', shirt: '#3D7DD8', onder: '#4A4F57' }),
  daan: mens({ huid: '#E0AC84', haar: '#5A3A22', kapsel: 'kort', shirt: '#3FA34D', onder: '#4A4F57', extra: ['pet'] }),
  opa: mens({ volwassen: true, huid: '#F1C9A5', haar: '#CFCFCF', kapsel: 'kaal', shirt: '#9C6B45', onder: '#5B6B8C', extra: ['bril'] }),
  bakker: mens({ volwassen: true, huid: '#F1C9A5', haar: '#6B4A2A', kapsel: 'kort', shirt: '#F4F6F8', onder: '#4A4F57', extra: ['koksmuts'] }),
  wachter: mens({ volwassen: true, huid: '#E8B48F', haar: '#8A5A3A', kapsel: 'kort', shirt: '#2F4F7F', onder: '#2B3440', extra: ['baard', 'pet'] }),
  buurvrouw: mens({ volwassen: true, huid: '#F5CBA7', haar: '#C0502B', kapsel: 'lang', shirt: '#8E6CC9', onder: '#8E6CC9', rok: true }),
  tovenares: mens({ volwassen: true, huid: '#F5CBA7', haar: '#2B2B2B', kapsel: 'lang', shirt: '#6E4FA8', onder: '#6E4FA8', rok: true, extra: ['heksenhoed'] }),
  onderzoekster: mens({ volwassen: true, huid: '#8D5B3E', haar: '#2B2B2B', kapsel: 'staart', shirt: '#5DB7E8', onder: '#4A4F57', extra: ['bril', 'jas'] }),
  // lucht
  ster: vast(24, () => <SterVorm x={0} y={-12} r={12} />, true),
  maan: vast(50, () => <path d="M6 -50a25 25 0 1 0 0 50a16 25 0 1 1 0 -50z" fill="#FFE9A8" />, true),
  zon: vast(56, () => <g><circle cx={0} cy={-28} r={20} fill="#FFD84D" />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={-2} y={-56} width={4} height={10} rx={2} fill="#FFD84D" transform={`rotate(${i * 45} 0 -28)`} />)}</g>, true),
  wolk: vast(36, () => <Wolk s={1.2} />, true),
  wolkje: vast(26, () => <g><Wolk s={0.7} /><Oog x={-5} y={-10} r={1.6} /><Oog x={5} y={-10} r={1.6} /></g>, true),
  vlieger: vast(70, (m) => (
    <g transform={m.includes('laag') ? 'translate(0 60)' : undefined}>
      <path d="M0 -70l18 22 -18 26 -18 -26z" fill="#E53935" /><path d="M0 -70v48M-18 -48h36" stroke="#fff" strokeWidth={1.5} />
      <path d="M0 -22q-8 10 0 18t-4 20q8 8 -2 20" stroke={INKT} strokeWidth={1.2} fill="none" />
      <path d="M-4 -10l-6 -3 0 6zM-2 6l-6 -3 0 6z" fill="#F7D046" />
    </g>
  ), true),
  aarde: vast(50, () => <g><circle cx={0} cy={-25} r={24} fill="#3D7DD8" /><path d="M-14 -38q8 -6 14 2t10 6q-4 10 -12 6t-12 -14zM4 -14q8 -4 12 4q-6 6 -12 -4z" fill="#4FA35B" /></g>, true),
  // grond: natuur
  boom: vast(130, (m) => <Boom om={m.includes('om')} />),
  struik: vast(40, () => <g fill="#4FA35B"><circle cx={-14} cy={-14} r={14} /><circle cx={4} cy={-22} r={18} /><circle cx={20} cy={-12} r={12} /></g>),
  steen: vast(26, () => <path d="M-26 0q-2 -22 18 -26q22 -2 30 14q4 12 -4 12z" fill="#9AA0A6" />),
  bloem: vast(36, () => <g><path d="M0 0v-24" stroke="#3E8E4A" strokeWidth={3} /><circle cx={0} cy={-28} r={10} fill="#F28DB2" /><circle cx={0} cy={-28} r={4} fill="#FFD84D" /></g>),
  pit: vast(8, () => <ellipse cx={0} cy={-4} rx={3} ry={5} fill="#4A4F57" />),
  spruit: vast(22, () => <g><path d="M0 0v-16" stroke="#4FA35B" strokeWidth={3} /><path d="M0 -14q-10 -8 -12 0q8 4 12 0zM0 -16q10 -8 12 0q-8 4 -12 0z" fill="#5DBB63" /></g>),
  zonnebloem: vast(110, (m) => {
    const h = m.includes('groot') ? 140 : m.includes('half') ? 75 : 110
    return (
      <g>
        <path d={`M0 0v-${h}`} stroke="#3E8E4A" strokeWidth={6} />
        <path d={`M0 -${h * 0.4}q-22 -10 -26 4q14 6 26 -4zM0 -${h * 0.6}q22 -10 26 4q-14 6 -26 -4z`} fill="#4FA35B" />
        {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={0} cy={-h - 16} rx={6} ry={12} fill="#F7C531" transform={`rotate(${i * 30} 0 ${-h})`} />)}
        <circle cx={0} cy={-h} r={13} fill="#7B4A2A" />
      </g>
    )
  }),
  noot: vast(14, () => <g><ellipse cx={0} cy={-6} rx={6} ry={7} fill="#B07A45" /><path d="M-7 -10q7 -8 14 0z" fill="#7B4A2A" /></g>),
  vulkaan: vast(150, (m) => (
    <g>
      <path d="M-110 0l70 -140h40l70 140z" fill="#7B5B4A" />
      <path d="M-40 -140h40l6 12q-26 8 -52 0z" fill="#5E4336" />
      {m.includes('uitbarsting') && <path d="M-26 -140q-10 -40 6 -60q10 20 14 0q20 30 0 60zM-36 -134q-20 30 -44 120l14 2q10 -60 34 -110z" fill="#F2582C" />}
      {!m.includes('uitbarsting') && <g fill="#C9CCD3" opacity={0.85}><circle cx={-18} cy={-154} r={8} /><circle cx={-10} cy={-170} r={10} /><circle cx={0} cy={-188} r={12} /></g>}
    </g>
  )),
  // grond: gebouwen en grote dingen
  huis: vast(98, () => <Huis />),
  kast: vast(120, (m) => (
    <g>
      <rect x={-34} y={-120} width={68} height={120} rx={4} fill="#9C6B45" />
      {m.includes('open')
        ? <><rect x={-30} y={-114} width={60} height={108} fill="#3A2A20" /><rect x={-10} y={-40} width={20} height={30} rx={3} fill="#F4F7FB" /><circle cx={6} cy={-25} r={2} fill="#C9A227" /></>
        : <><path d="M0 -118v114" stroke="#7B5236" strokeWidth={2} /><circle cx={-5} cy={-60} r={2.5} fill="#C9A227" /><circle cx={5} cy={-60} r={2.5} fill="#C9A227" /></>}
    </g>
  )),
  bed: vast(46, () => <g><rect x={-50} y={-30} width={100} height={22} rx={4} fill="#5B8DEF" /><rect x={-54} y={-46} width={8} height={46} fill="#9C6B45" /><rect x={46} y={-36} width={8} height={36} fill="#9C6B45" /><rect x={-44} y={-40} width={26} height={12} rx={5} fill="#fff" /></g>),
  oven: vast(90, () => <g><path d="M-50 0v-50q0 -40 50 -40t50 40v50z" fill="#C0502B" /><path d="M-24 0v-28q0 -18 24 -18t24 18v28z" fill="#3A2A20" /><path d="M-14 -6q4 -20 14 -24q10 6 12 24z" fill="#F2994A" /></g>),
  lantaarn: vast(110, () => <g><rect x={-3} y={-100} width={6} height={100} fill={INKT} /><path d="M-10 -100h20l-4 -18h-12z" fill="#FFE9A8" /><circle cx={0} cy={-108} r={22} fill="#FFE9A8" opacity={0.35} /></g>),
  boot: vast(60, () => <g><path d="M-50 -16h100l-14 16h-72z" fill="#D9534F" /><rect x={-2} y={-62} width={4} height={46} fill="#7B5236" /><path d="M2 -60l30 40h-30z" fill="#F4F6F8" /></g>),
  vuurtoren: vast(190, (m) => (
    <g>
      {!m.includes('uit') && <path d="M0 -170l-160 -30v30zM0 -170l160 -24v28z" fill="#FFE9A8" opacity={0.55} />}
      <path d="M-26 0l8 -150h36l8 150z" fill="#F4F6F8" />
      <path d="M-24 -30h48l-2 -30h-44zM-20 -100h40l-1 -26h-38z" fill="#D9534F" />
      <rect x={-20} y={-178} width={40} height={28} fill={m.includes('uit') ? '#4A4F57' : '#FFE9A8'} />
      <path d="M-24 -178h48l-24 -16z" fill="#D9534F" />
    </g>
  )),
  raket: vast(140, (m) => m.includes('karton')
    ? <g><rect x={-26} y={-110} width={52} height={110} fill="#C9A27C" /><path d="M-26 -110l26 -30 26 30z" fill="#B88D62" /><circle cx={0} cy={-76} r={12} fill="#BFE3F5" stroke="#8B6A48" strokeWidth={3} /><path d="M-26 -24l-14 24h14zM26 -24l14 24h-14z" fill="#B88D62" /><path d="M-16 -40h10M6 -40h10" stroke="#E53935" strokeWidth={3} /></g>
    : <g><path d="M-22 -20q0 -90 22 -120q22 30 22 120z" fill="#F4F6F8" /><path d="M-22 -20l-16 20v-30zM22 -20l16 20v-30z" fill="#D9534F" /><circle cx={0} cy={-80} r={10} fill="#5DB7E8" stroke="#9AA0A6" strokeWidth={3} /><path d="M-12 -20q12 40 24 0z" fill="#F2994A" /></g>),
  boomhut: vast(180, (m) => (
    <g>
      <Boom />
      {m.includes('half')
        ? <rect x={-36} y={-92} width={72} height={8} fill="#C99A6B" />
        : <><rect x={-36} y={-92} width={72} height={8} fill="#B07A45" /><rect x={-32} y={-130} width={64} height={38} fill="#C99A6B" /><path d="M-40 -128l40 -24 40 24z" fill="#9C6B45" /><rect x={-8} y={-122} width={16} height={16} fill="#3A2A20" /><path d="M24 -84v84M38 -84v84M24 -70h14M24 -54h14M24 -38h14M24 -22h14M24 -6h14" stroke="#9C6B45" strokeWidth={3} /></>}
    </g>
  )),
  doos: vast(44, (m) => (
    <g>
      <rect x={-30} y={-40} width={60} height={40} fill="#C9A27C" />
      {m.includes('open')
        ? <path d="M-30 -40l-14 -14h30zM30 -40l14 -14h-30z" fill="#B88D62" />
        : <><rect x={-32} y={-46} width={64} height={8} fill="#B88D62" /><circle cx={-12} cy={-22} r={2.5} fill="#5E4336" /><circle cx={0} cy={-18} r={2.5} fill="#5E4336" /><circle cx={12} cy={-24} r={2.5} fill="#5E4336" /></>}
    </g>
  )),
  // Halloween (verhaal 31): lief en grappig
  pompoen: vast(46, (m) => (
    <g>
      <rect x={-3} y={-50} width={6} height={10} rx={2} fill="#4F8A3C" />
      <ellipse cx={-14} cy={-22} rx={14} ry={20} fill="#E8772E" /><ellipse cx={14} cy={-22} rx={14} ry={20} fill="#E8772E" />
      <ellipse cx={0} cy={-22} rx={14} ry={22} fill="#F2994A" />
      {m.includes('lantaarn') && <>
        <path d="M-14 -34l7 8h-14zM14 -34l7 8h-14z" fill="#FFE27A" />
        <path d="M-14 -16q14 18 28 0q-14 6 -28 0z" fill="#FFE27A" />
        <path d="M-2 -26l2 -4l2 4z" fill="#FFE27A" />
        <circle cx={0} cy={-22} r={26} fill="#FFE27A" opacity={0.18} />
      </>}
    </g>
  )),
  spookje: vast(60, (m) => (
    <g>
      <path d="M-24 0q-4 -50 24 -56q28 6 24 56q-6 -8 -12 0q-6 -8 -12 0q-6 -8 -12 0q-6 8 -12 0z" fill="#F7F9FC" stroke="#D5DCE4" strokeWidth={2} />
      <ellipse cx={-8} cy={-36} rx={4} ry={5.5} fill={INKT} /><ellipse cx={9} cy={-36} rx={4} ry={5.5} fill={INKT} />
      <circle cx={-14} cy={-28} r={4.5} fill="#F28B9B" opacity={0.55} /><circle cx={15} cy={-28} r={4.5} fill="#F28B9B" opacity={0.55} />
      <path d="M-5 -26q5 6 10 0" stroke={INKT} strokeWidth={2} fill="none" strokeLinecap="round" />
      {m.includes('lampion') && <g transform="translate(26 -22)"><path d="M0 0v-8" stroke={INKT} strokeWidth={1.5} /><rect x={-5} y={0} width={10} height={14} rx={3} fill="#F2994A" /><rect x={-3} y={3} width={6} height={8} rx={2} fill="#FFE27A" /></g>}
    </g>
  )),
  lampion: vast(36, () => (
    <g>
      <path d="M0 -36v-8" stroke={INKT} strokeWidth={2} strokeLinecap="round" />
      <path d="M-12 -34h24l4 8v22l-4 6h-24l-4 -6v-22z" fill="#E8772E" />
      <rect x={-8} y={-26} width={16} height={22} rx={4} fill="#FFE27A" />
      <circle cx={0} cy={-15} r={22} fill="#FFE27A" opacity={0.2} />
    </g>
  )),
  // auto's en fietsen
  auto: vast(44, (m) => {
    const k = kleurAuto[m.find((x) => x in kleurAuto) ?? 'rood']
    return <g><path d="M-48 -12v-14q0 -6 8 -8l14 -2 12 -14h34l14 14 8 2q6 2 6 8v14z" fill={k} /><path d="M-20 -36l10 -12h12v12zM6 -36v-12h12l10 12z" fill="#BFE3F5" /><circle cx={-28} cy={-10} r={10} fill={INKT} /><circle cx={28} cy={-10} r={10} fill={INKT} /><circle cx={-28} cy={-10} r={4} fill="#B8C2CC" /><circle cx={28} cy={-10} r={4} fill="#B8C2CC" /></g>
  }),
  oudeauto: vast(56, (m) => (
    <g>
      <path d="M-50 -18q0 -20 20 -22l10 -18h36l14 18q20 0 20 22z" fill="#3D7DD8" />
      <path d="M-16 -42l8 -12h12v12zM8 -42v-12h8l8 12z" fill="#BFE3F5" />
      <circle cx={46} cy={-26} r={7} fill="#FFE9A8" />
      {m.includes('ogen') && <><circle cx={47} cy={-26} r={3} fill={INKT} /><path d="M38 -36q8 -4 14 0" stroke={INKT} strokeWidth={1.5} fill="none" /></>}
      <circle cx={-28} cy={-14} r={13} fill={INKT} /><circle cx={28} cy={-14} r={13} fill={INKT} />
      <circle cx={-28} cy={-14} r={5} fill="#B8C2CC" /><circle cx={28} cy={-14} r={5} fill="#B8C2CC" />
    </g>
  )),
  fiets: vast(40, (m) => {
    const k = m.includes('geel') ? '#F7C531' : '#3D7DD8'
    return <g fill="none" stroke={INKT} strokeWidth={2.5}><circle cx={-22} cy={-14} r={14} /><circle cx={22} cy={-14} r={14} /><path d="M-22 -14l14 -22h22l8 22M-8 -36l8 22 14 -22M-12 -40h8M20 -40h-6" stroke={k} strokeWidth={4} /></g>
  }),
  // kleine dingen
  sok: vast(26, () => <path d="M-6 -26h12v14q12 0 12 8t-12 4h-12z" fill="#E53935" />),
  bal: vast(24, () => <g><circle cx={0} cy={-12} r={12} fill="#F7C531" /><path d="M-12 -12h24M0 -24v24" stroke="#E53935" strokeWidth={3} /></g>),
  speelgoed: vast(40, () => <g><rect x={-40} y={-20} width={20} height={20} fill="#E53935" /><rect x={-36} y={-38} width={16} height={18} fill="#5B8DEF" /><rect x={-16} y={-16} width={16} height={16} fill="#F7C531" /><circle cx={14} cy={-14} r={14} fill="#F28DB2" /><rect x={28} y={-14} width={20} height={10} rx={3} fill="#3FA34D" /></g>),
  taart: vast(46, () => <g><rect x={-30} y={-30} width={60} height={30} rx={4} fill="#F5D6B8" /><path d="M-30 -30h60v10q-10 6 -20 0t-20 0t-20 0z" fill="#fff" /><circle cx={-14} cy={-34} r={5} fill="#E53935" /><circle cx={0} cy={-34} r={5} fill="#E53935" /><circle cx={14} cy={-34} r={5} fill="#E53935" /><rect x={-2} y={-50} width={4} height={12} fill="#5B8DEF" /><path d="M0 -56q4 4 0 6q-4 -2 0 -6z" fill="#F2994A" /></g>),
  koek: vast(16, () => <g><circle cx={0} cy={-8} r={8} fill="#D9A066" /><circle cx={-3} cy={-10} r={1.5} fill="#6B4A2A" /><circle cx={3} cy={-6} r={1.5} fill="#6B4A2A" /></g>),
  brood: vast(20, () => <g><ellipse cx={0} cy={-10} rx={20} ry={10} fill="#D9A066" /><path d="M-10 -16l4 8M0 -18l4 8M10 -16l4 8" stroke="#B07A45" strokeWidth={2} /></g>),
  tandenborstel: vast(60, () => <g transform="rotate(-30)"><rect x={-3} y={-60} width={6} height={60} rx={3} fill="#5DB7E8" /><rect x={-5} y={-74} width={10} height={14} fill="#fff" /></g>),
  gieter: vast(28, () => <g><rect x={-14} y={-26} width={24} height={26} rx={3} fill="#5DB7E8" /><path d="M10 -18l16 -10v4l-14 10z" fill="#5DB7E8" /><path d="M-14 -20q-10 0 -8 10" stroke="#5DB7E8" strokeWidth={3} fill="none" /></g>),
  vlag: vast(60, () => <g><rect x={-2} y={-60} width={3} height={60} fill="#9AA0A6" /><path d="M1 -60h30v20h-30z" fill="#F7C531" /><SterVorm x={16} y={-50} r={6} kleur="#E53935" /></g>),
  bot: vast(18, () => <g fill="#F4F1E8"><rect x={-16} y={-12} width={32} height={6} rx={3} /><circle cx={-16} cy={-14} r={4} /><circle cx={-16} cy={-6} r={4} /><circle cx={16} cy={-14} r={4} /><circle cx={16} cy={-6} r={4} /></g>),
  skelet: vast(100, () => <g fill="none" stroke="#F4F1E8" strokeWidth={4} strokeLinecap="round"><path d="M-60 -40q30 -20 70 -10q20 -40 30 -50" /><path d="M-30 -46v46M-10 -48v48M10 -50v50M30 -60v-30" /><circle cx={44} cy={-96} r={8} /><path d="M-40 -44l-4 -10M-20 -48l-2 -10M0 -50v-10" /></g>),
  boek: vast(20, () => <g><path d="M-18 -4l18 -14 18 14z" fill="#5B8DEF" /><path d="M-16 -6l16 -11 16 11" stroke="#fff" fill="none" /></g>),
  schelp: vast(22, () => <g><path d="M-16 0q0 -24 16 -24t16 24z" fill="#D9C2A0" /><path d="M0 0v-22M-8 0l-4 -18M8 0l4 -18" stroke="#B59A72" strokeWidth={2} /></g>),
  handschoen: vast(18, () => <path d="M-8 0v-10q-6 -4 -4 -8l4 2v-6h3v5h2v-6h3v6h2v-4h3v12q0 9 -6 9z" fill="#3FA34D" />),
  beker: vast(50, () => <g><path d="M-18 -50h36q0 28 -18 30q-18 -2 -18 -30z" fill="#F7C531" /><path d="M-18 -44q-12 0 -10 10q2 6 10 4M18 -44q12 0 10 10q-2 6 -10 4" stroke="#F7C531" strokeWidth={3} fill="none" /><rect x={-4} y={-20} width={8} height={12} fill="#E0B52E" /><rect x={-14} y={-8} width={28} height={8} fill="#E0B52E" /></g>),
  zaklamp: vast(18, () => <g><rect x={-14} y={-12} width={22} height={10} rx={3} fill="#4A4F57" /><path d="M8 -14h6v14h-6z" fill="#9AA0A6" /><path d="M14 -12l40 -12v26l-40 -10z" fill="#FFE9A8" opacity={0.7} /></g>),
  vis: vast(28, () => <g><path d="M-24 0l4 -22h40l4 22z" fill="#C99A6B" /><path d="M-14 -20q8 -10 16 0q-8 8 -16 0zM2 -20l6 -5v10z" fill="#5DB7E8" /><path d="M0 -24q8 -10 16 0q-8 8 -16 0zM16 -24l6 -5v10z" fill="#9AA0A6" /></g>),
  planken: vast(28, () => <g>{[0, 1, 2, 3].map((i) => <rect key={i} x={-40 + i * 3} y={-7 - i * 7} width={80} height={6} fill={i % 2 ? '#C99A6B' : '#B07A45'} />)}</g>),
  tekening: vast(40, () => <g><rect x={-18} y={-40} width={36} height={30} fill="#fff" stroke="#E0E3E7" /><circle cx={-6} cy={-28} r={5} fill="#F7C531" /><path d="M-14 -14l10 -10 8 6 10 -10" stroke="#3FA34D" strokeWidth={2} fill="none" /><path d="M8 -32l2 4M12 -34l2 4" stroke="#E53935" /></g>),
  schoen: vast(26, () => <g><path d="M-12 -26h14v14q14 0 20 8v4h-34z" fill="#D8452B" /><rect x={-12} y={-2} width={34} height={4} rx={2} fill="#2B2B2B" /></g>),
  wortel: vast(30, () => <g><path d="M-5 -30l5 30l5 -30z" fill="#F2994A" transform="rotate(-20)" /><path d="M-9 -34q3 -10 7 -2q2 -9 7 -1q4 -6 5 2z" fill="#3FA34D" transform="rotate(-20)" /></g>),
  maanstorm: vast(80, () => <g fill="#9AA0A6" opacity={0.85}><circle cx={-30} cy={-30} r={26} /><circle cx={0} cy={-50} r={30} /><circle cx={30} cy={-34} r={24} /><path d="M-40 -14q40 -20 80 0" stroke="#6B7280" strokeWidth={4} fill="none" /></g>),
  meer: vast(30, () => <ellipse cx={0} cy={-12} rx={70} ry={14} fill="#5DB7E8" />),
  dorp: vast(70, () => <g transform="scale(0.6)"><g transform="translate(-60 0)"><Huis muur="#F4E1C1" dak="#C0502B" /></g><g transform="translate(60 0)"><Huis muur="#F2C57C" dak="#8E6CC9" /></g><g transform="translate(0 -10) scale(0.8)"><Huis muur="#E6EEF2" dak="#3D7DD8" /></g></g>),
  // over de hele prent
  sterren: { h: 0, vol: true, teken: () => <g>{[[30, 30], [80, 18], [140, 40], [190, 14], [250, 30], [300, 16], [360, 36], [110, 70], [330, 64], [60, 80]].map(([x, y], i) => <SterVorm key={i} x={x} y={y} r={i % 3 ? 4 : 6} />)}</g> },
  regen: { h: 0, vol: true, teken: () => <g stroke="#5DB7E8" strokeWidth={3} strokeLinecap="round">{Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${30 + (i * 37) % 340} ${70 + (i * 23) % 90}l-4 10`} />)}</g> },
  kleurregen: { h: 0, vol: true, teken: () => <g>{Array.from({ length: 28 }, (_, i) => <ellipse key={i} cx={20 + (i * 47) % 360} cy={30 + (i * 29) % 130} rx={4} ry={6} fill={['#E53935', '#F7C531', '#3FA34D', '#3D7DD8', '#F28DB2', '#F2994A'][i % 6]} />)}</g> },
  regenboog: { h: 0, vol: true, teken: () => <g fill="none" strokeWidth={9}>{['#E53935', '#F2994A', '#F7C531', '#3FA34D', '#3D7DD8', '#8E6CC9'].map((k, i) => <path key={k} d={`M${50 + i * 9} 180a${150 - i * 9} ${130 - i * 9} 0 0 1 ${300 - i * 18} 0`} stroke={k} />)}</g> },
  knopen: { h: 0, vol: true, teken: () => <g>{Array.from({ length: 16 }, (_, i) => { const x = 30 + (i * 53) % 340, y = 40 + (i * 37) % 170; return <g key={i}><circle cx={x} cy={y} r={6} fill={['#E53935', '#3D7DD8', '#F7C531'][i % 3]} /><circle cx={x - 2} cy={y} r={1} fill="#fff" /><circle cx={x + 2} cy={y} r={1} fill="#fff" /></g> })}</g> },
  kruimels: { h: 0, vol: true, teken: () => <g fill="#D9A066">{[[60, 232], [100, 226], [150, 236], [205, 228], [255, 234], [300, 227], [345, 236]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} />)}</g> },
  sporen: { h: 0, vol: true, teken: () => <path d="M20 236l14 -6 14 6 14 -6 14 6 14 -6 14 6 14 -6 14 6 14 -6 14 6" stroke="#6B4A2A" strokeWidth={3} fill="none" opacity={0.6} /> },
}
