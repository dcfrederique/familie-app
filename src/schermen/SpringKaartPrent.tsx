import type { CSSProperties, ReactNode } from 'react'
import type { WereldStijl } from '../data/springen.ts'
import { KAART_HOOG, type KaartWereld, type Versiersel } from '../lib/spelletjes/springKaart.ts'

// Tekeningen voor de landkaart van Springland (eigen ontwerp, vlakke vormen): de grond van elke wereld, alles wat
// er naast het pad staat en wat er rondvliegt. De animaties staan in springen.css (klassen k-...), rustig en traag;
// met "minder beweging" op het toestel staan ze stil.

const H = KAART_HOOG
const traag = (s: number): CSSProperties => ({ animationDelay: `-${s.toFixed(2)}s` })
/** Minder beweging gevraagd op het toestel: dan draait ook de molen niet. */
const stil = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** De grond van een wereld: kleur, vlekken en heuvels, per stijl. */
export function Grond({ w }: { w: KaartWereld }) {
  const b = w.tot - w.van, x = w.van
  const vlekken = (kleur: string, n: number) => Array.from({ length: n }, (_, i) => (
    <ellipse key={i} cx={x + ((i * 173) % b)} cy={40 + ((i * 97) % (H - 80))} rx={60 + (i % 3) * 30} ry={26 + (i % 2) * 14} fill={kleur} />
  ))
  switch (w.stijl) {
    case 'zand': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#F3D99B" />
        {vlekken('#EDCB80', 9)}
        {Array.from({ length: Math.ceil(b / 160) }, (_, i) => (
          <path key={i} d={`M${x + i * 160} ${70 + (i % 2) * 20}q40-18 80 0t80 0`} stroke="#E2B86A" strokeWidth="4" fill="none" opacity=".6" />
        ))}
        {/* De zee onderaan met golfjes */}
        <rect x={x} y={H - 46} width={b} height="46" fill="#5BBDE8" />
        <path d={Array.from({ length: Math.ceil(b / 40) + 1 }, (_, i) => `M${x + i * 40} ${H - 46}q10-8 20 0t20 0`).join('')}
              stroke="#FFFFFF" strokeWidth="4" fill="none" className="k-golfjes" />
      </g>
    )
    case 'nacht': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#2E3F6E" />
        {vlekken('#34477A', 9)}
        {Array.from({ length: Math.floor(b / 30) }, (_, i) => (
          <circle key={i} cx={x + ((i * 47) % b)} cy={14 + ((i * 89) % (H - 28))} r={1.5 + (i % 3)} fill="#FFF3C4" opacity=".75" className={i % 4 ? undefined : 'k-glinster'} style={i % 4 ? undefined : traag(i / 7)} />
        ))}
      </g>
    )
    case 'hemel': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#CFE9FA" />
        {vlekken('#E3F3FC', 9)}
        {vlekken('#FFFFFF', 7)}
        {Array.from({ length: Math.floor(b / 70) }, (_, i) => (
          <path key={i} d={`M${x + 30 + i * 70} ${50 + ((i * 83) % (H - 100))}h28`} stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        ))}
      </g>
    )
    case 'sneeuw': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#E8F1FA" />
        {vlekken('#D6E4F2', 9)}
        {vlekken('#FFFFFF', 6)}
      </g>
    )
    case 'speelgoed': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#F4DDB4" />
        {Array.from({ length: Math.ceil(H / 34) }, (_, i) => <path key={i} d={`M${x} ${i * 34}H${x + b}`} stroke="#E6C894" strokeWidth="3" />)}
        {Array.from({ length: Math.ceil(b / 140) * Math.ceil(H / 34) }, (_, i) => (
          <path key={`n${i}`} d={`M${x + ((i * 140 + (Math.floor(i / Math.ceil(b / 140)) % 2) * 70) % b)} ${Math.floor(i / Math.ceil(b / 140)) * 34}v34`} stroke="#E6C894" strokeWidth="3" />
        ))}
        {/* Een groot speelkleed met een weg erop */}
        <rect x={x + 30} y={H * 0.12} width={b - 60} height={H * 0.76} rx="30" fill="#CDEBFA" />
        <rect x={x + 44} y={H * 0.12 + 14} width={b - 88} height={H * 0.76 - 28} rx="22" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeDasharray="14 12" />
      </g>
    )
    case 'speeldoos': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#8E2F3B" />
        {vlekken('#9E3B48', 9)}
        {/* Fluwelen bekleding met gouden stipjes en een notenbalk van lange lijntjes */}
        {Array.from({ length: Math.floor(b / 38) * 2 }, (_, i) => (
          <circle key={i} cx={x + ((i * 61) % b)} cy={18 + ((i * 113) % (H - 36))} r="2.5" fill="#F2C530" opacity=".55" />
        ))}
        {[0.3, 0.38, 0.46, 0.54, 0.62].map((f, i) => <path key={i} d={`M${x} ${H * f}H${x + b}`} stroke="#E8C766" strokeWidth="2" opacity=".25" />)}
      </g>
    )
    case 'daken': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#C8664C" />
        {/* Rijen dakpannen, telkens een halve pan verschoven */}
        {Array.from({ length: Math.ceil(H / 26) }, (_, r) => (
          <g key={r}>
            <path d={`M${x} ${r * 26 + 24}H${x + b}`} stroke="#A84E37" strokeWidth="3" />
            {Array.from({ length: Math.ceil(b / 36) + 1 }, (_, i) => (
              <path key={i} d={`M${x + i * 36 + (r % 2) * 18} ${r * 26}a18 14 0 0 0 0 24`} stroke="#B5583F" strokeWidth="2" fill="none" />
            ))}
          </g>
        ))}
        {/* Een nok met een lichte rand */}
        <rect x={x} y={H * 0.48} width={b} height="10" fill="#8E2A20" opacity=".55" />
      </g>
    )
    case 'herfst': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#E9CB8E" />
        {vlekken('#DDB572', 9)}
        {/* Overal gevallen blaadjes op de bosgrond */}
        {Array.from({ length: Math.floor(b / 26) }, (_, i) => (
          <path key={i} d="M0-7C6-6 8 0 0 7C-8 0-6-6 0-7Z" transform={`translate(${x + ((i * 61) % b)} ${12 + ((i * 113) % (H - 24))}) rotate(${(i * 47) % 360})`}
                fill={['#E07A2E', '#C2662D', '#E8A33A', '#B5432B'][i % 4]} opacity=".7" />
        ))}
      </g>
    )
    case 'snoep': return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#FFD3E8" />
        {vlekken('#FBC0DC', 8)}
        {Array.from({ length: Math.floor(b / 46) * 2 }, (_, i) => (
          <circle key={i} cx={x + ((i * 61) % b)} cy={20 + ((i * 113) % (H - 40))} r="5" fill={['#FFFFFF', '#FFE27A', '#B9F6CA'][i % 3]} opacity=".7" />
        ))}
      </g>
    )
    default: return (
      <g>
        <rect x={x} y="0" width={b} height={H} fill="#9ED98A" />
        {vlekken('#8FCF7A', 10)}
        {vlekken('#AEE29B', 6)}
        {/* Grassprietjes */}
        {Array.from({ length: Math.floor(b / 30) * 3 }, (_, i) => {
          const gx = x + ((i * 47) % b), gy = 20 + ((i * 131) % (H - 30))
          return <path key={i} d={`M${gx} ${gy}l3-9l3 9l3-7`} stroke="#6FB85E" strokeWidth="2" fill="none" strokeLinecap="round" />
        })}
      </g>
    )
  }
}

/** Een riviertje dat stroomt, met een houten bruggetje waar het pad erover loopt. */
export function Rivier({ x, brugY }: { x: number; brugY: number }) {
  return (
    <g aria-hidden="true">
      <path d={`M${x - 22} 0C${x - 40} ${H * 0.3} ${x} ${H * 0.6} ${x - 24} ${H}H${x + 24}C${x + 44} ${H * 0.6} ${x + 4} ${H * 0.3} ${x + 22} 0Z`} fill="#6DBDF0" />
      <path d={`M${x} 0C${x - 18} ${H * 0.3} ${x + 22} ${H * 0.6} ${x} ${H}`} stroke="#B3E0FB" strokeWidth="5" fill="none" strokeDasharray="18 26" className="k-stroom" />
      <g transform={`translate(${x} ${brugY})`}>
        <rect x="-48" y="-30" width="96" height="60" rx="6" fill="#B07B4F" />
        {[-36, -18, 0, 18, 36].map((d) => <rect key={d} x={d - 7} y="-30" width="14" height="60" fill="#C98B4E" stroke="#8A5A33" strokeWidth="2" />)}
        <rect x="-50" y="-36" width="100" height="8" rx="4" fill="#8A5A33" />
        <rect x="-50" y="28" width="100" height="8" rx="4" fill="#8A5A33" />
      </g>
    </g>
  )
}

function Stuk({ v, kind }: { v: Versiersel; kind: ReactNode }) {
  return <g transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) scale(${v.schaal.toFixed(2)})`}>{kind}</g>
}

/** Eén stuk versiering: bomen wiegen, de molen draait, de schoorsteen rookt, de vijver rimpelt... */
export function Versiersel({ v }: { v: Versiersel }) {
  const d = traag(v.vertraging)
  switch (v.soort) {
    case 'boom': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="18" rx="20" ry="6" fill="rgba(0,0,0,.12)" />
      <g className="k-wieg" style={d}>
        <rect x="-5" y="-2" width="10" height="20" rx="3" fill="#8A5A33" />
        <circle cx="0" cy="-16" r="22" fill="#3E9A48" /><circle cx="-10" cy="-8" r="13" fill="#3E9A48" /><circle cx="11" cy="-9" r="13" fill="#358C40" />
        <circle cx="-7" cy="-22" r="7" fill="#57B05E" />
        {v.vertraging > 2.5 && <><circle cx="8" cy="-20" r="3.5" fill="#E53935" /><circle cx="-4" cy="-6" r="3.5" fill="#E53935" /></>}
      </g>
    </>} />
    case 'struik': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="8" rx="18" ry="5" fill="rgba(0,0,0,.1)" />
      <circle cx="-8" cy="0" r="10" fill="#4FA84F" /><circle cx="6" cy="-2" r="12" fill="#45A049" /><circle cx="0" cy="-8" r="9" fill="#5BB85E" />
    </>} />
    case 'bloemen': return <Stuk v={v} kind={<g className="k-knik" style={d}>
      {[[-10, 0, '#F48FB1'], [6, -6, '#FFE27A'], [12, 6, '#B388FF'], [-2, 10, '#FFFFFF']].map(([bx, by, k]) => (
        <g key={`${bx}`} transform={`translate(${bx} ${by})`}>
          <path d="M0 0v8" stroke="#3E9A48" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r="3.2" fill={k as string} />)}
          <circle r="2.2" fill="#F2B33D" />
        </g>
      ))}
    </g>} />
    case 'steen': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="6" rx="14" ry="4" fill="rgba(0,0,0,.12)" />
      <path d="M-14 6q-2-12 8-16q10-3 18 4q4 6-2 12z" fill="#B0B8C4" /><path d="M-6-6q6-3 12 1" stroke="#D5DBE3" strokeWidth="3" fill="none" />
    </>} />
    case 'paddenstoel': return <Stuk v={v} kind={<>
      <rect x="-4" y="-4" width="8" height="12" rx="3" fill="#FFF3E0" />
      <path d="M-14-2a14 11 0 0 1 28 0z" fill="#E53935" />
      <circle cx="-6" cy="-7" r="2.5" fill="#fff" /><circle cx="4" cy="-9" r="2" fill="#fff" /><circle cx="8" cy="-4" r="2" fill="#fff" />
    </>} />
    case 'molen': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="56" rx="46" ry="10" fill="rgba(0,0,0,.12)" />
      <path d="M-26 56L-16-20H16L26 56Z" fill="#FFF1DC" stroke="#D9B98C" strokeWidth="3" />
      <path d="M-22-18L0-46L22-18Z" fill="#C0533A" />
      <rect x="-9" y="28" width="18" height="28" rx="9" fill="#8A5A33" />
      <rect x="-8" y="0" width="16" height="14" rx="3" fill="#7CC8F5" />
      <g transform="translate(0 -22)">
        <g>
          {/* Draait rond de as (SMIL: draait om het midden van de molen, niet om het kader van de wieken) */}
          {!stil && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />}
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <rect x="-3" y="-70" width="6" height="66" fill="#8A5A33" />
              <rect x="3" y="-68" width="18" height="50" fill="#FFFFFF" stroke="#D9B98C" strokeWidth="2" />
            </g>
          ))}
        </g>
        <circle r="7" fill="#5B6472" />
      </g>
    </>} />
    case 'vijver': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="0" rx="78" ry="38" fill="#7CC8F5" stroke="#5AA8DC" strokeWidth="5" />
      <ellipse cx="-20" cy="-8" rx="26" ry="8" fill="#B3E0FB" opacity=".7" />
      {[0, 1.3, 2.6].map((t) => <ellipse key={t} cx="24" cy="8" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" className="k-rimpel" style={traag(t)} />)}
      <g className="k-eend" style={d}>
        <ellipse cx="0" cy="0" rx="13" ry="8" fill="#FFE27A" /><circle cx="9" cy="-8" r="6" fill="#FFE27A" />
        <path d="M14-8l6 2l-6 2z" fill="#F2994A" /><circle cx="10" cy="-9" r="1.5" fill="#1C2433" />
      </g>
      <g transform="translate(-56 -18)"><ellipse rx="14" ry="7" fill="#3E9A48" /><circle cx="4" cy="-2" r="4" fill="#F48FB1" /></g>
      {[-70, 66].map((rx) => <g key={rx} transform={`translate(${rx} 22)`}><path d="M0 0v-30M6 0v-24M-6 0v-22" stroke="#4F8A3C" strokeWidth="3" /><rect x="-2" y="-40" width="4" height="12" rx="2" fill="#8A5A33" /></g>)}
    </>} />
    case 'huisjes': return <Stuk v={v} kind={<>
      {[[-46, 8, '#F48FB1', '#FFF8E7'], [0, -6, '#7CC8F5', '#FFF1DC'], [46, 10, '#FFE27A', '#FFF8E7']].map(([hx, hy, dak, muur], i) => (
        <g key={i} transform={`translate(${hx} ${hy})`}>
          <ellipse cx="0" cy="28" rx="28" ry="6" fill="rgba(0,0,0,.12)" />
          <rect x="-20" y="-4" width="40" height="32" fill={muur as string} stroke="#D9B98C" strokeWidth="2" />
          <path d="M-26-2L0-26L26-2Z" fill={dak as string} />
          <rect x="-6" y="10" width="12" height="18" rx="6" fill="#8A5A33" />
          <rect x="8" y="2" width="8" height="8" fill="#7CC8F5" className={i === 1 ? 'k-licht' : undefined} />
          {i === 1 && <>
            <rect x="10" y="-28" width="8" height="14" fill="#B0533A" />
            {[0, 1.2, 2.4].map((t) => <circle key={t} cx="14" cy="-32" r="5" fill="#FFFFFF" className="k-rook" style={traag(t)} />)}
          </>}
        </g>
      ))}
      <path d="M-74 40h148" stroke="#C98B4E" strokeWidth="4" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-72 + i * 18} y="28" width="5" height="16" fill="#C98B4E" />)}
    </>} />
    case 'palm': return <Stuk v={v} kind={<>
      <ellipse cx="2" cy="4" rx="18" ry="5" fill="rgba(0,0,0,.12)" />
      <g className="k-wieg" style={d}>
        <path d="M0 4q6-24 2-44" stroke="#8A5A33" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M2-40q-20-8-28 6M2-40q20-8 28 6M2-40q-6-18-20-20M2-40q10-18 22-14M2-40q0-18 4-24" stroke="#2E9A45" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="-2" cy="-38" r="4" fill="#6D4C41" /><circle cx="5" cy="-37" r="4" fill="#6D4C41" />
      </g>
    </>} />
    case 'schelp': return <Stuk v={v} kind={<g><path d="M-10 4a10 10 0 0 1 20 0z" fill="#FFB6A3" /><path d="M0 4V-6M-5 4l-2-8M5 4l2-8" stroke="#E8846E" strokeWidth="1.5" /></g>} />
    case 'krab': return <Stuk v={v} kind={<g className="k-krab" style={d}>
      <ellipse cx="0" cy="0" rx="12" ry="8" fill="#E8584A" />
      <path d="M-10 2l-8 6M-10-1l-9 1M10 2l8 6M10-1l9 1" stroke="#E8584A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="-16" cy="-8" r="4" fill="#E8584A" /><circle cx="16" cy="-8" r="4" fill="#E8584A" />
      <circle cx="-4" cy="-8" r="2.5" fill="#fff" /><circle cx="4" cy="-8" r="2.5" fill="#fff" />
      <circle cx="-4" cy="-8" r="1.2" fill="#1C2433" /><circle cx="4" cy="-8" r="1.2" fill="#1C2433" />
    </g>} />
    case 'cactus': return <Stuk v={v} kind={<>
      <rect x="-6" y="-26" width="12" height="32" rx="6" fill="#4FA84F" />
      <path d="M-6-10h-6v-8M6-4h6v-10" stroke="#4FA84F" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="0" cy="-28" r="3" fill="#F48FB1" />
    </>} />
    case 'zandkasteel': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="34" rx="56" ry="10" fill="rgba(0,0,0,.1)" />
      <rect x="-44" y="-6" width="88" height="40" fill="#E9C46A" />
      {[-44, -4, 32].map((tx) => <g key={tx}><rect x={tx} y="-30" width="14" height="28" fill="#E2B85A" /><path d={`M${tx} -30h14l-7-10z`} fill="#D9A84A" /></g>)}
      <rect x="-10" y="10" width="20" height="24" rx="10" fill="#B8893A" />
      <path d="M3-40v-20" stroke="#8A5A33" strokeWidth="2.5" /><path d="M3-60l16 5l-16 5z" fill="#E53935" className="k-vlag" />
    </>} />
    case 'oase': return <Stuk v={v} kind={<>
      <ellipse rx="60" ry="26" fill="#5BBDE8" stroke="#3FA3D6" strokeWidth="4" />
      {[0, 1.5].map((t) => <ellipse key={t} cx="10" cy="4" rx="12" ry="5" fill="none" stroke="#fff" strokeWidth="2.5" className="k-rimpel" style={traag(t)} />)}
      <g transform="translate(-52 -12)" className="k-wieg" style={d}><path d="M0 0q6-24 2-44" stroke="#8A5A33" strokeWidth="7" fill="none" /><path d="M2-44q-20-8-28 6M2-44q20-8 28 6M2-44q-4-18-18-20M2-44q10-18 22-14" stroke="#2E9A45" strokeWidth="7" fill="none" strokeLinecap="round" /></g>
    </>} />
    case 'vuurtoren': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="34" ry="8" fill="rgba(0,0,0,.12)" />
      <path d="M-18 40L-10-36H10L18 40Z" fill="#FFFFFF" />
      {[20, -4, -28].map((ry) => <path key={ry} d={`M${-16 + (40 - ry) * 0.02} ${ry}h${32 - (40 - ry) * 0.04}v-10h${-32 + (40 - ry) * 0.04}z`} fill="#E53935" />)}
      <rect x="-12" y="-52" width="24" height="16" fill="#FFE27A" className="k-licht" />
      <path d="M-14-52L0-66L14-52Z" fill="#E53935" />
    </>} />
    case 'den': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="8" rx="18" ry="5" fill="rgba(0,0,0,.1)" />
      <g className="k-wieg" style={d}>
        <rect x="-4" y="-2" width="8" height="10" fill="#8A5A33" />
        <path d="M0-44l18 26h-8l12 18h-44l12-18h-8z" fill="#2E7D5B" />
        <path d="M0-44l9 13h-18zM-10-18h20l-4-5h-12zM-14 0h28l-5-6h-18z" fill="#FFFFFF" opacity=".9" />
      </g>
    </>} />
    case 'sneeuwhoop': return <Stuk v={v} kind={<path d="M-18 6q4-14 18-14q14 0 18 14z" fill="#FFFFFF" stroke="#D6E4F2" strokeWidth="2" />} />
    case 'sneeuwman': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="44" rx="36" ry="8" fill="rgba(0,0,0,.1)" />
      <circle cx="0" cy="24" r="24" fill="#fff" stroke="#D6E4F2" strokeWidth="2" /><circle cx="0" cy="-12" r="17" fill="#fff" stroke="#D6E4F2" strokeWidth="2" />
      <rect x="-12" y="-40" width="24" height="12" fill="#1C2433" /><rect x="-17" y="-30" width="34" height="5" fill="#1C2433" />
      <circle cx="-6" cy="-15" r="2" fill="#1C2433" /><circle cx="6" cy="-15" r="2" fill="#1C2433" /><path d="M0-10l12 3l-12 2z" fill="#F2994A" />
      <path d="M-14 2h28" stroke="#E53935" strokeWidth="6" strokeLinecap="round" />
      <g className="k-zwaai" style={d}><path d="M18 14l20-14" stroke="#8A5A33" strokeWidth="3" strokeLinecap="round" /></g>
    </>} />
    case 'ijsvijver': return <Stuk v={v} kind={<>
      <ellipse rx="74" ry="34" fill="#BFE3F7" stroke="#9ACDEA" strokeWidth="4" />
      <path d="M-40-6q20-10 40 0t40 0" stroke="#FFFFFF" strokeWidth="3" fill="none" className="k-glans" />
      <g className="k-schaats" style={d}><ellipse cx="0" cy="0" rx="10" ry="6" fill="#7EC8E3" /><circle cx="7" cy="-6" r="5" fill="#7EC8E3" /><path d="M11-6l5 1.5l-5 1.5z" fill="#F2B33D" /></g>
    </>} />
    case 'iglo': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="22" rx="52" ry="8" fill="rgba(0,0,0,.1)" />
      <path d="M-44 22a44 40 0 0 1 88 0z" fill="#FFFFFF" stroke="#C9DDEF" strokeWidth="3" />
      <path d="M-40 6h80M-30-8h60M-16-18h32M-22 22v-16M0 6v-14M22 22v-16" stroke="#D6E4F2" strokeWidth="2.5" />
      <path d="M-14 22a14 14 0 0 1 28 0z" fill="#5B6472" />
    </>} />
    case 'lolly': return <Stuk v={v} kind={<g className="k-wieg" style={d}>
      <rect x="-2" y="-8" width="4" height="30" fill="#FFFFFF" />
      <circle cx="0" cy="-20" r="16" fill={['#FF8A80', '#82B1FF', '#B9F6CA', '#FFD180'][Math.floor(v.vertraging) % 4]} />
      <path d="M-10-20a10 10 0 0 1 20 0a6 6 0 0 1-12 0a3 3 0 0 1 6 0" stroke="#FFFFFF" strokeWidth="3" fill="none" />
    </g>} />
    case 'snoepje': return <Stuk v={v} kind={<g className="k-glinster" style={d}>
      <path d="M-14-6l6 6l-6 6zM14-6l-6 6l6 6z" fill="#F48FB1" /><ellipse rx="9" ry="7" fill="#E91E63" /><path d="M-4-4l8 8" stroke="#fff" strokeWidth="2" />
    </g>} />
    case 'cupcake': return <Stuk v={v} kind={<>
      <path d="M-12 0h24l-4 16h-16z" fill="#F2B33D" /><circle cx="-6" cy="-4" r="8" fill="#FFF4FA" /><circle cx="6" cy="-4" r="8" fill="#FFF4FA" /><circle cx="0" cy="-10" r="8" fill="#FFF4FA" />
      <circle cx="0" cy="-18" r="4" fill="#E53935" />
    </>} />
    case 'taarthuis': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="56" ry="9" fill="rgba(0,0,0,.1)" />
      <rect x="-44" y="0" width="88" height="40" rx="6" fill="#FFE0B2" /><rect x="-44" y="0" width="88" height="10" fill="#F48FB1" />
      <rect x="-32" y="-30" width="64" height="32" rx="6" fill="#FFF4FA" /><rect x="-32" y="-30" width="64" height="9" fill="#B388FF" />
      <rect x="-9" y="16" width="18" height="24" rx="9" fill="#8D5A33" />
      {[-20, 0, 20].map((cx) => <g key={cx}><rect x={cx - 1.5} y="-46" width="3" height="16" fill="#FFE27A" /><ellipse cx={cx} cy="-50" rx="3" ry="5" fill="#FF9800" className="k-vlam" style={traag(cx / 10 + 2)} /></g>)}
    </>} />
    case 'snoepvijver': return <Stuk v={v} kind={<>
      <ellipse rx="72" ry="32" fill="#C77DFF" stroke="#A855F7" strokeWidth="4" />
      {[0, 1.4].map((t) => <ellipse key={t} cx="-10" cy="2" rx="12" ry="5" fill="none" stroke="#F3E8FF" strokeWidth="2.5" className="k-rimpel" style={traag(t)} />)}
      <circle cx="30" cy="-6" r="7" fill="#FFE27A" className="k-dobber" style={d} />
    </>} />
    case 'zuurstokpoort': return <Stuk v={v} kind={<>
      {[-34, 34].map((px) => <g key={px}><rect x={px - 6} y="-40" width="12" height="76" rx="6" fill="#FFFFFF" />
        {[-34, -18, -2, 14].map((py) => <path key={py} d={`M${px - 6} ${py}l12-8v6l-12 8z`} fill="#E53935" />)}</g>)}
      <path d="M-34-40a34 26 0 0 1 68 0" stroke="#E53935" strokeWidth="10" fill="none" />
      <path d="M-34-40a34 26 0 0 1 68 0" stroke="#FFFFFF" strokeWidth="10" fill="none" strokeDasharray="10 10" />
    </>} />
    case 'wolkenhuis': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="22" rx="60" ry="10" fill="rgba(0,0,0,.08)" />
      <g fill="#FFFFFF"><ellipse cx="0" cy="10" rx="54" ry="22" /><ellipse cx="-30" cy="0" rx="26" ry="20" /><ellipse cx="28" cy="-2" rx="28" ry="22" /></g>
      <rect x="-16" y="-26" width="32" height="26" fill="#FFE9A8" /><path d="M-22-26L0-46L22-26Z" fill="#E8772E" />
      <rect x="-5" y="-14" width="10" height="14" rx="5" fill="#8A5A33" /><rect x="8" y="-20" width="6" height="6" fill="#5DB7E8" />
    </>} />
    case 'regenboog': return <Stuk v={v} kind={<>
      {['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'].map((c, i) => <path key={c} d={`M${-58 + i * 6} 20a${58 - i * 6} ${58 - i * 6} 0 0 1 ${116 - i * 12} 0`} fill="none" stroke={c} strokeWidth="6" opacity=".85" />)}
      <g fill="#FFFFFF"><ellipse cx="-60" cy="22" rx="20" ry="11" /><ellipse cx="60" cy="22" rx="20" ry="11" /></g>
    </>} />
    case 'zonnepoort': return <Stuk v={v} kind={<>
      {[-34, 34].map((px) => <g key={px}><rect x={px - 6} y="-34" width="12" height="70" rx="6" fill="#FFFFFF" stroke="#BFE0F5" strokeWidth="2" /></g>)}
      <circle cx="0" cy="-48" r="18" fill="#FFD84D" className="k-glinster" style={d} />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x="-2" y="-76" width="4" height="9" rx="2" fill="#FFD84D" transform={`rotate(${i * 45} 0 -48)`} />)}
    </>} />
    case 'lantaarnhuis': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="36" rx="54" ry="9" fill="rgba(0,0,0,.18)" />
      <rect x="-36" y="-6" width="72" height="42" rx="4" fill="#8A6A4A" /><path d="M-44-6L0-40L44-6Z" fill="#5B3A2E" />
      <rect x="-8" y="12" width="16" height="24" rx="8" fill="#4A2E1E" />
      {[-24, 24].map((wx) => <rect key={wx} x={wx - 7} y="4" width="14" height="12" fill="#FFE27A" className="k-glinster" style={traag(wx / 20 + 1)} />)}
      <path d="M40 -4V-24" stroke="#4A2E1E" strokeWidth="3" /><rect x="34" y="-36" width="12" height="14" rx="3" fill="#FFB74D" className="k-glinster" style={d} />
    </>} />
    case 'maanvijver': return <Stuk v={v} kind={<>
      <ellipse rx="70" ry="30" fill="#1F2D55" stroke="#4A5E92" strokeWidth="4" />
      <circle cx="16" cy="-4" r="11" fill="#FFF3C4" opacity=".85" /><circle cx="21" cy="-7" r="9" fill="#1F2D55" />
      {[0, 1.4].map((t) => <ellipse key={t} cx="-18" cy="4" rx="12" ry="5" fill="none" stroke="#6E84C2" strokeWidth="2.5" className="k-rimpel" style={traag(t)} />)}
    </>} />
    case 'lichtjesboom': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="30" ry="7" fill="rgba(0,0,0,.18)" />
      <rect x="-6" y="18" width="12" height="22" fill="#5B3A1E" />
      <path d="M0-50L30 0H14L36 24H-36L-14 0H-30Z" fill="#1F6B4A" />
      {[[-10, -18], [12, -8], [-18, 12], [6, 14], [22, 18], [-2, -32]].map(([lx, ly], i) => <circle key={i} cx={lx} cy={ly} r="3.5" fill={['#FFE27A', '#FF8A80', '#80D8FF'][i % 3]} className="k-glinster" style={traag(i / 3)} />)}
    </>} />
    case 'blokkenkasteel': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="38" rx="56" ry="9" fill="rgba(0,0,0,.15)" />
      {[[-36, 10, '#E5484D'], [-12, 10, '#2F80C9'], [12, 10, '#F2C530'], [36, 10, '#43A047'], [-24, -14, '#F28C28'], [24, -14, '#8E5BD1'], [0, -14, '#E86FB0']].map(([bx, by, c], i) => (
        <rect key={i} x={(bx as number) - 12} y={by as number} width="24" height="24" rx="3" fill={c as string} stroke="rgba(0,0,0,.15)" strokeWidth="2" />
      ))}
      <path d="M-36-14L-24-34L-12-14ZM12-14L24-34L36-14Z" fill="#E5484D" /><path d="M0-14V-44" stroke="#5B3A1E" strokeWidth="3" /><path d="M0-44L16-38L0-32Z" fill="#F2C530" className="k-wieg" style={d} />
    </>} />
    case 'treintje': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="22" rx="70" ry="7" fill="rgba(0,0,0,.15)" />
      <path d="M-70 18H70" stroke="#8A5A33" strokeWidth="4" />
      <rect x="-64" y="-6" width="36" height="22" rx="4" fill="#43A047" /><rect x="-22" y="-6" width="36" height="22" rx="4" fill="#F2C530" />
      <rect x="20" y="-14" width="40" height="30" rx="4" fill="#E5484D" /><rect x="44" y="-30" width="10" height="16" fill="#33414F" /><rect x="26" y="-24" width="16" height="12" rx="2" fill="#2F80C9" />
      {[-56, -36, -14, 6, 28, 50].map((wx) => <circle key={wx} cx={wx} cy="18" r="6" fill="#33414F" />)}
      <circle cx="54" cy="-38" r="6" fill="#FFFFFF" opacity=".8" className="k-wieg" style={d} />
    </>} />
    case 'draaitol': return <Stuk v={v} kind={<g className="k-wieg" style={d}>
      <ellipse cx="0" cy="34" rx="22" ry="5" fill="rgba(0,0,0,.15)" />
      <path d="M0 32L-34 -4Q0 -26 34 -4Z" fill="#E86FB0" /><path d="M0 32L-34 -4Q-12 -12 0 -12Z" fill="#8E5BD1" /><path d="M0 32L34 -4Q12 -12 0 -12Z" fill="#F2C530" />
      <rect x="-4" y="-34" width="8" height="24" rx="3" fill="#5B3A1E" />
    </g>} />
    case 'blokje': return <Stuk v={v} kind={<g transform={`rotate(${(v.x * 7) % 30 - 15})`}><rect x="-11" y="-11" width="22" height="22" rx="3" fill={['#E5484D', '#2F80C9', '#F2C530', '#43A047'][Math.floor(v.x) % 4]} stroke="rgba(0,0,0,.15)" strokeWidth="2" /><text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFFFFF">{'ABC'[Math.floor(v.y) % 3]}</text></g>} />
    case 'knikker': return <Stuk v={v} kind={<g><circle r="7" fill="#2F80C9" /><path d="M-5 -2Q0 4 5 -2" stroke="#F2C530" strokeWidth="2" fill="none" /><circle cx="-2" cy="-3" r="2" fill="#FFFFFF" opacity=".7" /></g>} />
    case 'teddy': return <Stuk v={v} kind={<g className="k-wieg" style={d}><circle cx="-8" cy="-14" r="5" fill="#B5733A" /><circle cx="8" cy="-14" r="5" fill="#B5733A" /><circle cy="-8" r="10" fill="#C98A4A" /><ellipse cy="10" rx="11" ry="12" fill="#C98A4A" /><ellipse cy="-5" rx="4" ry="3" fill="#F2D3A8" /></g>} />
    case 'balletje': return <Stuk v={v} kind={<g><circle r="9" fill="#FFFFFF" /><path d="M-9 0A9 9 0 0 0 9 0Z" fill="#E5484D" /><path d="M-9 0H9" stroke="#33414F" strokeWidth="1.5" /></g>} />
    case 'paddenstoelhuis': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="50" ry="9" fill="rgba(0,0,0,.15)" />
      <path d="M-24 40V-2H24V40Z" fill="#FFF3E0" stroke="#E0C9A6" strokeWidth="2" />
      <path d="M-8 40V18a8 8 0 0 1 16 0V40Z" fill="#8A5A33" /><circle cx="14" cy="8" r="6" fill="#FFE27A" stroke="#8A5A33" strokeWidth="2" />
      <path d="M-52 2C-50 -40 50 -40 52 2C30 10 -30 10 -52 2Z" fill="#E53935" />
      <circle cx="-26" cy="-14" r="7" fill="#FFFFFF" /><circle cx="6" cy="-24" r="6" fill="#FFFFFF" /><circle cx="30" cy="-8" r="6" fill="#FFFFFF" /><circle cx="-6" cy="-4" r="4" fill="#FFFFFF" />
      <path d="M30 -30q4 -10 0 -18" stroke="#C9C2B8" strokeWidth="4" fill="none" strokeLinecap="round" className="k-wieg" style={d} />
    </>} />
    case 'holleboom': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="42" rx="44" ry="8" fill="rgba(0,0,0,.15)" />
      <path d="M-20 42C-18 20 -22 0 -16 -10H16C22 0 18 20 20 42Z" fill="#8A5A33" />
      <ellipse cx="0" cy="14" rx="9" ry="12" fill="#3A2412" />
      <g className="k-wieg" style={d}><circle cx="-2" cy="10" r="6" fill="#D9824A" /><circle cx="-4" cy="9" r="1.5" fill="#33414F" /><circle cx="1" cy="9" r="1.5" fill="#33414F" /></g>
      <circle cx="0" cy="-36" r="34" fill="#E07A2E" /><circle cx="-26" cy="-20" r="20" fill="#C2662D" /><circle cx="26" cy="-22" r="20" fill="#E8A33A" />
    </>} />
    case 'bladerhoop': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="16" rx="46" ry="8" fill="rgba(0,0,0,.12)" />
      <path d="M-44 16C-40 -14 40 -14 44 16Z" fill="#C2662D" />
      {[[-26, 4, '#E07A2E'], [-8, -6, '#E8A33A'], [12, -2, '#B5432B'], [28, 8, '#E07A2E'], [0, 8, '#F2C530']].map(([bx, by, c], i) => (
        <path key={i} d="M0-8C7-7 9 0 0 8C-9 0-7-7 0-8Z" transform={`translate(${bx} ${by}) rotate(${i * 40})`} fill={c as string} />
      ))}
      <g className="k-knik" style={d}><circle cx="30" cy="-10" r="9" fill="#8A6A4A" /><path d="M24 -16l-2 -6M30 -18v-6M36 -16l2 -6" stroke="#5B4430" strokeWidth="2" /><circle cx="37" cy="-9" r="1.5" fill="#1C2433" /></g>
    </>} />
    case 'herfstboom': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="18" rx="20" ry="6" fill="rgba(0,0,0,.12)" />
      <g className="k-wieg" style={d}>
        <rect x="-5" y="-2" width="10" height="20" rx="3" fill="#8A5A33" />
        <circle cx="0" cy="-16" r="22" fill={['#E07A2E', '#E8A33A', '#C2662D'][Math.floor(v.x) % 3]} /><circle cx="-10" cy="-8" r="13" fill="#D96B27" /><circle cx="11" cy="-9" r="13" fill="#E8A33A" />
      </g>
    </>} />
    case 'kerktoren': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="44" rx="34" ry="7" fill="rgba(0,0,0,.15)" />
      <rect x="-22" y="-10" width="44" height="54" fill="#E9DCC6" stroke="#B8A88C" strokeWidth="2" />
      <path d="M-26 -10L0 -70L26 -10Z" fill="#5B6B7A" /><path d="M0 -70V-86M-6 -80H6" stroke="#C9971A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="0" cy="10" r="11" fill="#FFFFFF" stroke="#33414F" strokeWidth="2" /><path d="M0 10V3M0 10L5 12" stroke="#33414F" strokeWidth="2" strokeLinecap="round" />
      <path d="M-8 44V30a8 8 0 0 1 16 0V44Z" fill="#8A5A33" />
    </>} />
    case 'dakpaard': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="30" rx="40" ry="7" fill="rgba(0,0,0,.15)" />
      <g className="k-knik" style={d}>
        <ellipse cx="-2" cy="4" rx="28" ry="14" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="2" />
        <path d="M-22 12V30M-10 14V30M10 14V30M20 12V30" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 -2C20 -18 30 -28 40 -24C46 -22 46 -14 40 -10L30 2Z" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="2" />
        <path d="M20 -4C18 -18 26 -28 34 -28C28 -20 26 -10 26 0Z" fill="#8A5A33" /><path d="M-30 0C-40 4 -42 14 -38 20" stroke="#8A5A33" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="38" cy="-18" r="2" fill="#33414F" /><path d="M-16 -8H10V-2H-16Z" fill="#E5484D" />
      </g>
    </>} />
    case 'groteschoorsteen': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="30" ry="6" fill="rgba(0,0,0,.15)" />
      <rect x="-20" y="-20" width="40" height="60" fill="#B5503A" /><rect x="-26" y="-28" width="52" height="12" rx="2" fill="#8E2A20" />
      <path d="M-20 0H20M-20 20H20M0 -16V0M-10 0V20M10 0V20M0 20V40" stroke="rgba(0,0,0,.18)" strokeWidth="2" />
      <g transform="translate(0 -40)"><rect x="-12" y="-10" width="24" height="18" rx="3" fill="#43A047" /><path d="M0 -10V8M-12 -1H12" stroke="#F2C530" strokeWidth="4" /></g>
      <path d="M14 -36q8 -10 0 -20q-8 -10 2 -20" stroke="#C9C2B8" strokeWidth="6" fill="none" strokeLinecap="round" className="k-wieg" style={d} />
    </>} />
    case 'schoorsteentje': return <Stuk v={v} kind={<g><rect x="-9" y="-16" width="18" height="22" fill="#B5503A" /><rect x="-12" y="-20" width="24" height="6" fill="#8E2A20" /><path d="M-9 -6H9M0 -14V-6" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" /></g>} />
    case 'dakraam': return <Stuk v={v} kind={<g><path d="M-14 8V-6L0 -16L14 -6V8Z" fill="#E9DCC6" stroke="#8E2A20" strokeWidth="2" /><rect x="-7" y="-6" width="14" height="12" fill="#FFE27A" stroke="#8A5A33" strokeWidth="1.5" /><path d="M0 -6V6M-7 0H7" stroke="#8A5A33" strokeWidth="1.5" /></g>} />
    case 'pakje': return <Stuk v={v} kind={<g className="k-knik" style={d}><rect x="-9" y="-8" width="18" height="15" rx="2" fill="#2F80C9" /><path d="M0 -8V7M-9 -1H9" stroke="#F2C530" strokeWidth="3" /><path d="M0 -8q-5 -6 -7 -1M0 -8q5 -6 7 -1" stroke="#F2C530" strokeWidth="2" fill="none" /></g>} />
    case 'pepernootje': return <Stuk v={v} kind={<g><circle r="6" fill="#B8732E" /><circle cx="-2" cy="-2" r="2" fill="#D9984F" /><circle cx="9" cy="5" r="4" fill="#B8732E" /></g>} />
    case 'blaadje': return <Stuk v={v} kind={<g className="k-knik" style={d}><path d="M0-10C9-9 12 0 0 10C-12 0-9-9 0-10Z" fill="#E07A2E" /><path d="M0-8V9" stroke="#B5432B" strokeWidth="1.5" /></g>} />
    case 'eikel': return <Stuk v={v} kind={<g><ellipse cy="3" rx="6" ry="8" fill="#C98A4B" /><path d="M-8-2Q-7-9 0-9Q7-9 8-2Q0 0-8-2Z" fill="#8A5A33" /><path d="M0-9q1-3 3-4" stroke="#6B4226" strokeWidth="2" fill="none" /></g>} />
    case 'lampionnetje': return <Stuk v={v} kind={<g className="k-wieg" style={d}>
      <path d="M0-24V-12" stroke="#4A2E1E" strokeWidth="2" /><ellipse cy="0" rx="10" ry="12" fill="#FF9F43" /><path d="M-10 0h20M0-12V12" stroke="#E07B1A" strokeWidth="1.5" /><circle r="4" fill="#FFE27A" opacity=".8" />
    </g>} />
    case 'wolkje': return <Stuk v={v} kind={<g className="k-wieg" style={d} fill="#FFFFFF"><ellipse cx="0" cy="0" rx="22" ry="10" /><ellipse cx="-10" cy="-6" rx="11" ry="9" /><ellipse cx="9" cy="-8" rx="13" ry="11" /></g>} />
    case 'sterretje': return <Stuk v={v} kind={<path className="k-glinster" style={d} d="M0-10l3 7l7 1l-5 5l1 7l-6-4l-6 4l1-7l-5-5l7-1z" fill="#FFE27A" />} />
    case 'zonnetje': return <Stuk v={v} kind={<g className="k-glinster" style={d}><circle r="9" fill="#FFD84D" />{Array.from({ length: 8 }, (_, i) => <rect key={i} x="-1.5" y="-17" width="3" height="6" rx="1.5" fill="#FFD84D" transform={`rotate(${i * 45})`} />)}</g>} />
    case 'veer': return <Stuk v={v} kind={<path d="M-4 8Q-16-8 2-16Q14-14 6 4Q2 8-4 8ZM-4 8L-10 16" fill="#FFFFFF" stroke="#BFE0F5" strokeWidth="2" />} />
    case 'speeldoosje': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="42" ry="7" fill="rgba(0,0,0,.2)" />
      <rect x="-40" y="0" width="80" height="40" rx="6" fill="#A8693A" /><rect x="-40" y="0" width="80" height="9" rx="4" fill="#C98A4B" />
      <path d="M-40 -2L-48 -34H48L40 -2Z" fill="#7A4524" opacity=".0" />
      <rect x="-36" y="-34" width="72" height="32" rx="4" fill="#C98A4B" stroke="#8A5A33" strokeWidth="2" />
      <circle cx="0" cy="-44" r="5" fill="#F4D7B8" /><path d="M0 -39V-24M-12 -24H12M0 -24L-10 -12M0 -24L10 -12" stroke="#E86A9B" strokeWidth="4" strokeLinecap="round" className="k-wieg" style={d} />
      <path d="M-14 -22Q0 -18 14 -22" stroke="#F2C530" strokeWidth="3" fill="none" />
      <circle cx="30" cy="22" r="4" fill="#F2C530" />
    </>} />
    case 'tandwielen': return <Stuk v={v} kind={<g className="k-wieg" style={d}>
      <circle cx="-14" cy="6" r="22" fill="none" stroke="#C9971A" strokeWidth="9" strokeDasharray="8 6" /><circle cx="-14" cy="6" r="15" fill="#E8C766" /><circle cx="-14" cy="6" r="5" fill="#8E2F3B" />
      <circle cx="20" cy="-12" r="14" fill="none" stroke="#B9892B" strokeWidth="7" strokeDasharray="6 5" /><circle cx="20" cy="-12" r="9" fill="#F2D88A" /><circle cx="20" cy="-12" r="3" fill="#8E2F3B" />
    </g>} />
    case 'notenstandaard': return <Stuk v={v} kind={<>
      <ellipse cx="0" cy="40" rx="24" ry="5" fill="rgba(0,0,0,.2)" />
      <path d="M0 -4V38M-14 40L0 32L14 40" stroke="#4A2E1E" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M-26 -4L26 -4L30 -40H-30Z" fill="#FFFDF5" stroke="#8A5A33" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-22 -30H24M-22 -24H24M-22 -18H24M-22 -12H24" stroke="#8A8574" strokeWidth="1.4" />
      <circle cx="-10" cy="-16" r="3.5" fill="#222" /><path d="M-7 -16V-30" stroke="#222" strokeWidth="2" /><circle cx="8" cy="-22" r="3.5" fill="#222" /><path d="M11 -22V-34" stroke="#222" strokeWidth="2" />
    </>} />
    case 'noot': return <Stuk v={v} kind={<g className="k-knik" style={d}><ellipse cx="-3" cy="6" rx="6" ry="4.5" fill="#F2C530" transform="rotate(-20 -3 6)" /><path d="M2 5V-12L9 -8" stroke="#F2C530" strokeWidth="3" fill="none" strokeLinecap="round" /></g>} />
    case 'tandwieltje': return <Stuk v={v} kind={<g><circle r="10" fill="none" stroke="#C9971A" strokeWidth="5" strokeDasharray="4 3" /><circle r="6" fill="#E8C766" /><circle r="2" fill="#8E2F3B" /></g>} />
    case 'kaarsje': return <Stuk v={v} kind={<g><rect x="-4" y="-6" width="8" height="16" rx="2" fill="#FFF3E0" /><path d="M0 -8Q-5 -14 0 -20Q5 -14 0 -8Z" fill="#FFB020" className="k-glinster" style={d} /></g>} />
    case 'notenbalkje': return <Stuk v={v} kind={<g stroke="#E8C766" strokeWidth="1.5" opacity=".85"><path d="M-16 -6H16M-16 -2H16M-16 2H16M-16 6H16" /><circle cx="-6" cy="2" r="2.4" fill="#E8C766" stroke="none" /><circle cx="8" cy="-2" r="2.4" fill="#E8C766" stroke="none" /></g>} />
    default: return null
  }
}

/** Wat er rondvliegt en schuift: schaduwen van wolkjes, vlinders, meeuwen, sneeuwvlokjes of glinsters. */
export function Leven({ w }: { w: KaartWereld }) {
  const b = w.tot - w.van
  const stijl: WereldStijl = w.stijl
  return (
    <g pointerEvents="none" aria-hidden="true">
      {/* Wolkschaduwen glijden traag over de wereld */}
      {[0, 1].map((i) => (
        <g key={i} className="k-wolkschaduw" style={{ ...traag(i * 22), '--k-ver': `${b}px` } as CSSProperties}>
          <g transform={`translate(${w.van - 200} ${140 + i * 260})`} opacity=".08">
            <ellipse rx="110" ry="40" fill="#1C2433" /><ellipse cx="70" cy="-20" rx="70" ry="34" fill="#1C2433" />
          </g>
        </g>
      ))}
      {(stijl === 'groen' || stijl === 'snoep') && [0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${w.van + b * (0.2 + i * 0.3)} ${90 + (i % 2) * 380})`}>
          <g className="k-vlinder-baan" style={traag(i * 2.3)}>
            <g className="k-vlinder">
              <ellipse cx="-5" cy="0" rx="6" ry="8" fill={['#F48FB1', '#FFE27A', '#B388FF'][i]} />
              <ellipse cx="5" cy="0" rx="6" ry="8" fill={['#F48FB1', '#FFE27A', '#B388FF'][i]} />
              <rect x="-1" y="-6" width="2" height="12" rx="1" fill="#1C2433" />
            </g>
          </g>
        </g>
      ))}
      {stijl === 'zand' && [0, 1].map((i) => (
        <g key={i} transform={`translate(${w.van + b * (0.3 + i * 0.4)} ${70 + i * 30})`}>
          <g className="k-vogel-baan" style={traag(i * 4)}>
            <path d="M-12 0q6-8 12 0q6-8 12 0" stroke="#5B6472" strokeWidth="3" fill="none" strokeLinecap="round" className="k-fladder" />
          </g>
        </g>
      ))}
      {stijl === 'sneeuw' && Array.from({ length: 18 }, (_, i) => (
        <circle key={i} cx={w.van + ((i * 151) % b)} cy="-10" r={2 + (i % 3)} fill="#FFFFFF" className="k-vlok" style={traag(i * 0.7)} />
      ))}
      {stijl === 'herfst' && Array.from({ length: 12 }, (_, i) => (
        <g key={i} transform={`translate(${w.van + ((i * 151) % b)} -10)`}>
          <path d="M0-6C5-5 7 0 0 6C-7 0-5-5 0-6Z" fill={['#E07A2E', '#E8A33A', '#C2662D'][i % 3]} className="k-vlok" style={traag(i * 0.9)} />
        </g>
      ))}
      {stijl === 'snoep' && Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M0-6l1.5 4.5L6 0l-4.5 1.5L0 6l-1.5-4.5L-6 0l4.5-1.5z" transform={`translate(${w.van + ((i * 173) % b)} ${30 + ((i * 89) % (H - 60))})`}
              fill="#FFFFFF" className="k-glinster" style={traag(i * 0.5)} />
      ))}
    </g>
  )
}

/** Drijvende wolkjes in de mist na de laatste wereld. */
export function Mistwolken({ x, breed }: { x: number; breed: number }) {
  return (
    <g pointerEvents="none" aria-hidden="true">
      {[[0.2, 140], [0.6, 300], [0.3, 470]].map(([fx, y], i) => (
        <g key={i} className="k-drijf" style={traag(i * 3)}>
          <g transform={`translate(${x + breed * fx} ${y})`} fill="#FFFFFF" opacity=".9">
            <ellipse rx="60" ry="26" /><ellipse cx="-40" cy="8" rx="38" ry="20" /><ellipse cx="44" cy="6" rx="40" ry="22" />
          </g>
        </g>
      ))}
    </g>
  )
}

/** Een eilandje met een zijkant, schuin van bovenaf gezien: zo lijkt elk levelplekje een stukje echte wereld. */
function Plateau({ top, zij, rx = 56, ry = 24, diep = 22 }: { top: string; zij: string; rx?: number; ry?: number; diep?: number }) {
  return <>
    <path d={`M${-rx} 0v${diep}a${rx} ${ry} 0 0 0 ${rx * 2} 0V0z`} fill={zij} />
    <path d={`M${-rx} ${diep * 0.5}a${rx} ${ry} 0 0 0 ${rx * 2} 0`} fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="3" />
    <ellipse rx={rx} ry={ry} fill={top} />
    <ellipse rx={rx} ry={ry} className="spring-land-rand" />
  </>
}
const Water = ({ kleur, rx = 74, ry = 32 }: { kleur: string; rx?: number; ry?: number }) => <>
  <ellipse cy="14" rx={rx} ry={ry} fill={kleur} />
  <ellipse cy="14" rx={rx - 8} ry={ry - 6} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2.5" strokeDasharray="14 18" className="k-golfjes" />
</>
const Den = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-3" y="-4" width="6" height="10" fill="#7A4E2D" />
    <path d="M0-44L-16-14H16zM0-30L-19 0H19z" fill="#2F8A3E" />
    <path d="M0-44L-16-14H0zM0-30L-19 0H0z" fill="#3FA34D" />
  </g>
)

/** Het plekje van een level op de kaart, als een klein 3D-eilandje in de stijl van het level: een grasheuvel,
 *  een bosje, een wolkeneiland, een strandje of een ijsberg. (0, 0) is het midden van de bovenkant. */
export function LevelLand({ stijl }: { stijl: string }) {
  switch (stijl) {
    case 'bos': return <g className="spring-land">
      <ellipse cy="30" rx="62" ry="18" fill="rgba(0,0,0,.15)" />
      <Plateau top="#4FA857" zij="#8A5A33" />
      <ellipse cx="-10" cy="4" rx="20" ry="8" fill="#5DBB63" />
      <Den x={-30} y={-2} s={1.1} /><Den x={30} y={-6} s={1.3} /><Den x={6} y={-14} s={0.8} />
      <circle cx="-38" cy="12" r="5" fill="#E53935" /><rect x="-39.5" y="12" width="3" height="6" fill="#FFF" />
    </g>
    case 'wolken': return <g className="spring-land">
      <ellipse cy="44" rx="54" ry="14" fill="rgba(0,0,0,.1)" />
      <g className="k-dobber">
        {/* Bolle wolkjes aan de onderkant, een vlakke bovenkant en een regenboog met twee wolkjes */}
        <ellipse cy="12" rx="56" ry="20" fill="#DCE9F6" />
        {[-42, -21, 0, 21, 42].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 22 : 16} r={i % 4 ? 15 : 12} fill="#DCE9F6" />)}
        <ellipse rx="56" ry="22" fill="#FFF" />
        <ellipse rx="56" ry="22" className="spring-land-rand" />
        <path d="M-44-2a26 30 0 0 1 52 0" fill="none" stroke="#F48FB1" strokeWidth="6" />
        <path d="M-38-2a20 23 0 0 1 40 0" fill="none" stroke="#FFE27A" strokeWidth="6" />
        <path d="M-32-2a14 16 0 0 1 28 0" fill="none" stroke="#81D4FA" strokeWidth="6" />
        <circle cx="-44" cy="-4" r="9" fill="#FFF" /><circle cx="-36" cy="-2" r="7" fill="#FFF" />
        <circle cx="4" cy="-4" r="9" fill="#FFF" /><circle cx="12" cy="-2" r="7" fill="#FFF" />
        <g className="k-glinster" style={traag(0.5)}><path d="M34-22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFE27A" /></g>
      </g>
    </g>
    case 'strand': return <g className="spring-land">
      <Water kleur="#4FB8E6" />
      <Plateau top="#F6D98F" zij="#D9AE62" rx={52} ry={22} diep={12} />
      <path d="M-46 6a52 22 0 0 0 30 14" fill="none" stroke="#FFF" strokeWidth="3" opacity=".8" />
      <g transform="translate(32 -2)">
        <path d="M0 0q-4-24 4-46" fill="none" stroke="#9C6B3C" strokeWidth="6" strokeLinecap="round" />
        <g className="k-wieg"><path d="M4-46q-20-8-30 6q14-12 30-6zM4-46q20-8 30 6q-14-12-30-6zM4-46q-6-18-22-20q16 4 22 20zM4-46q8-18 24-18q-16 6-24 18z" fill="#3FA34D" /></g>
      </g>
      <g transform="translate(-30 4)">
        <path d="M0 0v-34" stroke="#5B6472" strokeWidth="3" />
        <path d="M-22-30a22 12 0 0 1 44 0z" fill="#E53935" /><path d="M-8-30a8 12 0 0 1 16 0z" fill="#FFF" />
      </g>
      <circle cx="10" cy="14" r="4" fill="#F48FB1" />
    </g>
    case 'sneeuw': return <g className="spring-land">
      <Water kleur="#4F9FD8" rx={76} />
      <ellipse cy="16" rx="60" ry="24" fill="#8CC8EC" />
      <Plateau top="#F4FAFF" zij="#A9D2EE" rx={50} ry={21} diep={16} />
      {/* De punten van de ijsberg: links in het licht, rechts in de schaduw */}
      <path d="M-44-2L-26-46L-20-4z" fill="#FFF" /><path d="M-26-46L-6-2L-20-4z" fill="#BFDDF2" />
      <path d="M-2-6L22-72L20-4z" fill="#FFF" /><path d="M22-72L48-2L20-4z" fill="#9CC7E6" />
      <path d="M14-50L22-72L30-50L22-56z" fill="#E3F2FC" />
      <path d="M-32-24L-26-46L-22-26z" fill="#E3F2FC" />
      <g transform="translate(-30 8)">
        <ellipse cy="2" rx="8" ry="3" fill="rgba(0,0,0,.12)" />
        <ellipse cy="-9" rx="7" ry="10" fill="#263238" /><ellipse cy="-7" rx="4.5" ry="7" fill="#FFF" />
        <circle cx="-2" cy="-14" r="1.3" fill="#263238" /><circle cx="2" cy="-14" r="1.3" fill="#263238" />
        <path d="M-2-11h4l-2 3z" fill="#FFA000" />
      </g>
      <g className="k-glinster" style={traag(1)}><path d="M36-34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFF" /></g>
    </g>
    default: return <g className="spring-land">
      <ellipse cy="30" rx="62" ry="18" fill="rgba(0,0,0,.15)" />
      <Plateau top="#7ACB6E" zij="#9C6B43" />
      <path d="M-46 0q16-40 40-6z" fill="#5DBB63" /><path d="M-46 0q12-30 22-26q-8 10-6 24z" fill="#6FC66F" />
      <circle cx="30" cy="-34" r="10" fill="#FFE27A" className="k-glinster" />
      <g transform="translate(26 6)"><path d="M0 0v-14" stroke="#8D6E4A" strokeWidth="3" /><path d="M0-14h20v-10H0z" fill="#E53935" /></g>
      {[[-20, 12], [8, 14], [40, 2], [-36, 6]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}><circle r="3.5" fill={['#F48FB1', '#FFE27A', '#B39DDB', '#FFF'][i]} /><circle r="1.4" fill="#FFB300" /></g>
      ))}
    </g>
  }
}
