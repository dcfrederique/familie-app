import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { inAanbod, leegAanbod, metPrijs } from '../data/aanbod.ts'
import {
  bezitSleutel, figuurtjeVan, prijsVoor, zichtbareCategorieen, zichtbareStukken, type Bezit,
} from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { spelMenu, spelPrijs } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import Figuurtje from './Figuurtje.tsx'
import KoopVraag from './KoopVraag.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import './winkel.css'

type Deel = 'spel' | 'figuurtje'

interface WinkelItem {
  sleutel: string
  soort: string
  id: string
  naam: string
  prijs: number
  eigen: boolean
  prent: (maat: number) => ReactNode
  /** Waar je na het kopen naartoe gaat: spelen of aandoen. */
  naar: string
}

// De winkel van een kind (docs/winkel.md): alles wat het met sterren kan kopen in één overzicht, spelletjes en
// stukken voor het figuurtje. Wat de ouders niet vrijgaven of voor dit kind verbergen, staat er niet
// (docs/winkelaanbod.md). Bereikbaar via de sterren en het winkeltje op het startscherm.
export default function Winkel() {
  return (
    <SpelKader titel="Winkel" terug={(id) => `/kind/${id}`}>
      {(kind) => <WinkelInhoud kind={kind} />}
    </SpelKader>
  )
}

function WinkelInhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const { data, ververs } = useGegevens(bron ? async () => {
    const [aankopen, saldi, aanbod] = await Promise.all([bron.aankopen(), bron.saldi(), bron.aanbod()])
    return { eigen: new Set(aankopen[kind.id] ?? []), vrij: saldi[kind.id]?.vrij ?? 0, aanbod }
  } : null, [bron, kind.id])
  const [deel, setDeel] = useState<Deel>('spel')
  const [koop, setKoop] = useState<WinkelItem | null>(null)
  const [tip, setTip] = useState<{ sleutel: string; tekst: string } | null>(null)
  const tipKlok = useRef(0)
  useEffect(() => () => window.clearTimeout(tipKlok.current), [])

  if (!data) return null
  const v: Bezit = { eigen: data.eigen, allesVrij: kind.figuurtje_alles_vrij, kanLezen: lezer }
  const aanbod = data.aanbod ?? leegAanbod
  const huidig = figuurtjeVan(kind)
  const vrij = data.vrij

  const spellen: WinkelItem[] = spelMenu.map((s) => metPrijs(aanbod, 'spel', s.sleutel, s)).filter((s) => s.prijs > 0).map((s) => ({
    sleutel: bezitSleutel('spel', s.sleutel), soort: 'spel', id: s.sleutel, naam: s.naam, prijs: spelPrijs(s, v),
    eigen: spelPrijs(s, v) === 0 || data.eigen.has(bezitSleutel('spel', s.sleutel)),
    prent: (maat) => <svg className="ic" viewBox="0 0 24 24" width={maat} height={maat} aria-hidden="true"><path d={s.icoon} /></svg>,
    naar: `/kind/${kind.id}/${s.sleutel}`,
  }))
  const stukken: WinkelItem[] = zichtbareCategorieen(lezer).flatMap((c) => zichtbareStukken(c, lezer).map((s) => metPrijs(aanbod, c.id, s.id, s)).filter((s) => s.prijs > 0).map((s) => ({
    sleutel: bezitSleutel(c.id, s.id), soort: c.id, id: s.id, naam: s.naam, prijs: prijsVoor(s, v),
    eigen: prijsVoor(s, v) === 0 || data.eigen.has(bezitSleutel(c.id, s.id)),
    prent: () => <Figuurtje figuurtje={{ ...huidig, [c.id]: s.id }} uitsnede={c.uitsnede} />,
    naar: `/kind/${kind.id}/figuurtje?aandoen=${c.id}:${s.id}`,
  })))
  const zichtbaar = (i: WinkelItem) => inAanbod(aanbod, kind.id, i.sleutel, data.eigen.has(i.sleutel) || huidig[i.soort as keyof typeof huidig] === i.id)
  // Eerst wat je nu kunt kopen, dan waarvoor je spaart (goedkoopst eerst), en wat al van jou is achteraan.
  const orde = (i: WinkelItem) => (i.eigen ? 2 : vrij >= i.prijs ? 0 : 1)
  const lijst = (deel === 'spel' ? spellen : stukken).filter(zichtbaar)
    .sort((a, b) => orde(a) - orde(b) || a.prijs - b.prijs)

  function opSlot(i: WinkelItem) {
    if (vrij >= i.prijs) return setKoop(i)
    geluid.oei()
    const nog = i.prijs - vrij
    const tekst = lezer ? `Nog ${nog} ${nog === 1 ? 'ster' : 'sterren'} sparen.` : zin.sparen
    if (!lezer) leesVoor(tekst)
    setTip({ sleutel: i.sleutel, tekst })
    window.clearTimeout(tipKlok.current)
    tipKlok.current = window.setTimeout(() => setTip(null), 2600)
  }

  const tab = (d: Deel, naam: string, icoon: string) => (
    <button type="button" className="chip winkel-tab" aria-pressed={deel === d} aria-label={naam}
            onClick={() => { setDeel(d); if (!lezer) leesVoor(naam) }}>
      <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d={icoon} /></svg>
      {lezer && naam}
    </button>
  )

  return (
    <div className="winkel">
      <div className="winkel-kop">
        <div className="chips" role="group" aria-label="Wat wil je zien?">
          {tab('spel', 'Spelletjes', 'M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-9 3h-2a5 5 0 0 1-9-3v-2a5 5 0 0 1 5-5z')}
          {tab('figuurtje', 'Figuurtje', 'M12 7a3 3 0 1 0 0-.01M6 21v-3a6 6 0 0 1 12 0v3')}
        </div>
        <SterrenPil aantal={vrij} metWoord={lezer} />
      </div>

      {lijst.length === 0 && <p className="leeg">{lezer ? 'Hier ligt nu niets. Kijk later nog eens!' : ''}</p>}
      <ul className="winkel-raster">
        {lijst.map((i) => {
          const teKoop = !i.eigen && vrij >= i.prijs
          const deelGespaard = Math.min(1, vrij / Math.max(1, i.prijs))
          const inhoud = (
            <>
              <span className={`winkel-prent${i.soort === 'spel' ? ' is-spel' : ''}`}>{i.prent(64)}</span>
              {lezer && <span className="winkel-naam display">{i.naam}</span>}
              {i.eigen ? (
                <span className="winkel-eigen display">
                  <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
                  {lezer && 'Van jou'}
                </span>
              ) : (
                <>
                  <span className="winkel-prijs display"><Ster grootte={22} />{i.prijs}</span>
                  {!teKoop && (
                    <span className="spel-balk" role="img" aria-label={`${Math.min(vrij, i.prijs)} van ${i.prijs} sterren`}>
                      <span style={{ width: `${Math.round(deelGespaard * 100)}%` }} />
                    </span>
                  )}
                </>
              )}
              {tip?.sleutel === i.sleutel && <span className="spel-tip" role="status">{tip.tekst}</span>}
            </>
          )
          return (
            <li key={i.sleutel}>
              {i.eigen ? (
                <Link to={i.naar} className="winkel-kaart is-eigen" aria-label={`${i.naam}, van jou`}>{inhoud}</Link>
              ) : (
                <button type="button" className={`winkel-kaart${teKoop ? ' te-koop' : ''}`}
                        aria-label={`${i.naam}, kost ${i.prijs} sterren`} onClick={() => opSlot(i)}>{inhoud}</button>
              )}
            </li>
          )
        })}
      </ul>

      {koop && bron && (
        <KoopVraag kind={kind} naam={koop.naam} prijs={koop.prijs} vrij={vrij} prent={koop.prent(110)}
                   koop={async () => { await bron.kopen(kind.id, koop.soort, koop.id, koop.naam); await ververs() }}
                   sluit={() => setKoop(null)} />
      )}
    </div>
  )
}
