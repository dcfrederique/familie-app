import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { inAanbod, leegAanbod, metPrijs } from '../data/aanbod.ts'
import { bezitSleutel, figuurtjeVan, prijsVoor, type Bezit, type Stuk } from '../data/figuurtje.ts'
import { kleurKlasse } from '../data/gezin.ts'
import {
  heeftHuisStuk, huisCategorie, huisVan, huisVerrassing, isHuisStukVrij, kiesHuisStuk, metHuisStuk, zichtbareHuisCategorieen,
  zichtbareHuisStukken, type Huis, type HuisCategorie, type HuisCategorieInfo,
} from '../data/huis.ts'
import { themaVan } from '../data/thema.ts'
import { zin } from '../data/zinnen.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Bladzijden from './Bladzijden.tsx'
import HuisPrent, { HuisKeuzePrent } from './HuisPrent.tsx'
import KoopVraag from './KoopVraag.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import { ThemaKop } from './ThemaDelen.tsx'
import './figuurtje.css'
import './huis.css'
import './schermen.css'

// Mijn huis (docs/huis.md): links het huis met de tuin en het figuurtje voor de deur, rechts wat je kunt veranderen.
// Werkt zoals de kleerkast: stukken op slot koopt het kind met sterren (docs/winkel.md), alleen wat de ouders in de
// winkel legden is te zien (docs/winkelaanbod.md), en bewaren gebeurt met Klaar. Een groter huis kopen is een feest.
export default function MijnHuis() {
  const { id } = useParams()
  const [zoek] = useSearchParams()
  const navigate = useNavigate()
  const { kinderen, bron, herlaad } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const { data: winkel, ververs } = useGegevens(bron && id ? async () => {
    const [aankopen, saldi, aanbod] = await Promise.all([bron.aankopen(), bron.saldi(), bron.aanbod()])
    return { eigen: new Set(aankopen[id] ?? []), vrij: saldi[id]?.vrij ?? 0, aanbod }
  } : null, [bron, id])

  const [huis, setHuis] = useState<Huis | null>(null)
  const [vorige, setVorige] = useState<Huis[]>([])
  const [cat, setCat] = useState<HuisCategorie>('huis')
  const [proef, setProef] = useState<{ huis: Huis; tip: string } | null>(null)
  const [koop, setKoop] = useState<{ cat: HuisCategorieInfo; stuk: Stuk } | null>(null)
  const [feest, setFeest] = useState<Huis | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [wiebel, setWiebel] = useState(0)
  const proefKlok = useRef(0)

  // Start van het bewaarde huis; vanuit de winkel kan een gekocht stuk al gekozen zijn (?bouw=dak:rond).
  useEffect(() => {
    if (!kind || huis) return
    const start = huisVan(kind)
    const [c, s] = (zoek.get('bouw') ?? '').split(':')
    const info = zichtbareHuisCategorieen(kind.kan_lezen).find((x) => x.id === c)
    if (info && info.stukken.some((x) => x.id === s)) {
      setHuis(metHuisStuk(start, info, s))
      setCat(info.id)
    } else {
      setHuis(start)
    }
  }, [kind, huis, zoek])
  useEffect(() => () => window.clearTimeout(proefKlok.current), [])

  if (!kind) return <Navigate to="/kinderen" replace />
  if (!huis) return null

  const lezer = kind.kan_lezen
  const v: Bezit = { eigen: winkel?.eigen ?? new Set<string>(), allesVrij: kind.figuurtje_alles_vrij, kanLezen: lezer }
  const vrij = winkel?.vrij ?? 0
  const info = huisCategorie(cat)
  const figuurtje = figuurtjeVan(kind)
  // Wat in het bewaarde huis staat blijft te zien, ook als een ouder het uit de winkel haalde (docs/winkelaanbod.md).
  const bewaard = huisVan(kind)
  const aanbod = winkel?.aanbod ?? leegAanbod
  // Het stuk met de prijs die de ouders instelden.
  const tel = (c: HuisCategorie, s: Stuk) => metPrijs(aanbod, c, s.id, s)
  const teZien = (c: HuisCategorie, s: Stuk) => tel(c, s).prijs === 0 || inAanbod(aanbod, kind.id,
    bezitSleutel(c, s.id), v.eigen.has(bezitSleutel(c, s.id)) || heeftHuisStuk(bewaard, huisCategorie(c), s.id))
  const zeg = (tekst: string) => { if (!lezer) leesVoor(tekst) }

  function wijzig(nieuw: Huis) {
    setVorige((h) => [...h, huis!])
    setHuis(nieuw)
    setProef(null)
    setWiebel((n) => n + 1)
  }

  function kies(gekozen: Stuk) {
    const stuk = tel(cat, gekozen)
    zeg(stuk.naam)
    if (isHuisStukVrij(cat, stuk, v)) return wijzig(kiesHuisStuk(huis!, info, stuk.id))
    // Genoeg sterren: meteen vragen of het kind het wil kopen.
    const prijs = prijsVoor(stuk, v)
    if (winkel && vrij >= prijs) return setKoop({ cat: info, stuk })
    // Te weinig: even tonen hoe het zou staan, zonder het te bewaren.
    const nog = prijs - vrij
    setProef({ huis: metHuisStuk(huis!, info, stuk.id), tip: lezer ? `Nog ${nog} ${nog === 1 ? 'ster' : 'sterren'} sparen, dan is ${stuk.naam.toLowerCase()} van jou.` : zin.sparen })
    if (!lezer) leesVoor(zin.sparen)
    geluid.oei()
    setWiebel((n) => n + 1)
    window.clearTimeout(proefKlok.current)
    proefKlok.current = window.setTimeout(() => setProef(null), 2600)
  }

  async function klaar() {
    if (!bron) return
    setBezig(true)
    setFout('')
    try {
      await bron.huisBewaren(kind!.id, huis)
      await herlaad()
      zeg('Mooi huis!')
      navigate(`/kind/${kind!.id}`)
    } catch (e) {
      setFout(foutmelding(e as Error))
      setBezig(false)
    }
  }

  const getoond = proef?.huis ?? huis
  const stukken = zichtbareHuisStukken(info, lezer).filter((s) => teZien(cat, s)).map((s) => tel(cat, s))
  const thema = themaVan(kind)
  const terugKnop = (
    <Link to={`/kind/${kind.id}`} className="rond" aria-label="Terug zonder bewaren">
      <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M15 18l-6-6l6-6" /></svg>
    </Link>
  )
  const voorleesKnop = !lezer && kanVoorlezen() && (
    <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(zin.huisBouwen)}>
      <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
    </button>
  )
  const sterren = winkel && !v.allesVrij && <SterrenPil aantal={vrij} />
  const titel = `Het huis van ${kind.naam}`

  return (
    <div className={`kind ${kleurKlasse(kind)}${thema ? ` thema thema-${thema} thema-scherm-huis` : ''}`}>
      <div className={`kleerkast huisbouw${lezer ? '' : ' prenten'}`}>
        {thema ? (
          <ThemaKop thema={thema} scherm="huis" titel={titel} lezer={lezer} links={terugKnop} rechts={<>{voorleesKnop}{sterren}</>} />
        ) : (
          <header className="kop">
            {terugKnop}
            {lezer ? <h1 className="kop-titel display">{titel}</h1> : <>{voorleesKnop}<span style={{ flexGrow: 1 }} /></>}
            {sterren}
          </header>
        )}

        <div className="kleerkast-inhoud">
          <section className={`huis-podium${wiebel ? ' wiebel' : ''}`} key={wiebel} aria-label="Je huis">
            {proef && (
              <p className="podium-tip" role="status">
                <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" /></svg>
                {proef.tip}
              </p>
            )}
            <HuisPrent huis={getoond} figuurtje={figuurtje} label={titel} className={proef ? 'proef' : ''} />
            <Link to={`/kind/${kind.id}/figuurtje`} className="huis-naar-kast" aria-label="Mijn figuurtje aankleden"
                  onClick={() => zeg('Mijn figuurtje')}>
              <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 4l-5 3l2 4l3-1v10h8V10l3 1l2-4l-5-3a4 4 0 0 1-8 0z" /></svg>
            </Link>
          </section>

          <section className="kast">
            <div className="kast-tabs" role="tablist" aria-label="Wat wil je veranderen?">
              {zichtbareHuisCategorieen(lezer).map((c) => (
                <button key={c.id} type="button" role="tab" className="kast-tab" aria-selected={c.id === cat} aria-label={c.naam}
                        onClick={() => { setCat(c.id); setProef(null); zeg(c.naam) }}>
                  <svg className="ic" viewBox="0 0 24 24" width={lezer ? 28 : 40} height={lezer ? 28 : 40} aria-hidden="true"><path d={c.icoon} /></svg>
                  {lezer && <span>{c.naam}</span>}
                </button>
              ))}
            </div>

            {lezer && info.veld === 'tuin' && <p className="huis-hint">Kies er 2: links (L) en rechts (R) van je huis.</p>}
            {lezer && info.veld === 'extra' && <p className="huis-hint">Zet aan wat je wil, alles mag samen.</p>}

            <div role="tabpanel" className="huis-keuzes">
              <Bladzijden key={cat} items={stukken} perBlad={lezer ? 8 : 6} className="kast-keuzes" label="Meer keuzes"
                          toon={(s) => {
                            const eigen = isHuisStukVrij(cat, s, v)
                            const prijs = prijsVoor(s, v)
                            const gekozen = heeftHuisStuk(huis, info, s.id)
                            const plaats = info.veld === 'tuin' && gekozen ? (huis.tuin.indexOf(s.id) ? 'R' : 'L') : null
                            return (
                              <button key={s.id} type="button" className={`kast-keuze${eigen ? '' : ' op-slot'}${!eigen && vrij >= prijs ? ' te-koop' : ''}`}
                                      aria-pressed={gekozen} aria-label={eigen ? s.naam : `${s.naam}, kost ${prijs} sterren`} onClick={() => kies(s)}>
                                <HuisKeuzePrent huis={huis} cat={info} stuk={s.id} className="kast-prent" />
                                {!eigen && <span className="slotje" aria-hidden="true"><svg className="ic" viewBox="0 0 24 24" width="20" height="20"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" /></svg></span>}
                                {!eigen && <span className="prijs-label display" aria-hidden="true"><Ster grootte={18} />{prijs}</span>}
                                {plaats && <span className="huis-plaats display" aria-hidden="true">{plaats}</span>}
                                {lezer && <span className="kast-naam">{s.naam}</span>}
                              </button>
                            )
                          }} />
            </div>

            {info.kleur && (
              <div className="kast-kleuren" role="group" aria-label="Kleur">
                {Object.entries(info.kleur.palet).map(([naam, hex]) => (
                  <button key={naam} type="button" className="kast-kleur" style={{ background: hex }} aria-label={naam}
                          aria-pressed={huis[info.kleur!.veld] === naam}
                          onClick={() => { zeg(naam); wijzig({ ...huis, [info.kleur!.veld]: naam }) }} />
                ))}
              </div>
            )}

            {fout && <p className="fout" role="alert">{fout}</p>}

            <div className="kast-acties">
              <button type="button" className="kast-actie" aria-label="Ongedaan maken" disabled={!vorige.length}
                      onClick={() => { setHuis(vorige[vorige.length - 1]); setVorige((h) => h.slice(0, -1)); setProef(null) }}>
                <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
                {lezer && <span>Terug</span>}
              </button>
              <button type="button" className="kast-actie" aria-label="Verrassing"
                      onClick={() => { zeg('Verrassing!'); wijzig(huisVerrassing(v, huis, Math.random, teZien)) }}>
                <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" /></svg>
                {lezer && <span>Verrassing</span>}
              </button>
              <button type="button" className="kast-actie klaar" aria-label="Klaar" disabled={bezig} onClick={klaar}>
                <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
                {lezer && <span>Klaar</span>}
              </button>
            </div>
          </section>
        </div>
      </div>

      {koop && bron && (
        <KoopVraag kind={kind} naam={koop.stuk.naam} prijs={prijsVoor(koop.stuk, v)} vrij={vrij}
                   prent={<HuisKeuzePrent huis={huis} cat={koop.cat} stuk={koop.stuk.id} />}
                   koop={async () => {
                     await bron.kopen(kind.id, koop.cat.id, koop.stuk.id, koop.stuk.naam)
                     await ververs()
                     const nieuw = metHuisStuk(huis, koop.cat, koop.stuk.id)
                     wijzig(nieuw)
                     if (koop.cat.veld === 'model') setFeest(nieuw)
                   }}
                   sluit={() => setKoop(null)} />
      )}
      {feest && <HuisFeest huis={feest} figuurtje={figuurtje} lezer={lezer} sluit={() => setFeest(null)} />}
    </div>
  )
}

/** Feest als het huis groter wordt: het nieuwe huis groeit uit de grond, met het figuurtje voor de deur. */
function HuisFeest({ huis, figuurtje, lezer, sluit }: {
  huis: Huis; figuurtje: ReturnType<typeof figuurtjeVan>; lezer: boolean; sluit: () => void
}) {
  useEffect(() => { if (!lezer) leesVoor(zin.huisGegroeid) }, [lezer])
  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label="Je huis is gegroeid">
      <div className="dialoog huis-feest">
        <div className="huis-feest-stralen"><HuisPrent huis={huis} figuurtje={figuurtje} className="groei" /></div>
        <h2 className="display">Je huis is gegroeid!</h2>
        {lezer && <p>Al je kleuren verhuizen mee. Tik op Klaar om je nieuwe huis te bewaren.</p>}
        <div className="dialoog-knoppen">
          <button type="button" className="groot-knop" aria-label="Hoera" onClick={sluit}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M14 6l4 4M5 19l8-8M11 5l2-2l7 7l-2 2l-3-3l-2 2l-4-4z" /></svg>
            {lezer && 'Bouwen!'}
          </button>
        </div>
      </div>
    </div>
  )
}
