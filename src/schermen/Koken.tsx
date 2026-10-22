import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { ingredienten, recepten, type ReceptSleutel } from '../data/recepten.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { doeErin, hoekVerschil, kookNiveaus, nieuweBestelling, ROER_RONDES, type Bestelling, type KookNiveau } from '../lib/spelletjes/koken.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'

export default function Koken() {
  return (
    <SpelKader titel="Koken" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <Keuken kind={kind} />}
    </SpelKader>
  )
}

const VINK = 'M5 12l5 5L20 7'
const alleIngredienten = Object.keys(ingredienten)

function Ingredient({ id }: { id: string }) {
  return <svg viewBox="0 0 48 48" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ingredienten[id].tekening }} />
}

/** De pan met wat er al in zit. `draai` laat alles meedraaien met het roeren. */
function Pan({ erin, draai = 0 }: { erin: string[]; draai?: number }) {
  return (
    <svg viewBox="0 0 300 210" className="pan" aria-hidden="true">
      <rect x="262" y="78" width="36" height="16" rx="8" fill="#3A4250" />
      <path d="M30 76h240v34a80 80 0 0 1-80 80h-80a80 80 0 0 1-80-80z" fill="#5B6472" />
      <ellipse cx="150" cy="76" rx="120" ry="24" fill="#3A4250" />
      <ellipse cx="150" cy="78" rx="108" ry="18" fill={erin.length ? '#F1D3A8' : '#2B3240'} />
      {erin.map((id, i) => {
        const a = (i / Math.max(1, erin.length)) * Math.PI * 2 + draai
        const x = 150 + Math.cos(a) * 62 - 22, y = 78 + Math.sin(a) * 9 - 30
        return <g key={id} className="in-pan" transform={`translate(${x} ${y}) scale(.92)`} dangerouslySetInnerHTML={{ __html: ingredienten[id].tekening }} />
      })}
    </svg>
  )
}

function Keuken({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [niveau, setNiveau] = useState<KookNiveau>(() => gekozenNiveau(kind.id, 'koken', lezer ? 'groot' : 'klein', Object.keys(kookNiveaus)))
  const [recept, setRecept] = useState<ReceptSleutel | null>(null)
  const [bestelling, setBestelling] = useState<Bestelling | null>(null)
  const [fase, setFase] = useState<'kiezen' | 'verzamelen' | 'roeren' | 'klaar'>('kiezen')
  const [verborgen, setVerborgen] = useState(false)
  const [schudt, setSchudt] = useState<string | null>(null)
  const [geroerd, setGeroerd] = useState(0)
  const [lepel, setLepel] = useState<{ x: number; y: number } | null>(null)
  const roerVlak = useRef<HTMLDivElement>(null)
  const vorigeHoek = useRef<number | null>(null)
  const begin = useRef(Date.now())
  const geluidKlok = useRef(0)

  useEffect(() => {
    if (lezer) return
    if (fase === 'kiezen') leesVoor('Wat ga je koken?')
    if (fase === 'verzamelen') leesVoor('Zoek wat er op het kaartje staat.')
    if (fase === 'roeren') leesVoor('Roer maar goed rond!')
  }, [fase, lezer])

  // Chef: het kaartje verdwijnt na een paar tellen.
  useEffect(() => {
    const na = kookNiveaus[niveau].verbergNa
    if (fase !== 'verzamelen' || na === null) return
    const t = window.setTimeout(() => setVerborgen(true), na * 1000)
    return () => window.clearTimeout(t)
  }, [fase, niveau, recept])

  function kiesRecept(r: ReceptSleutel) {
    setRecept(r)
    setBestelling(nieuweBestelling(recepten[r].ingredienten, alleIngredienten, niveau))
    setVerborgen(false)
    setGeroerd(0)
    setFase('verzamelen')
    begin.current = Date.now()
    if (!lezer) leesVoor(recepten[r].naam)
  }

  function pak(id: string) {
    if (!bestelling) return
    const { bestelling: na, zet } = doeErin(bestelling, id)
    setBestelling(na)
    if (!lezer) leesVoor(ingredienten[id].naam)
    if (zet === 'fout') {
      geluid.oei()
      setSchudt(id)
      window.setTimeout(() => setSchudt(null), 450)
    } else if (zet === 'goed') geluid.paar()
    else if (zet === 'klaar') {
      geluid.hoera()
      window.setTimeout(() => setFase('roeren'), 700)
    }
  }

  function roer(e: PointerEvent<HTMLDivElement>) {
    const r = roerVlak.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    setLepel({ x, y })
    if (!e.buttons && e.pointerType === 'mouse') { vorigeHoek.current = null; return }
    const hoek = Math.atan2(y - r.height * 0.42, x - r.width / 2)
    if (vorigeHoek.current !== null) {
      const totaal = geroerd + Math.abs(hoekVerschil(vorigeHoek.current, hoek))
      setGeroerd(totaal)
      if (Date.now() - geluidKlok.current > 300) { geluidKlok.current = Date.now(); geluid.draai() }
      if (totaal >= ROER_RONDES * 2 * Math.PI) klaar()
    }
    vorigeHoek.current = hoek
  }

  function klaar() {
    if (!recept) return
    setFase('klaar')
    vorigeHoek.current = null
    geluid.hoera()
    if (!lezer) leesVoor(recepten[recept].zeg)
    // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
    void bron?.activiteitOpslaan(kind.id, 'koken', { titel: recepten[recept].naam, niveau },
      (Date.now() - begin.current) / 1000).catch(() => {})
  }

  if (fase === 'kiezen' || !recept || !bestelling) {
    return (
      <div className="dier-keuze">
        <Chips label="Moeilijkheid" opties={kookNiveaus} gekozen={niveau} kies={(n) => { setNiveau(n); niveauBewaren(kind.id, 'koken', n) }} />
        {lezer && <h2 className="display">Wat ga je koken?</h2>}
        <div className="dier-rij">
          {(Object.keys(recepten) as ReceptSleutel[]).map((r) => (
            <button key={r} type="button" className="dier-knop recept-knop" aria-label={recepten[r].naam} onClick={() => kiesRecept(r)}>
              <svg viewBox="0 0 200 140" aria-hidden="true" dangerouslySetInnerHTML={{ __html: recepten[r].tekening }} />
              {lezer && <span className="display">{recepten[r].naam}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (fase === 'klaar') {
    return (
      <div className="dier-keuze kook-klaar">
        <svg viewBox="0 0 200 140" className="gerecht" role="img" aria-label={recepten[recept].naam}
             dangerouslySetInnerHTML={{ __html: recepten[recept].tekening }} />
        {lezer && <h2 className="display klaar-titel">{recepten[recept].zeg}</h2>}
        <EindKnoppen kind={kind} opnieuw={() => setFase('kiezen')} />
      </div>
    )
  }

  if (fase === 'roeren') {
    const deel = Math.min(1, geroerd / (ROER_RONDES * 2 * Math.PI))
    return (
      <div className="kook-roeren">
        {lezer && <p className="was-uitleg">Roer {ROER_RONDES} keer rond in de pan!</p>}
        <div ref={roerVlak} className="roer-vlak" onPointerMove={roer} onPointerDown={roer}
             onPointerUp={() => { vorigeHoek.current = null }} onPointerLeave={() => { vorigeHoek.current = null; setLepel(null) }}>
          <Pan erin={bestelling.erin} draai={geroerd} />
          {lepel && (
            <svg className="lepel" viewBox="0 0 40 120" style={{ left: lepel.x - 20, top: lepel.y - 100 }} aria-hidden="true">
              <ellipse cx="20" cy="100" rx="16" ry="20" fill="#C9A06A" /><rect x="15" y="0" width="10" height="90" rx="5" fill="#B07A50" />
            </svg>
          )}
        </div>
        <div className="spel-balk groot" role="img" aria-label={`${Math.round(deel * 100)} procent geroerd`}>
          <span style={{ width: `${Math.round(deel * 100)}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="kook">
      <div className="recept-kaart" aria-label={`Recept: ${recepten[recept].naam}`}>
        {lezer && <h2 className="display">{recepten[recept].naam}</h2>}
        <div className="recept-lijst">
          {bestelling.nodig.map((id) => {
            const erin = bestelling.erin.includes(id)
            return (
              <span key={id} className={`recept-ding${erin ? ' erin' : ''}`} aria-label={verborgen && !erin ? 'Nog te zoeken' : ingredienten[id].naam}>
                {verborgen && !erin ? <b className="display">?</b> : <Ingredient id={id} />}
                {erin && <svg className="ic vink" viewBox="0 0 24 24" aria-hidden="true"><path d={VINK} /></svg>}
              </span>
            )
          })}
        </div>
      </div>
      <div className="kook-rechts">
        <Pan erin={bestelling.erin} />
        <div className="kast" role="group" aria-label="Kast">
          {bestelling.kast.map((id) => {
            const erin = bestelling.erin.includes(id)
            return (
              <button key={id} type="button" className={`kast-ding${erin ? ' weg' : ''}${schudt === id ? ' schud' : ''}`}
                      aria-label={ingredienten[id].naam} disabled={erin} onClick={() => pak(id)}>
                <Ingredient id={id} />
                {lezer && <span>{ingredienten[id].naam}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
