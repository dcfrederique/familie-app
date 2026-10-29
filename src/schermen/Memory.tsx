import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { memoryNiveaus, memoryPrenten, startNiveaus, type MemoryNiveau } from '../data/spelletjes.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { dichtdoen, draai, nieuwSpel, parenGevonden, type MemorySpel } from '../lib/spelletjes/memory.ts'
import { gekozenNiveau, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import SpelKader, { Chips } from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'

const STER = 'M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z'

export default function Memory() {
  return (
    <SpelKader titel="Memory" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <MemorySpelBord kind={kind} />}
    </SpelKader>
  )
}

function MemorySpelBord({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<MemoryNiveau>(() =>
    gekozenNiveau(kind.id, 'memory', startNiveaus(kind, kinderen).memory, Object.keys(memoryNiveaus)))
  const n = memoryNiveaus[niveau]
  const [spel, setSpel] = useState<MemorySpel>(() => nieuwSpel(n.paren))
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const begin = useRef(Date.now())
  const klaar = parenGevonden(spel) === n.paren

  function opnieuw(nv = niveau) {
    setSpel(nieuwSpel(memoryNiveaus[nv].paren))
    setNieuwRecord(false)
    begin.current = Date.now()
  }

  // Twee verschillende kaarten even laten zien en dan weer omdraaien.
  useEffect(() => {
    if (spel.open.length < 2) return
    const t = setTimeout(() => setSpel(dichtdoen), 950)
    return () => clearTimeout(t)
  }, [spel.open.length])

  function kies(i: number) {
    const { spel: na, zet } = draai(spel, i)
    if (zet === 'genegeerd') return
    setSpel(na)
    if (zet === 'klaar') {
      setNieuwRecord(recordBewaren(kind.id, `memory-${niveau}`, na.beurten))
      setTimeout(geluid.hoera, 250)
      // Memory levert geen sterren op, maar komt wel in het activiteitlog (telt mee als speeltijd).
      void bron?.activiteitOpslaan(kind.id, 'memory', { paren: n.paren, beurten: na.beurten, niveau },
        (Date.now() - begin.current) / 1000).catch(() => {})
    } else if (zet === 'paar') setTimeout(geluid.paar, 200)
    else geluid.draai()
  }

  const rijen = Math.ceil(n.paren * 2 / n.kolommen)
  const best = record(kind.id, `memory-${niveau}`)
  return (
    <div className="memory">
      <div className="memory-bord">
        <Chips label="Moeilijkheid" opties={memoryNiveaus} gekozen={niveau}
               kies={(nv) => { setNiveau(nv); niveauBewaren(kind.id, 'memory', nv); opnieuw(nv) }} />
        <div className="memory-raster" style={{
          gridTemplateColumns: `repeat(${n.kolommen}, minmax(0, 1fr))`,
          maxWidth: `min(100%, calc((100dvh - var(--mem-rand, 260px)) * ${n.kolommen} / ${rijen}), ${n.kolommen * 170}px)`,
        }}>
          {spel.kaarten.map((p, i) => {
            const open = spel.open.includes(i) || spel.gevonden.includes(i)
            const [naam, kleur, pad] = memoryPrenten[p]
            return (
              <button key={i} type="button" className={`mkaart${open ? ' open' : ''}${spel.gevonden.includes(i) ? ' paar' : ''}`}
                      aria-label={open ? naam : `Kaart ${i + 1}`} onClick={() => kies(i)}>
                <span className="mkaart-binnen">
                  <span className="mkaart-kant achter">
                    <svg width="46%" height="46%" viewBox="0 0 24 24" aria-hidden="true"><path d={STER} fill="var(--achter-ster)" /></svg>
                  </span>
                  <span className="mkaart-kant voor">
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: kleur }}><path d={pad} /></svg>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="memory-zijkant">
        <div className="stat"><div>Paren gevonden</div><div className="getal display">{parenGevonden(spel)} <small>van {n.paren}</small></div></div>
        <div className="stat"><div>Beurten</div><div className="getal display">{spel.beurten}</div></div>
        {klaar ? (
          <div className="hoera display"><ThemaFeest />Super, alles gevonden in {spel.beurten} beurten!{nieuwRecord && best !== null && ' Nieuw record!'}</div>
        ) : best !== null && (
          <div className="stat"><div>Jouw record</div><div className="getal display">{best} <small>beurten</small></div></div>
        )}
        <button type="button" className="groot-knop" onClick={() => opnieuw()}>{klaar ? 'Nog eens spelen' : 'Opnieuw beginnen'}</button>
      </div>
    </div>
  )
}
