import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import {
  startVerkleedNiveau, verkleedNiveaus, verkleedRondes,
  type Attribuut, type Hoed, type Mantel, type VerkleedNiveau, type VerkleedRij,
} from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { huidige, isKlaar, kies, klaar, nieuwSpel, rijen, type VerkleedSpel } from '../lib/spelletjes/verkleed.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './verkleed.css'

const mantelKleur: Record<Mantel, { vol: string; rand: string }> = {
  paars: { vol: '#7A4FC0', rand: '#5B3A93' }, rood: { vol: '#D8452B', rand: '#A82F1C' }, blauw: { vol: '#2D6BD6', rand: '#1F4FA3' },
  geel: { vol: '#F2B33D', rand: '#C48A12' }, groen: { vol: '#3DAA55', rand: '#2A7F3F' },
}
const naam: Record<string, string> = {
  puntmuts: 'Puntmuts', piratenhoed: 'Piratenhoed', helm: 'Helm', kroon: 'Kroon', tovenaarshoed: 'Tovenaarshoed',
  paars: 'Paarse mantel', rood: 'Rode mantel', blauw: 'Blauwe mantel', geel: 'Gele mantel', groen: 'Groene mantel',
  bezem: 'Bezem', zwaard: 'Zwaard', schild: 'Schild', scepter: 'Scepter', toverstaf: 'Toverstaf',
}

/** Eigen tekeningen (vlakke vormen) van de hoeden, passend op een hoofd met middelpunt (60, 52). */
function HoedTekening({ soort }: { soort: Hoed }) {
  switch (soort) {
    case 'puntmuts': return (<><path d="M38 40L60 -8L82 40Z" fill="#3B2A5B" /><ellipse cx={60} cy={40} rx={36} ry={7} fill="#2B1E45" /><rect x={44} y={28} width={32} height={6} fill="#F2B33D" /></>)
    case 'piratenhoed': return (<><path d="M24 42Q34 6 60 14Q86 6 96 42Q60 30 24 42Z" fill="#2B2B2B" /><path d="M60 18l3 6l7 1l-5 4l1 7l-6 -4l-6 4l1 -7l-5 -4l7 -1z" fill="#F2B33D" /></>)
    case 'helm': return (<><path d="M33 46Q33 12 60 12Q87 12 87 46Z" fill="#A9B4C2" /><path d="M54 12Q60 -6 66 12Z" fill="#D8452B" /><rect x={33} y={40} width={54} height={8} rx={3} fill="#7C8794" /><path d="M60 28V40" stroke="#7C8794" strokeWidth={4} strokeLinecap="round" /></>)
    case 'kroon': return (<><path d="M36 38L38 8L50 24L60 2L70 24L82 8L84 38Z" fill="#F2B33D" stroke="#C48A12" strokeWidth={2} strokeLinejoin="round" /><circle cx={60} cy={28} r={4} fill="#D8452B" /></>)
    case 'tovenaarshoed': return (<><path d="M38 40L56 -10Q60 -14 64 -10L82 40Z" fill="#1F3A7A" /><ellipse cx={60} cy={40} rx={34} ry={7} fill="#162B5E" /><path d="M56 16l2 4l4 1l-3 3l1 4l-4 -2l-4 2l1 -4l-3 -3l4 -1z" fill="#F2D24E" /><circle cx={50} cy={30} r={2} fill="#F2D24E" /><circle cx={70} cy={26} r={2} fill="#F2D24E" /></>)
  }
}

/** Voorwerpen in de rechterhand, in hetzelfde kader (poppetje 120 × 200). */
function VoorwerpTekening({ soort }: { soort: Attribuut }) {
  switch (soort) {
    case 'bezem': return (<><path d="M100 196L108 84" stroke="#8A5A33" strokeWidth={6} strokeLinecap="round" /><path d="M94 150L122 150L128 196L92 196Z" fill="#E8C14A" /><path d="M100 160V196M108 160V196M116 160V196" stroke="#C89A2A" strokeWidth={3} /></>)
    case 'zwaard': return (<><path d="M104 40L112 40L112 150L108 158L104 150Z" fill="#C6CFD9" stroke="#8793A1" strokeWidth={2} /><rect x={94} y={150} width={28} height={7} rx={3} fill="#F2B33D" /><rect x={104} y={157} width={8} height={26} rx={3} fill="#8A5A33" /></>)
    case 'schild': return (<><path d="M86 100H124V138Q124 164 105 176Q86 164 86 138Z" fill="#2D6BD6" stroke="#1F4FA3" strokeWidth={3} /><path d="M105 100V176M86 132H124" stroke="#fff" strokeWidth={5} /></>)
    case 'scepter': return (<><path d="M106 70V190" stroke="#C48A12" strokeWidth={6} strokeLinecap="round" /><circle cx={106} cy={62} r={12} fill="#F2B33D" stroke="#C48A12" strokeWidth={3} /><circle cx={106} cy={62} r={4} fill="#D8452B" /></>)
    case 'toverstaf': return (<><path d="M100 194L112 80" stroke="#2B2B2B" strokeWidth={6} strokeLinecap="round" /><path d="M114 56l5 11l12 1l-9 8l3 12l-11 -7l-11 7l3 -12l-9 -8l12 -1z" fill="#F2D24E" stroke="#C48A12" strokeWidth={2} strokeLinejoin="round" /></>)
  }
}

/** Het poppetje: wat nog niet gekozen is, blijft leeg (grijs hemdje, geen hoed, geen voorwerp). */
function Poppetje({ hoed, mantel, voorwerp }: { hoed?: string; mantel?: string; voorwerp?: string }) {
  const m = mantel ? mantelKleur[mantel as Mantel] : { vol: '#D9DEE6', rand: '#B5BCC8' }
  return (
    <svg className="verkleed-poppetje" viewBox="0 -16 140 232" aria-hidden="true">
      {voorwerp && <VoorwerpTekening soort={voorwerp as Attribuut} />}
      <rect x={42} y={186} width={14} height={20} rx={5} fill="#5B4636" /><rect x={64} y={186} width={14} height={20} rx={5} fill="#5B4636" />
      <path d="M34 80Q60 70 86 80L98 190H22Z" fill={m.vol} stroke={m.rand} strokeWidth={3} strokeLinejoin="round" />
      <path d="M60 78V190" stroke={m.rand} strokeWidth={3} opacity={0.5} />
      <circle cx={27} cy={104} r={8} fill="#F5D3B8" /><circle cx={93} cy={104} r={8} fill="#F5D3B8" />
      <circle cx={60} cy={54} r={26} fill="#F5D3B8" />
      <circle cx={50} cy={52} r={3} fill="#1C2433" /><circle cx={70} cy={52} r={3} fill="#1C2433" />
      <path d="M50 64Q60 72 70 64" stroke="#1C2433" strokeWidth={3} strokeLinecap="round" fill="none" />
      <circle cx={44} cy={62} r={4} fill="#F2A7A0" opacity={0.6} /><circle cx={76} cy={62} r={4} fill="#F2A7A0" opacity={0.6} />
      {hoed && <HoedTekening soort={hoed as Hoed} />}
    </svg>
  )
}

/** Een deel op zichzelf, voor op de keuzeknop. */
function DeelTekening({ rij, waarde }: { rij: VerkleedRij; waarde: string }) {
  if (rij === 'hoed') return <svg className="verkleed-deel" viewBox="14 -16 92 68" aria-hidden="true"><HoedTekening soort={waarde as Hoed} /></svg>
  if (rij === 'voorwerp') return <svg className="verkleed-deel" viewBox="76 36 66 168" aria-hidden="true"><VoorwerpTekening soort={waarde as Attribuut} /></svg>
  const m = mantelKleur[waarde as Mantel]
  return <svg className="verkleed-deel" viewBox="0 0 120 100" aria-hidden="true"><path d="M30 16Q60 6 90 16L108 92H12Z" fill={m.vol} stroke={m.rand} strokeWidth={4} strokeLinejoin="round" /><path d="M60 14V92" stroke={m.rand} strokeWidth={4} opacity={0.5} /></svg>
}

export default function Verkleed() {
  return (
    <SpelKader titel="Verkleedkist" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <VerkleedScherm kind={kind} />}
    </SpelKader>
  )
}

function VerkleedScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<VerkleedNiveau>(() =>
    gekozenNiveau(kind.id, 'verkleed', startVerkleedNiveau(kind, kinderen), Object.keys(verkleedNiveaus)))
  const [spel, setSpel] = useState<VerkleedSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [fout, setFout] = useState<VerkleedRij[]>([])
  const [wip, setWip] = useState(0)
  const [danst, setDanst] = useState(false)
  const [tip, setTip] = useState(false)
  const [zichtbaar, setZichtbaar] = useState(true)
  // Telt elk nieuw spel, zodat de timers ook opnieuw starten als niets anders veranderde.
  const [nummer, setNummer] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const ronde = huidige(spel)
  const af = isKlaar(spel)
  const verberg = verkleedNiveaus[niveau].verberg

  useEffect(() => { if (!lezer) leesVoor(zin.verkleedUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Op moeilijk verdwijnt het voorbeeld na een tijdje; de oogknop toont het weer even.
  useEffect(() => {
    setZichtbaar(true)
    if (!verberg || af) return
    const t = setTimeout(() => setZichtbaar(false), verberg)
    return () => clearTimeout(t)
  }, [spel.ronde, verberg, af, nummer])
  useEffect(() => {
    setTip(false)
    if (af) return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [spel.ronde, spel.gekozen, spel.misser, af, nummer])

  function opnieuw(nv: VerkleedNiveau = niveau) {
    clearTimeout(timer.current)
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setFout([]); setDanst(false); setNummer((n) => n + 1)
  }
  function kiesNiveau(nv: VerkleedNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'verkleed', nv); opnieuw(nv) }
  function tikDeel(rij: VerkleedRij, waarde: string) {
    if (danst) return
    setFout((f) => f.filter((x) => x !== rij)); setSpel(kies(spel, rij, waarde)); geluid.paar()
  }
  function toonVoorbeeld() {
    setZichtbaar(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setZichtbaar(false), 3000)
  }
  function klaarTik() {
    if (danst) return
    const uit = klaar(spel)
    if (!uit.goed) {
      setSpel(uit.spel); setFout(uit.fout); setWip((n) => n + 1); geluid.oei()
      if (!lezer) leesVoor(zin.verkleedFout)
      return
    }
    setFout([]); setDanst(true); geluid.hoera()
    timer.current = setTimeout(() => {
      setSpel(uit.spel); setDanst(false)
      if (isKlaar(uit.spel)) {
        if (!lezer) setTimeout(() => leesVoor(zin.verkleedKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'verkleed', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1200)
  }

  return (
    <div className="verkleed">
      <Chips label="Niveau" opties={verkleedNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="verkleed-eind">
          <div className="verkleed-rij-feest">
            {[0, 1, 2, 3, 4].map((i) => { const k = spel.rondes[i].kostuum; return <Poppetje key={k.sleutel} hoed={k.hoed} mantel={k.mantel} voorwerp={k.voorwerp} /> })}
          </div>
          <div className="hoera display">{lezer ? 'Wat een mooi feest!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : ronde && (
        <>
          <div className="verkleed-teller" aria-label={`Kostuum ${spel.ronde + 1} van ${verkleedRondes}`}>
            {Array.from({ length: verkleedRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
          </div>
          <div className="verkleed-veld">
            <div className={`verkleed-kaartje${tip ? ' tip' : ''}${zichtbaar ? '' : ' verborgen'}`} role="img" aria-label="Het voorbeeld">
              {zichtbaar
                ? <Poppetje hoed={ronde.kostuum.hoed} mantel={rijen(spel).includes('mantel') ? ronde.kostuum.mantel : undefined}
                            voorwerp={rijen(spel).includes('voorwerp') ? ronde.kostuum.voorwerp : undefined} />
                : <span className="verkleed-vraag display" aria-hidden="true">?</span>}
              {verberg > 0 && !zichtbaar && (
                <button type="button" className="verkleed-oog" aria-label="Kijk nog eens naar het voorbeeld" onClick={toonVoorbeeld}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 0 0 0-5.6z" fill="#fff" /></svg>
                </button>
              )}
            </div>
            <div key={`${spel.ronde}-${wip}`} className={`verkleed-pop${fout.length ? ' wip' : ''}${danst ? ' danst' : ''}`}>
              <Poppetje hoed={spel.gekozen.hoed} mantel={spel.gekozen.mantel} voorwerp={spel.gekozen.voorwerp} />
            </div>
            <div className="verkleed-kist" role="group" aria-label="Verkleedkist">
              {rijen(spel).map((rij) => (
                <div key={rij} className="verkleed-keuzes" role="group" aria-label={rij}>
                  {ronde.keuzes[rij].map((w) => (
                    <button key={w} type="button" aria-label={naam[w]} aria-pressed={spel.gekozen[rij] === w} disabled={danst}
                            className={`verkleed-keuze${spel.gekozen[rij] === w ? ' aan' : ''}${fout.includes(rij) && spel.gekozen[rij] === w ? ' fout' : ''}`}
                            onClick={() => tikDeel(rij, w)}>
                      <DeelTekening rij={rij} waarde={w} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button type="button" className="verkleed-klaar" aria-label="Klaar" onClick={klaarTik} disabled={danst}>
              <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 21L17 29L31 11" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
