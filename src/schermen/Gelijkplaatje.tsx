import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { gelijkInstellingen, type GelijkNiveau, type GelijkVorm } from '../data/gelijkplaatje.ts'
import { gelijkNiveaus, startGelijkNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { nieuwSpel, plaatjeLook, pluimen, tijdLimiet, tijdOp, tik, volgende, type GelijkSpel, type Geplaatst } from '../lib/spelletjes/gelijkplaatje.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './twin.css'

const RAND = 'rgba(0,0,0,.45)'

/** Een plaatje (eigen ontwerp): acht vormen, elk in een kleur. */
function Vorm({ vorm, kleur }: { vorm: GelijkVorm; kleur: string }) {
  const stijl = { fill: kleur, stroke: RAND, strokeWidth: 3, strokeLinejoin: 'round' as const }
  switch (vorm) {
    case 'ster': {
      const punten = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 20 : 44
        return `${(50 + Math.cos(a) * r).toFixed(1)},${(52 + Math.sin(a) * r).toFixed(1)}`
      }).join(' ')
      return <polygon points={punten} {...stijl} />
    }
    case 'hart': return <path d="M50 88C20 66 10 46 10 32C10 18 22 10 34 10C42 10 48 15 50 22C52 15 58 10 66 10C78 10 90 18 90 32C90 46 80 66 50 88Z" {...stijl} />
    case 'pakje': return (
      <g>
        <rect x="16" y="32" width="68" height="54" rx="6" {...stijl} />
        <path d="M50 32V86M16 58H84" stroke="#fff" strokeWidth="7" opacity=".85" />
        <path d="M50 32C34 8 20 24 50 32C80 24 66 8 50 32Z" fill="#fff" stroke={RAND} strokeWidth="2.5" strokeLinejoin="round" opacity=".92" />
      </g>
    )
    case 'mijter': return (
      <g>
        <path d="M22 88L30 42Q50 4 70 42L78 88Z" {...stijl} />
        <path d="M26 72H74" stroke="#fff" strokeWidth="6" opacity=".85" />
        <path d="M50 28V58M40 42H60" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".9" />
      </g>
    )
    case 'klok': return (
      <g>
        <path d="M50 10C34 10 26 26 26 44C26 60 20 68 12 78H88C80 68 74 60 74 44C74 26 66 10 50 10Z" {...stijl} />
        <circle cx="50" cy="88" r="8" {...stijl} />
        <path d="M36 30Q40 22 46 20" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" />
      </g>
    )
    case 'maan': return <path d="M62 10A42 42 0 1 0 90 62A32 32 0 0 1 62 10Z" {...stijl} />
    case 'vlok': return (
      <g strokeLinecap="round">
        <path d="M50 10V90M15 30L85 70M15 70L85 30" stroke={RAND} strokeWidth="13" fill="none" />
        <path d="M50 10V90M15 30L85 70M15 70L85 30" stroke={kleur} strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="9" fill={kleur} stroke={RAND} strokeWidth="3" />
      </g>
    )
    case 'koek': return (
      <g>
        <path d="M50 34C34 34 22 36 12 46L19 57C27 51 34 49 38 49V60L27 89L42 91L50 73L58 91L73 89L62 60V49C66 49 73 51 81 57L88 46C78 36 66 34 50 34Z" {...stijl} />
        <circle cx="50" cy="20" r="14" {...stijl} />
        <g fill="#fff"><circle cx="45" cy="18" r="2.2" /><circle cx="55" cy="18" r="2.2" /><circle cx="50" cy="52" r="2.6" /><circle cx="50" cy="62" r="2.6" /></g>
        <path d="M44 25Q50 29 56 25" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </g>
    )
  }
}

/** Plekken (middelpunt in procenten van de kaart) voor 3, 4 of 6 plaatjes. */
function plekken(n: number): [number, number][] {
  if (n <= 3) return [90, 210, 330].slice(0, n).map((h) => [50 + 27 * Math.cos((h * Math.PI) / 180), 50 - 27 * Math.sin((h * Math.PI) / 180)])
  if (n === 4) return [45, 135, 225, 315].map((h) => [50 + 25 * Math.cos((h * Math.PI) / 180), 50 - 25 * Math.sin((h * Math.PI) / 180)])
  const ring = [90, 162, 234, 306, 18].map((h): [number, number] => [50 + 31 * Math.cos((h * Math.PI) / 180), 50 - 31 * Math.sin((h * Math.PI) / 180)])
  return [[50, 50], ...ring]
}

function Kaart({ niveau, lijst, wiebel, goed, uit, onTik }: {
  niveau: GelijkNiveau; lijst: Geplaatst[]; wiebel: number | null; goed: number | null; uit: boolean; onTik: (p: number) => void
}) {
  const pl = plekken(lijst.length)
  const basis = lijst.length >= 6 ? 27 : lijst.length === 4 ? 33 : 34
  return (
    <div className="twin-kaart">
      {lijst.map((g, i) => {
        const look = plaatjeLook(niveau, g.plaatje)
        const grootte = (basis * g.grootte) / 100
        return (
          <button key={g.plaatje} type="button" disabled={uit}
                  className={`twin-plaatje${wiebel === g.plaatje ? ' wip' : ''}${goed === g.plaatje ? ' goed' : ''}`}
                  style={{ left: `${pl[i][0]}%`, top: `${pl[i][1]}%`, ['--g' as string]: grootte.toFixed(3) }}
                  aria-label={`${look.vorm}`} onClick={() => onTik(g.plaatje)}>
            <svg viewBox="0 0 100 100" aria-hidden="true" style={{ rotate: `${g.draai}deg` }}><Vorm vorm={look.vorm} kleur={look.kleur} /></svg>
          </button>
        )
      })}
    </div>
  )
}

export default function Gelijkplaatje() {
  return (
    <SpelKader titel="Gelijk plaatje" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <PlaatjesScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function PlaatjesScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<GelijkNiveau>(() => gekozenNiveau(kind.id, 'gelijkplaatje', startGelijkNiveau(kind, kinderen), Object.keys(gelijkNiveaus)))
  const [spel, setSpel] = useState<GelijkSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const [feest, setFeest] = useState<number | null>(null)
  const [wiebel, setWiebel] = useState<number | null>(null)
  const [tipsOver, setTipsOver] = useState(() => gelijkInstellingen[niveau].tips)
  const [rest, setRest] = useState(1)
  const [begin, setBegin] = useState(() => Date.now())
  const eind = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const inst = gelijkInstellingen[niveau]
  const limiet = tijdLimiet(niveau, spel.nr)

  function bewaar(na: GelijkSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.gelijkplaatjeUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function klaarMelden(vol: GelijkSpel) {
    if (!lezer) wacht(400, () => leesVoor(zin.gelijkplaatjeKlaar))
    // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
    void bron?.activiteitOpslaan(kind.id, 'gelijkplaatje', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
    void vol
  }
  function verder(na: GelijkSpel, pauze: number) {
    wacht(pauze, () => {
      const vol = volgende(na, rand)
      bewaar(vol); setFeest(null); setWiebel(null)
      if (vol.klaar) klaarMelden(vol)
    })
  }

  // Moeilijk: een tijdsbalk per ronde. Tijd op telt als fout en er komt meteen een nieuwe ronde.
  useEffect(() => {
    if (limiet === null || spel.klaar || feest !== null) return
    eind.current = Date.now() + limiet * 1000
    setRest(1)
    const t = setInterval(() => {
      const over = (eind.current - Date.now()) / (limiet * 1000)
      setRest(Math.max(0, over))
      if (over <= 0) {
        clearInterval(t)
        geluid.oei(); setFeest(-1)
        const na = tijdOp(spelRef.current)
        bewaar(na); verder(na, 700)
      }
    }, 80)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spel.nr, spel.klaar, limiet, feest === null])

  // Makkelijk: na acht seconden zonder tik wiebelt het juiste plaatje op beide kaarten.
  useEffect(() => {
    setWiebel(null)
    if (!inst.hulpNa || spel.klaar || feest !== null) return
    const t = setTimeout(() => setWiebel(spelRef.current.ronde.gelijk), inst.hulpNa * 1000)
    return () => clearTimeout(t)
  }, [inst.hulpNa, spel.nr, spel.fouten, spel.klaar, feest])

  function opnieuw(nv: GelijkNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    bewaar(nieuwSpel(nv, rand)); setTipsOver(gelijkInstellingen[nv].tips); setFeest(null); setWiebel(null); setBegin(Date.now())
  }
  function kiesNiveau(nv: GelijkNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'gelijkplaatje', nv); opnieuw(nv) }

  function tikken(plaatje: number) {
    if (feest !== null || spel.klaar) return
    const { spel: na, goed } = tik(spelRef.current, plaatje)
    bewaar(na)
    if (goed) {
      geluid.paar(); setFeest(plaatje); setWiebel(null)
      if (na.uitslag.length >= inst.rondes) geluid.hoera()
      verder(na, 900)
    } else {
      geluid.oei()
      // Een fout kost op moeilijk twee seconden van de balk; elders alleen een wiebel.
      if (inst.straf) eind.current -= inst.straf * 1000
      else { setWiebel(plaatje); wacht(700, () => setWiebel(null)) }
    }
  }
  function tipKnop() {
    if (feest !== null || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); setWiebel(spelRef.current.ronde.gelijk); wacht(2500, () => setWiebel(null))
  }

  const ronde = spel.ronde
  const pl = pluimen(spel)
  const totaal = pl.reduce((a, b) => a + b, 0)
  const maxPluimen = pl.length * 3
  return (
    <div className={`twin twin-${niveau}`}>
      <Chips label="Niveau" opties={gelijkNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {spel.klaar ? (
        <div className="twin-eind">
          <div className="twin-feest" aria-hidden="true">{['ster', 'hart', 'pakje'].map((v, i) => <svg key={v} viewBox="0 0 100 100"><Vorm vorm={v as GelijkVorm} kleur={['#F2C530', '#E5484D', '#2F80C9'][i]} /></svg>)}</div>
          <div className="hoera display">{lezer ? 'Je hebt ze allemaal gevonden!' : 'Hoera!'}</div>
          {niveau === 'moeilijk' && (
            <div className="twin-pluimen" aria-label={`${totaal} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaal ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="twin-balk">
            <div className="twin-teller" aria-label={`Ronde ${spel.nr + 1} van ${inst.rondes}`}>
              {Array.from({ length: inst.rondes }, (_, i) => <span key={i} className={i < spel.uitslag.length ? (spel.uitslag[i] ? 'af' : 'mis') : i === spel.nr ? 'nu' : ''} />)}
            </div>
            {limiet !== null && (
              <div className="twin-tijd" role="progressbar" aria-label="Tijd" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rest * 100)}>
                <div className={`twin-tijdvol${rest < 0.3 ? ' laag' : ''}`} style={{ width: `${rest * 100}%` }} />
              </div>
            )}
            {inst.tips > 0 && <button type="button" className="groot-knop twin-tip" onClick={tipKnop} disabled={feest !== null || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
          </div>
          <div className="twin-tafel" key={spel.nr}>
            <Kaart niveau={niveau} lijst={ronde.a} wiebel={wiebel} goed={feest} uit={feest !== null} onTik={tikken} />
            <Kaart niveau={niveau} lijst={ronde.b} wiebel={wiebel} goed={feest} uit={feest !== null} onTik={tikken} />
          </div>
        </>
      )}
    </div>
  )
}
