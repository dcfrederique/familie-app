import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { kettingenPerRonde, kettingNiveaus, startKettingNiveau, type KettingNiveau, type Kraal } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gevraagd, huidige, isKlaar, kies, nieuwSpel, volgende, zichtbaar, type KettingSpel } from '../lib/spelletjes/ketting.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './ketting.css'

const kraalNaam: Record<Kraal, string> = { bes: 'Bes', blad: 'Blad', eikel: 'Eikel', paddenstoel: 'Paddenstoel' }

/** Eigen tekeningen (vlakke vormen) van de kralen, in een kader van 100 × 100. */
export function KraalTekening({ kraal }: { kraal: Kraal }) {
  return (
    <svg className="kraal-tekening" viewBox="0 0 100 100" aria-hidden="true">
      {kraal === 'bes' && (
        <>
          <circle cx={50} cy={56} r={32} fill="#C73A4B" />
          <ellipse cx={39} cy={44} rx={8} ry={5} fill="#fff" opacity={0.45} transform="rotate(-30 39 44)" />
          <path d="M50 24Q50 14 58 10" stroke="#5A8A3A" strokeWidth={6} strokeLinecap="round" fill="none" />
          <path d="M50 24Q62 18 66 26Q58 32 50 24Z" fill="#5A8A3A" />
        </>
      )}
      {kraal === 'blad' && (
        <>
          <path d="M50 90C24 80 18 46 50 10C82 46 76 80 50 90Z" fill="#E08A2E" />
          <path d="M50 88V24M50 66L36 52M50 66L64 52M50 46L40 36M50 46L60 36" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      )}
      {kraal === 'eikel' && (
        <>
          <path d="M50 94C32 82 28 62 30 50H70C72 62 68 82 50 94Z" fill="#C9904A" />
          <path d="M22 52C20 28 36 20 50 20C64 20 80 28 78 52Z" fill="#7A4E2A" />
          <path d="M30 34L36 52M42 28L46 52M54 28L56 52M66 34L64 52" stroke="#5A3A1C" strokeWidth={3} strokeLinecap="round" />
          <path d="M50 20V10" stroke="#5A3A1C" strokeWidth={6} strokeLinecap="round" />
        </>
      )}
      {kraal === 'paddenstoel' && (
        <>
          <path d="M38 52H62L66 90Q50 96 34 90Z" fill="#F4E6CC" />
          <path d="M12 56C12 26 30 12 50 12C70 12 88 26 88 56Z" fill="#D8452B" />
          <circle cx={34} cy={36} r={7} fill="#fff" />
          <circle cx={60} cy={28} r={6} fill="#fff" />
          <circle cx={70} cy={46} r={5} fill="#fff" />
        </>
      )}
    </svg>
  )
}

export default function Ketting() {
  return (
    <SpelKader titel="Herfstketting" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <KettingScherm kind={kind} />}
    </SpelKader>
  )
}

function KettingScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KettingNiveau>(() =>
    gekozenNiveau(kind.id, 'ketting', startKettingNiveau(kind, kinderen), Object.keys(kettingNiveaus)))
  const [spel, setSpel] = useState<KettingSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [oei, setOei] = useState(0)
  const [tip, setTip] = useState(false)
  const [wacht, setWacht] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const klaar = isKlaar(spel)
  const ketting = huidige(spel)
  const juist = gevraagd(spel)

  useEffect(() => { if (!lezer) leesVoor(zin.kettingUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Doet het kind een tijdje niets, dan wipt de juiste kraal even.
  useEffect(() => {
    setTip(false)
    if (klaar) return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [spel.ronde, spel.plek, spel.misser, niveau, klaar])

  function opnieuw(nv: KettingNiveau = niveau) {
    clearTimeout(timer.current)
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setWacht(false)
  }
  function kiesNiveau(nv: KettingNiveau) {
    setNiveau(nv); niveauBewaren(kind.id, 'ketting', nv); opnieuw(nv)
  }
  function kiesKraal(kraal: Kraal) {
    if (wacht) return
    const { spel: na, zet } = kies(spel, kraal)
    if (zet === 'fout') { setOei((n) => n + 1); setSpel(na); geluid.oei(); return }
    setSpel(na)
    geluid.paar()
    if (zet === 'af') {
      setWacht(true)
      timer.current = setTimeout(() => {
        const vol = volgende(na)
        setSpel(vol); setWacht(false)
        if (isKlaar(vol)) {
          geluid.hoera()
          if (!lezer) setTimeout(() => leesVoor(zin.kettingKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'ketting', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000)))
            .catch(() => {})
        }
      }, 900)
    }
  }

  return (
    <div className="ketting">
      <Chips label="Niveau" opties={kettingNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {klaar ? (
        <div className="ketting-eind">
          <div className="ketting-rij" aria-hidden="true">
            {(['bes', 'blad', 'eikel', 'paddenstoel'] as const).map((k) => <span key={k} className="kraal"><KraalTekening kraal={k} /></span>)}
          </div>
          <div className="hoera display">{lezer ? 'Alle kettingen zijn af!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : ketting && (
        <>
          <div className="ketting-teller" aria-label={`Ketting ${spel.ronde + 1} van ${kettingenPerRonde}`}>
            {Array.from({ length: kettingenPerRonde }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
          </div>
          <div key={`${spel.ronde}-${oei}`} className={`ketting-rij${oei ? ' oei' : ''}`} role="img" aria-label="De ketting"
               style={{ '--n': zichtbaar(ketting).length + ketting.lege } as CSSProperties}>
            {zichtbaar(ketting).map((k, i) => <span key={i} className="kraal"><KraalTekening kraal={k} /></span>)}
            {Array.from({ length: ketting.lege }, (_, i) => {
              const vol = i < spel.plek
              return (
                <span key={`l${i}`} className={`kraal leeg${vol ? ' vol' : ''}${i === spel.plek ? ' nu' : ''}`}>
                  {vol && <KraalTekening kraal={ketting.rij[ketting.rij.length - ketting.lege + i]} />}
                </span>
              )
            })}
          </div>
          <div className="ketting-keuzes" role="group" aria-label="Kralen">
            {ketting.keuzes.map((k) => (
              <button key={k} type="button" aria-label={kraalNaam[k]} disabled={wacht}
                      className={`ketting-keuze${tip && k === juist ? ' tip' : ''}`} onClick={() => kiesKraal(k)}>
                <KraalTekening kraal={k} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
