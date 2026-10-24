import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { inAanbod, leegAanbod } from '../data/aanbod.ts'
import {
  bezitSleutel, categorie, figuurtjeVan, isVrij, prijsVoor, verrassing, zichtbareCategorieen, zichtbareStukken,
  type Bezit, type Categorie, type Figuurtje as FiguurtjeData, type Stuk,
} from '../data/figuurtje.ts'
import { kleurKlasse } from '../data/gezin.ts'
import { themaVan } from '../data/thema.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Figuurtje from './Figuurtje.tsx'
import { ThemaKop } from './ThemaDelen.tsx'
import KoopVraag from './KoopVraag.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import './figuurtje.css'
import './schermen.css'
import { zin } from '../data/zinnen.ts'

// Kleerkast: links het figuurtje, rechts categorieën, keuzes en kleuren (docs/avatar.md).
// Stukken op slot koopt het kind met sterren (docs/winkel.md); kopen kan meteen vanuit de kast.
// Bewaren gebeurt met Klaar; terug zonder Klaar laat het oude figuurtje staan.
// Wie niet leest krijgt minder en grotere keuzes zonder tekst, en elke tik wordt voorgelezen.
export default function Kleerkast() {
  const { id } = useParams()
  const [zoek] = useSearchParams()
  const navigate = useNavigate()
  const { kinderen, bron, herlaad } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const { data: winkel, ververs } = useGegevens(bron && id ? async () => {
    const [aankopen, saldi, aanbod] = await Promise.all([bron.aankopen(), bron.saldi(), bron.aanbod()])
    return { eigen: new Set(aankopen[id] ?? []), vrij: saldi[id]?.vrij ?? 0, aanbod }
  } : null, [bron, id])

  const [figuurtje, setFiguurtje] = useState<FiguurtjeData | null>(null)
  const [vorige, setVorige] = useState<FiguurtjeData[]>([])
  const [cat, setCat] = useState<Categorie>('haar')
  const [proef, setProef] = useState<{ figuurtje: FiguurtjeData; tip: string } | null>(null)
  const [koop, setKoop] = useState<{ cat: Categorie; stuk: Stuk; figuurtje: FiguurtjeData } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [huppel, setHuppel] = useState(0)
  const proefKlok = useRef(0)

  // Start van het bewaarde figuurtje; via het feestscherm kan een nieuw stuk al aangedaan zijn (?aandoen=hoofd:helm).
  useEffect(() => {
    if (!kind || figuurtje) return
    const start = figuurtjeVan(kind)
    const [c, s] = (zoek.get('aandoen') ?? '').split(':')
    const info = zichtbareCategorieen(kind.kan_lezen).find((x) => x.id === c)
    if (info && info.stukken.some((x) => x.id === s)) {
      start[info.id] = s
      setCat(info.id)
    }
    setFiguurtje(start)
  }, [kind, figuurtje, zoek])
  useEffect(() => () => window.clearTimeout(proefKlok.current), [])

  if (!kind) return <Navigate to="/kinderen" replace />
  if (!figuurtje) return null

  const lezer = kind.kan_lezen
  const v: Bezit = { eigen: winkel?.eigen ?? new Set<string>(), allesVrij: kind.figuurtje_alles_vrij, kanLezen: lezer }
  const vrij = winkel?.vrij ?? 0
  const info = categorie(cat)
  // Wat het kind nu draagt blijft te zien, ook als een ouder het uit de winkel haalde (docs/winkelaanbod.md).
  const bewaard = figuurtjeVan(kind)
  const teZien = (c: Categorie, s: Stuk) => s.prijs === 0 || inAanbod(winkel?.aanbod ?? leegAanbod, kind.id,
    bezitSleutel(c, s.id), v.eigen.has(bezitSleutel(c, s.id)) || bewaard[c] === s.id)
  const zeg = (tekst: string) => { if (!lezer) leesVoor(tekst) }

  function wijzig(nieuw: FiguurtjeData) {
    setVorige((h) => [...h, figuurtje!])
    setFiguurtje(nieuw)
    setProef(null)
    setHuppel((n) => n + 1)
  }

  function kies(stuk: Stuk) {
    zeg(stuk.naam)
    const nieuw = { ...figuurtje!, [cat]: stuk.id }
    if (isVrij(cat, stuk, v)) return wijzig(nieuw)
    // Genoeg sterren: meteen vragen of het kind het wil kopen.
    const prijs = prijsVoor(stuk, v)
    if (winkel && vrij >= prijs) return setKoop({ cat, stuk, figuurtje: nieuw })
    // Te weinig: even tonen hoe het zou staan, zonder het te bewaren.
    const nog = prijs - vrij
    setProef({ figuurtje: nieuw, tip: lezer ? `Nog ${nog} ${nog === 1 ? 'ster' : 'sterren'} sparen, dan kun je ${stuk.naam.toLowerCase()} kopen.` : zin.sparen })
    if (!lezer) leesVoor(zin.sparen)
    setHuppel((n) => n + 1)
    window.clearTimeout(proefKlok.current)
    proefKlok.current = window.setTimeout(() => setProef(null), 2600)
  }

  async function klaar() {
    if (!bron) return
    setBezig(true)
    setFout('')
    try {
      await bron.figuurtjeBewaren(kind!.id, figuurtje)
      await herlaad()
      zeg('Mooi!')
      navigate(`/kind/${kind!.id}`)
    } catch (e) {
      setFout(foutmelding(e as Error))
      setBezig(false)
    }
  }

  const getoond = proef?.figuurtje ?? figuurtje

  const thema = themaVan(kind)
  const terugKnop = (
    <Link to={`/kind/${kind.id}`} className="rond" aria-label="Terug zonder bewaren">
      <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M15 18l-6-6l6-6" /></svg>
    </Link>
  )
  const voorleesKnop = !lezer && kanVoorlezen() && (
    <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(zin.kleerkast)}>
      <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
    </button>
  )
  const mijlpaalPil = winkel && !v.allesVrij && <SterrenPil aantal={vrij} />

  return (
    <div className={`kind ${kleurKlasse(kind)}${thema ? ` thema thema-${thema} thema-scherm-figuurtje` : ''}`}>
      <div className={`kleerkast${lezer ? '' : ' prenten'}`}>
        {thema ? (
          <ThemaKop thema={thema} scherm="figuurtje" titel="Mijn figuurtje" lezer={lezer} links={terugKnop}
                    rechts={<>{voorleesKnop}{mijlpaalPil}</>} />
        ) : (
          <header className="kop">
            {terugKnop}
            {lezer
              ? <h1 className="kop-titel display">Mijn figuurtje</h1>
              : <>{voorleesKnop}<span style={{ flexGrow: 1 }} /></>}
            {mijlpaalPil}
          </header>
        )}

        <div className="kleerkast-inhoud">
          <section className="podium" aria-label="Je figuurtje">
            {proef && (
              <p className="podium-tip" role="status">
                <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" /></svg>
                {proef.tip}
              </p>
            )}
            <Figuurtje key={huppel} figuurtje={getoond} className={`podium-figuur${huppel ? ' huppel' : ''}${proef ? ' proef' : ''}`}
                       label={`Figuurtje van ${kind.naam}`} />
          </section>

          <section className="kast">
            <div className="kast-tabs" role="tablist" aria-label="Wat wil je veranderen?">
              {zichtbareCategorieen(lezer).map((c) => (
                <button key={c.id} type="button" role="tab" className="kast-tab" aria-selected={c.id === cat} aria-label={c.naam}
                        onClick={() => { setCat(c.id); setProef(null); zeg(c.naam) }}>
                  <svg className="ic" viewBox="0 0 24 24" width={lezer ? 28 : 40} height={lezer ? 28 : 40} aria-hidden="true"><path d={c.icoon} /></svg>
                  {lezer && <span>{c.naam}</span>}
                </button>
              ))}
            </div>

            <div className="kast-keuzes" role="tabpanel">
              {zichtbareStukken(info, lezer).filter((s) => teZien(cat, s)).map((s) => {
                const eigen = isVrij(cat, s, v)
                const prijs = prijsVoor(s, v)
                return (
                  <button key={s.id} type="button" className={`kast-keuze${eigen ? '' : ' op-slot'}${!eigen && vrij >= prijs ? ' te-koop' : ''}`}
                          aria-pressed={figuurtje[cat] === s.id} aria-label={eigen ? s.naam : `${s.naam}, kost ${prijs} sterren`} onClick={() => kies(s)}>
                    <Figuurtje figuurtje={{ ...figuurtje, [cat]: s.id }} uitsnede={info.uitsnede} className="kast-prent" />
                    {!eigen && <span className="slotje" aria-hidden="true"><svg className="ic" viewBox="0 0 24 24" width="20" height="20"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" /></svg></span>}
                    {!eigen && (
                      <span className="prijs-label display" aria-hidden="true"><Ster grootte={18} />{prijs}</span>
                    )}
                    {lezer && <span className="kast-naam">{s.naam}</span>}
                  </button>
                )
              })}
            </div>

            {info.kleur && (
              <div className="kast-kleuren" role="group" aria-label="Kleur">
                {Object.entries(info.kleur.palet).map(([naam, hex]) => (
                  <button key={naam} type="button" className="kast-kleur" style={{ background: hex }} aria-label={naam}
                          aria-pressed={figuurtje[info.kleur!.veld] === naam}
                          onClick={() => { zeg(naam); wijzig({ ...figuurtje, [info.kleur!.veld]: naam }) }} />
                ))}
              </div>
            )}

            {fout && <p className="fout" role="alert">{fout}</p>}

            <div className="kast-acties">
              <button type="button" className="kast-actie" aria-label="Ongedaan maken" disabled={!vorige.length}
                      onClick={() => { setFiguurtje(vorige[vorige.length - 1]); setVorige((h) => h.slice(0, -1)); setProef(null) }}>
                <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
                {lezer && <span>Terug</span>}
              </button>
              <button type="button" className="kast-actie" aria-label="Verrassing"
                      onClick={() => { zeg('Verrassing!'); wijzig(verrassing(v, figuurtje, Math.random, teZien)) }}>
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
                   prent={<Figuurtje figuurtje={koop.figuurtje} uitsnede={categorie(koop.cat).uitsnede} />}
                   koop={async () => {
                     await bron.kopen(kind.id, koop.cat, koop.stuk.id, koop.stuk.naam)
                     await ververs()
                     wijzig(koop.figuurtje)
                   }}
                   sluit={() => setKoop(null)} />
      )}
    </div>
  )
}
