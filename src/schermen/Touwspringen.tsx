import { useEffect, useRef, useState } from 'react'
import { figuurtjeVan } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { volledigeUitsnede } from '../lib/figuurtje/tekenen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { hoogte, LEVENS, nieuwTouw, spring, stap, touwNiveaus, type Touw, type TouwNiveau } from '../lib/spelletjes/touw.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import Figuurtje from './Figuurtje.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import { zin } from '../data/zinnen.ts'

export default function Touwspringen() {
  return (
    <SpelKader titel="Touwspringen" vol terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <Speelplaats kind={kind} />}
    </SpelKader>
  )
}

const HART = 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'
const uitleg = zin.touwUitleg

// Maten in de tekening (viewBox 0 0 600 420). Het figuurtje zelf heeft viewBox -4 -12 208 302.
const GROND = 384
const SCHAAL = 0.95
const FIG_B = 208 * SCHAAL, FIG_H = 302 * SCHAAL
const FIG_X = 300 - FIG_B / 2
const SPRONG = 110
const naarTekening = (fx: number, fy: number, figY: number) => ({ x: FIG_X + (fx + 4) * SCHAAL, y: figY + (fy + 12) * SCHAAL })

function Speelplaats({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [niveau, setNiveau] = useState<TouwNiveau>(() => gekozenNiveau(kind.id, 'touwspringen', lezer ? 'normaal' : 'traag', Object.keys(touwNiveaus)))
  const [touw, setTouw] = useState<Touw>(() => nieuwTouw(niveau))
  const [fase, setFase] = useState<'start' | 'springen' | 'klaar'>('start')
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const stand = useRef(touw)
  const raf = useRef(0)
  const begin = useRef(Date.now())

  useEffect(() => { if (!lezer) leesVoor(uitleg) }, [lezer])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  function start() {
    cancelAnimationFrame(raf.current)
    stand.current = nieuwTouw(niveau)
    setTouw(stand.current)
    setFase('springen')
    setNieuwRecord(false)
    begin.current = Date.now()
    let laatst = performance.now()
    const beeld = (nu: number) => {
      const { touw: na, gebeurtenissen } = stap(stand.current, Math.min(0.05, (nu - laatst) / 1000))
      laatst = nu
      stand.current = na
      setTouw(na)
      for (const g of gebeurtenissen) {
        if (g === 'sprong') {
          geluid.draai()
          if (!lezer && na.sprongen <= 20) leesVoor(String(na.sprongen))
        }
        if (g === 'struikel') geluid.oei()
      }
      if (na.gedaan) return klaar(na)
      raf.current = requestAnimationFrame(beeld)
    }
    raf.current = requestAnimationFrame(beeld)
  }

  function klaar(t: Touw) {
    setFase('klaar')
    setNieuwRecord(t.sprongen > 0 && recordBewaren(kind.id, `touwspringen-${t.niveau}`, t.sprongen, true))
    geluid.hoera()
    if (!lezer) leesVoor(`Hoera, ${t.sprongen} keer gesprongen!`)
    // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
    void bron?.activiteitOpslaan(kind.id, 'touwspringen', { punten: t.sprongen, niveau: t.niveau },
      (Date.now() - begin.current) / 1000).catch(() => {})
  }

  function tik() {
    if (fase !== 'springen') return
    stand.current = spring(stand.current)
  }

  // Touw: een boog tussen de twee handen; boven het hoofd of onder de voeten, vooraan of achteraan.
  const figY = GROND - FIG_H + 4 - hoogte(touw) * SPRONG
  const links = naarTekening(40, 192, figY), rechts = naarTekening(160, 192, figY)
  const top = figY - 26, onder = figY + FIG_H + 8
  const c = Math.cos(touw.hoek)
  const apex = c >= 0 ? links.y - c * (links.y - top) : links.y - c * (onder - links.y)
  const touwPad = `M${links.x} ${links.y}Q300 ${2 * apex - links.y} ${rechts.x} ${rechts.y}`
  const vooraan = Math.sin(touw.hoek) > 0
  const touwLijn = <path d={touwPad} fill="none" stroke="#E46AA8" strokeWidth="7" strokeLinecap="round" />
  const best = record(kind.id, `touwspringen-${niveau}`)

  return (
    <div className="penalty">
      <div className="spel-boven">
        <Chips label="Snelheid" opties={touwNiveaus} gekozen={niveau}
               kies={(n) => { if (fase === 'springen') return; setNiveau(n); niveauBewaren(kind.id, 'touwspringen', n) }} />
        <div className="harten" role="img" aria-label={`${touw.levens} levens`}>
          {Array.from({ length: LEVENS }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
              <path d={HART} fill={i < touw.levens ? '#E53935' : 'var(--line)'} />
            </svg>
          ))}
        </div>
        <div className="spel-score display" aria-live="polite">{touw.sprongen} <small>{touw.sprongen === 1 ? 'sprong' : 'sprongen'}</small></div>
      </div>

      <div className="spel-veld touw-veld" onPointerDown={tik} onKeyDown={(e) => { if (e.key === ' ') tik() }} tabIndex={0}
           role="button" aria-label="Tik om te springen">
        <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <circle cx="520" cy="70" r="40" fill="#F2C230" />
          <rect x="-200" y={GROND} width="1000" height="200" fill="#5DBB63" />
          <ellipse cx="300" cy={GROND + 6} rx={70 - hoogte(touw) * 25} ry="9" fill="rgba(0,0,0,.18)" />
          {!vooraan && touwLijn}
          <g transform={touw.pauze > 0 ? `rotate(-8 300 ${GROND})` : undefined}>
            <svg x={FIG_X} y={figY} width={FIG_B} height={FIG_H} viewBox={volledigeUitsnede} overflow="visible">
              <Figuurtje figuurtje={figuurtjeVan(kind)} />
            </svg>
          </g>
          {vooraan && touwLijn}
        </svg>
        <div className="touw-teller display" aria-hidden="true">{touw.sprongen}</div>
        {fase === 'start' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Start">
            {lezer && <p className="klaar-uitleg">{uitleg}</p>}
            <button type="button" className="groot-knop" onPointerDown={(e) => e.stopPropagation()} onClick={start} aria-label="Start">
              <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
              {lezer && 'Start'}
            </button>
          </div>
        )}
        {fase === 'klaar' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Uitslag" onPointerDown={(e) => e.stopPropagation()}>
            <h2 className="display klaar-titel">{touw.sprongen} keer gesprongen!</h2>
            {lezer && <p className="klaar-uitleg">{nieuwRecord ? 'Nieuw record!' : best !== null ? `Record: ${best}` : ''}</p>}
            <EindKnoppen kind={kind} opnieuw={start} />
          </div>
        )}
      </div>
    </div>
  )
}
