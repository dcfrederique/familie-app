import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { figuurtjeVan } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { springBesturing, springLevels, springVolgorde, type SpringBesturing, type SpringLevel } from '../data/springen.ts'
import { zin } from '../data/zinnen.ts'
import { tekenFiguurtje, volledigeUitsnede } from '../lib/figuurtje/tekenen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, levelAf, levelUitgespeeld, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { gepakt, springPunten, totaal, type Springen as SpringStand } from '../lib/spelletjes/springen.ts'
import { SpringVeld } from '../lib/spelletjes/springenVeld.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './springen.css'

// Springland: lopen en springen met je eigen figuurtje door drie levels (docs/spelletjes.md).
export default function Springen() {
  return (
    <SpelKader titel="Springland" vol terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <SpringScherm kind={kind} />}
    </SpelKader>
  )
}

const SLOT = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'

/** Klein prentje per level voor op de keuzeknop (eigen tekening). */
function LevelPrent({ level }: { level: SpringLevel }) {
  if (level === 'weide') return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <rect width="120" height="90" rx="14" fill="#BFE6FF" />
      <circle cx="96" cy="22" r="11" fill="#FFE27A" />
      <ellipse cx="34" cy="78" rx="46" ry="30" fill="#A6DE9B" />
      <rect y="66" width="120" height="24" fill="#5DBB63" />
      <path d="M58 52l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#F2B33D" />
      <circle cx="86" cy="60" r="6" fill="#E53935" />
    </svg>
  )
  if (level === 'bos') return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <rect width="120" height="90" rx="14" fill="#DDF2D8" />
      <rect x="22" y="30" width="8" height="40" fill="#8A5A33" /><circle cx="26" cy="28" r="16" fill="#3E9A48" />
      <rect x="88" y="26" width="8" height="44" fill="#8A5A33" /><circle cx="92" cy="24" r="18" fill="#2E8A40" />
      <rect y="66" width="120" height="24" fill="#3E9A48" />
      <rect x="44" y="44" width="30" height="7" rx="3" fill="#7A4B2A" />
      <path d="M56 64a10 7 0 0 1 20 0z" fill="#6D4C41" />
    </svg>
  )
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <rect width="120" height="90" rx="14" fill="#FFD9EC" />
      {['#FF8A80', '#FFD180', '#B9F6CA', '#82B1FF'].map((k, i) => (
        <path key={k} d={`M${20 + i * 5} 80a${40 - i * 5} ${40 - i * 5} 0 0 1 ${80 - i * 10} 0`} fill="none" stroke={k} strokeWidth="5" />
      ))}
      <ellipse cx="34" cy="72" rx="26" ry="12" fill="#fff" /><ellipse cx="90" cy="56" rx="20" ry="9" fill="#fff" />
    </svg>
  )
}

function SpringScherm({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [besturing, setBesturing] = useState<SpringBesturing>(() =>
    gekozenNiveau(kind.id, 'springen', lezer ? 'zelf' : 'vanzelf', Object.keys(springBesturing)))
  const [level, setLevel] = useState<SpringLevel | null>(null)
  const [stand, setStand] = useState<SpringStand | null>(null)
  const [klaar, setKlaar] = useState<SpringStand | null>(null)
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veld = useRef<SpringVeld | null>(null)
  const begin = useRef(Date.now())
  const figuurSvg = useMemo(() => {
    const [, , b, h] = volledigeUitsnede.split(' ').map(Number)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${volledigeUitsnede}" width="${b * 2}" height="${h * 2}">${tekenFiguurtje(figuurtjeVan(kind), 'springfig')}</svg>`
  }, [kind])

  // Een level is open als het vorige uitgespeeld is (onthouden op dit toestel, zoals de records).
  const isOpen = (l: SpringLevel) => springVolgorde.indexOf(l) === 0 || levelUitgespeeld(kind.id, springVolgorde[springVolgorde.indexOf(l) - 1])

  useEffect(() => { if (!lezer && !level) leesVoor(zin.springenKiezen) }, [lezer, level])

  useEffect(() => {
    if (!level) return
    const v = new SpringVeld(canvas.current!, figuurSvg, {
      opStand: setStand,
      opKlaar: (s) => {
        const punten = springPunten(s)
        levelAf(kind.id, s.level)
        setNieuwRecord(recordBewaren(kind.id, `springen-${s.level}`, punten, true))
        setKlaar(s)
        setTimeout(geluid.hoera, 200)
        if (!lezer) setTimeout(() => leesVoor(zin.springenKlaar), 700)
        // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
        void bron?.activiteitOpslaan(kind.id, 'springen', { titel: springLevels[s.level].naam, punten },
          Math.max(1, Math.round((Date.now() - begin.current) / 1000))).catch(() => {})
      },
    })
    veld.current = v
    begin.current = Date.now()
    v.start(level, besturing)
    if (!lezer) leesVoor(besturing === 'vanzelf' ? zin.springenUitleg : zin.springenZelf)
    return () => { v.stop(); veld.current = null }
    // Alleen een ander level bouwt het veld opnieuw op; Nog eens herstart het veld zelf (opnieuw).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  function kies(l: SpringLevel) {
    if (!isOpen(l)) { geluid.oei(); if (!lezer) leesVoor(zin.springenDicht); return }
    setKlaar(null); setStand(null); setNieuwRecord(false); setLevel(l)
  }
  function opnieuw() {
    if (!level) return
    setKlaar(null); setNieuwRecord(false)
    begin.current = Date.now()
    veld.current?.start(level, besturing)
  }
  const volgende = level && springVolgorde[springVolgorde.indexOf(level) + 1]

  if (!level) {
    return (
      <div className="dier-keuze spring-keuze">
        <Chips label="Lopen" opties={springBesturing} gekozen={besturing}
               kies={(b) => { setBesturing(b); niveauBewaren(kind.id, 'springen', b) }} />
        <div className="dier-rij">
          {springVolgorde.map((l) => {
            const open = isOpen(l)
            const best = record(kind.id, `springen-${l}`)
            return (
              <button key={l} type="button" className={`dier-knop spring-level${open ? '' : ' dicht'}`}
                      aria-label={open ? springLevels[l].naam : `${springLevels[l].naam}, nog op slot`} onClick={() => kies(l)}>
                <LevelPrent level={l} />
                {!open && (
                  <svg className="ic spring-slot" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d={SLOT} /></svg>
                )}
                {lezer && <span className="display">{springLevels[l].naam}</span>}
                {best !== null && <span className="spring-best"><Ster grootte={22} /> {best}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const knop = (naam: 'links' | 'rechts') => ({
    onPointerDown: (e: ReactPointerEvent) => { e.preventDefault(); veld.current?.zetKnop(naam, true) },
    onPointerUp: () => veld.current?.zetKnop(naam, false),
    onPointerLeave: () => veld.current?.zetKnop(naam, false),
    onPointerCancel: () => veld.current?.zetKnop(naam, false),
  })

  return (
    <div className="penalty spring">
      <div className="spel-boven">
        <button type="button" className="chip" onClick={() => { setLevel(null); setKlaar(null) }} aria-label="Ander level">
          <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" /></svg>
          {lezer && ` ${springLevels[level].naam}`}
        </button>
        <div className="spel-score display" aria-live="polite">
          <Ster grootte={28} /> {stand ? gepakt(stand) : 0}<small> / {stand ? totaal(stand) : 0}</small>
        </div>
      </div>

      <div className="spel-veld spring-veld">
        <canvas ref={canvas} aria-label={besturing === 'vanzelf' ? 'Springland: tik om te springen' : 'Springland: pijltjes om te lopen, knop om te springen'} />
        {!klaar && (
          <div className="spring-knoppen">
            {besturing === 'zelf' ? (
              <div className="spring-pijlen">
                <button type="button" className="spring-knop" aria-label="Naar links" {...knop('links')}>
                  <svg className="ic" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" className="spring-knop" aria-label="Naar rechts" {...knop('rechts')}>
                  <svg className="ic" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            ) : <span />}
            <button type="button" className="spring-knop spring-hop" aria-label="Springen"
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); veld.current?.springNu() }}>
              <svg className="ic" viewBox="0 0 24 24" width="52" height="52" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6" /></svg>
            </button>
          </div>
        )}
        {klaar && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Thuis!">
            <h2 className="display klaar-titel">{lezer ? 'Je bent thuis!' : 'Hoera!'}</h2>
            <p className="klaar-uitleg spring-uitslag">
              <Ster grootte={30} /> {gepakt(klaar)} / {totaal(klaar)}
              {lezer && nieuwRecord && <span> · nieuw record!</span>}
            </p>
            {volgende && (
              <button type="button" className="groot-knop spring-volgende" aria-label="Volgend level" onClick={() => kies(volgende)}>
                <LevelPrent level={volgende} />
                {lezer && 'Volgend level'}
              </button>
            )}
            <EindKnoppen kind={kind} opnieuw={opnieuw} />
          </div>
        )}
      </div>
    </div>
  )
}
