import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { figuurtjeVan } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { springBesturing, springLevels, springVolgorde, type SpringBesturing, type SpringLevel } from '../data/springen.ts'
import { zin } from '../data/zinnen.ts'
import { tekenFiguurtje, volledigeUitsnede } from '../lib/figuurtje/tekenen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import {
  gekozenNiveau, levelAf, levelUitgespeeld, niveauBewaren, record, recordBewaren, springPlek, springPlekBewaren,
} from '../lib/spelletjes/opslag.ts'
import { gepakt, springPunten, totaal, type Springen as SpringStand } from '../lib/spelletjes/springen.ts'
import { SpringVeld } from '../lib/spelletjes/springenVeld.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { useProef } from '../lib/proef.tsx'
import { Ster } from './onderdelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import SpringKaart, { StijlIcoon } from './SpringKaart.tsx'
import './springen.css'

// Springland: lopen en springen met je eigen figuurtje, level na level op een landkaart met werelden (docs/springland.md).
export default function Springen() {
  return (
    <SpelKader titel="Springland" vol terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <SpringScherm kind={kind} />}
    </SpelKader>
  )
}

/** Springland voor een ouder op de gsm (ouderdeel Wij → Springland): met het eigen figuurtje uit de chat, eigen
 *  voortgang op die gsm, en niets in het activiteitlog van een kind. */
export function OuderSpringland() {
  const { account, gebruikers } = useSessie()
  const id = account?.ouder_id ?? gebruikers.find((g) => g.rol === 'ouder')?.id
  const ouder = gebruikers.find((g) => g.id === id && g.rol === 'ouder')
  // Op een kindtablet niet: daar speelt het kind met zijn eigen figuurtje.
  if (!ouder || account?.soort === 'tablet') return <Navigate to="/ouder" replace />
  return (
    <SpelKader titel="Springland" vol speler={ouder} terug={() => '/ouder'}>
      {(o) => <SpringScherm kind={o} ouder />}
    </SpelKader>
  )
}

/** Icoontje van een opengevouwen landkaart. */
const KAART = 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'

function SpringScherm({ kind, ouder = false }: { kind: Gebruiker; ouder?: boolean }) {
  const proef = useProef().actief
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [besturing, setBesturing] = useState<SpringBesturing>(() =>
    gekozenNiveau(kind.id, 'springen', lezer ? 'zelf' : 'vanzelf', Object.keys(springBesturing)))
  const [level, setLevel] = useState<SpringLevel | null>(null)
  const [stand, setStand] = useState<SpringStand | null>(null)
  const [klaar, setKlaar] = useState<SpringStand | null>(null)
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const [plek, setPlek] = useState(() => springPlek(kind.id, springVolgorde))
  /** Na Volgend level: op de kaart meteen naar dat level wandelen en het starten. */
  const [meteenNaar, setMeteenNaar] = useState<SpringLevel | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veld = useRef<SpringVeld | null>(null)
  const begin = useRef(Date.now())
  const figuurSvg = useMemo(() => {
    const [, , b, h] = volledigeUitsnede.split(' ').map(Number)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${volledigeUitsnede}" width="${b * 2}" height="${h * 2}">${tekenFiguurtje(figuurtjeVan(kind), 'springfig')}</svg>`
  }, [kind])
  const figuurUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(figuurSvg)}`, [figuurSvg])
  // Uitgespeelde levels worden op dit toestel onthouden, zoals de records; bij proberen door een ouder niets.
  const isAf = (l: SpringLevel) => levelUitgespeeld(kind.id, l)

  useEffect(() => { if (!lezer && !level) leesVoor(zin.springenKiezen) }, [lezer, level])

  useEffect(() => {
    if (!level) return
    const v = new SpringVeld(canvas.current!, figuurSvg, {
      opStand: setStand,
      opGebeurtenis: (g) => {
        if (lezer) return
        if (g === 'weer') leesVoor(zin.springenWeer)
        if (g === 'verslagen') leesVoor(zin.springenBaasKlaar)
      },
      opKlaar: (s) => {
        const punten = springPunten(s)
        if (!proef) {
          levelAf(kind.id, s.level)
          setNieuwRecord(recordBewaren(kind.id, `springen-${s.level}`, punten, true))
        }
        setKlaar(s)
        setTimeout(geluid.hoera, 200)
        if (!lezer) setTimeout(() => leesVoor(zin.springenKlaar), 700)
        // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders (een ouder die zelf speelt niet).
        if (!ouder) void bron?.activiteitOpslaan(kind.id, 'springen', { titel: springLevels[s.level].naam, punten },
          Math.max(1, Math.round((Date.now() - begin.current) / 1000))).catch(() => {})
      },
    })
    veld.current = v
    begin.current = Date.now()
    v.start(level, besturing)
    if (!lezer) leesVoor(springLevels[level].baas ? zin.springenBaas : besturing === 'vanzelf' ? zin.springenUitleg : zin.springenZelf)
    return () => { v.stop(); veld.current = null }
    // Alleen een ander level bouwt het veld opnieuw op; Nog eens herstart het veld zelf (opnieuw).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  function start(l: SpringLevel) {
    setMeteenNaar(null); setKlaar(null); setStand(null); setNieuwRecord(false); setLevel(l)
  }
  function naarKaart(volgend: SpringLevel | null = null) {
    setLevel(null); setKlaar(null); setMeteenNaar(volgend)
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
      <div className="spring-kaart-scherm spring-scherm">
        <Draai />
        <Chips label="Lopen" opties={springBesturing} gekozen={besturing}
               kies={(b) => { setBesturing(b); niveauBewaren(kind.id, 'springen', b) }} />
        <SpringKaart figuur={figuurUrl} lezer={lezer} af={isAf} best={(l) => record(kind.id, `springen-${l}`)} alles={proef}
                     plek={plek} meteenNaar={meteenNaar} opStart={start} opDicht={() => { if (!lezer) leesVoor(zin.springenDicht) }}
                     opPlek={(l) => { setPlek(l); if (!proef) springPlekBewaren(kind.id, l) }} />
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
    <div className="penalty spring spring-scherm">
      <Draai />
      <div className="spel-boven">
        <button type="button" className="chip" onClick={() => naarKaart()} aria-label="Naar de kaart">
          <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={KAART} /></svg>
          {lezer && ` ${springLevels[level].naam}`}
        </button>
        <div className="spring-levens" role="img" aria-label={stand ? `${stand.levens} van ${stand.maxLevens} hartjes` : undefined}>
          {Array.from({ length: stand?.maxLevens ?? 0 }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" width="36" height="36" className={`spring-hart${i < (stand?.levens ?? 0) ? '' : ' leeg'}`} aria-hidden="true">
              <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" />
            </svg>
          ))}
          {stand?.baas && !stand.baas.verslagen && (
            <span className="spring-baas-teller" role="img" aria-label={`Baas: nog ${stand.baas.nodig - stand.baas.geraakt} keer`}>
              {Array.from({ length: stand.baas.nodig }, (_, i) => <i key={i} className={i < stand.baas!.geraakt ? 'af' : ''} />)}
            </span>
          )}
        </div>
        <div className="spel-score display" aria-live="polite">
          <Ster grootte={28} /> {stand ? gepakt(stand) : 0}<small> / {stand ? totaal(stand) : 0}</small>
        </div>
      </div>

      <div className="spel-veld spring-veld" onContextMenu={(e) => e.preventDefault()}>
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
            <h2 className="display klaar-titel">{lezer ? (springLevels[level].baas ? 'Baas verslagen!' : 'Je bent thuis!') : 'Hoera!'}</h2>
            <p className="klaar-uitleg spring-uitslag">
              <Ster grootte={30} /> {gepakt(klaar)} / {totaal(klaar)}
              {lezer && nieuwRecord && <span> · nieuw record!</span>}
            </p>
            {volgende && (
              <button type="button" className="groot-knop spring-volgende" aria-label="Volgend level" onClick={() => naarKaart(volgende)}>
                <svg viewBox="-24 -24 48 48" aria-hidden="true"><StijlIcoon stijl={springLevels[volgende].stijl} /></svg>
                {lezer && (springLevels[volgende].wereld === springLevels[level].wereld ? 'Volgend level' : 'Nieuwe wereld!')}
              </button>
            )}
            <EindKnoppen kind={kind} opnieuw={opnieuw} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Op een gsm rechtop: vraag om de gsm te draaien (alleen zichtbaar via springen.css). */
function Draai() {
  return (
    <div className="spring-draai" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="64" height="64"><rect x="7" y="2" width="10" height="18" rx="2" /><path d="M20 14a8 8 0 0 1-6 7.5M14 21.5l1.6-2.6M14 21.5l2.8.9" /></svg>
      <p>Draai je gsm</p>
    </div>
  )
}
