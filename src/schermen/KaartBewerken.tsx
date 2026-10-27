import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { huisVan } from '../data/huis.ts'
import { gebouwen, kidKleur, U, WERELD_BREED, WERELD_HOOG, type GebouwBeeld } from '../data/wereld.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { MAX_HUIZEN, huisRechthoek } from '../lib/wereld/kaart.ts'
import {
  DECOR, DECOR_NAAM, GEBIEDEN, MAX_NIEUW, effectieveItems, gebiedVan, haalWeg, herstelGebied, isWisbaar, itemRechthoek, kanHier, maakGebiedKaart, nieuwId, verplaats, zetErbij,
  type GebiedId, type Item, type ItemSoort, type Opgeslagen,
} from '../lib/wereld/gebieden.ts'
import { Tekenaar } from '../lib/wereld/tekenen.ts'
import OuderKader from './OuderKader.tsx'
import './kaartbewerken.css'

// Kaart bewerken (docs/wereld-dorp.md): de ouders zetten de huizen van de kinderen, de gebouwen, bomen en paden van elk gebied
// op de gewenste plek. Alleen de verschillen met de standaard worden bewaard; wat de nachtroutine toevoegt, verschijnt vanzelf.

type Gereedschap =
  | { k: 'kies' }
  | { k: 'plaats'; soort: ItemSoort; ref: string }
  | { k: 'pad'; breed: 1 | 2 }
  | { k: 'padwis' }
  | { k: 'gum' }

type Tab = 'kies' | 'huizen' | 'gebouwen' | 'decor' | 'paden'

export default function KaartBewerken() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data } = useGegevens(bron ? () => bron.wereldKaart() : null, [bron])
  return (
    <OuderKader titel="Kaart bewerken">
      {!magBeheren && <p className="tip">De kaart bewerken doe je op de gsm van mama of papa.</p>}
      {data && magBeheren && <Bewerker begin={data} />}
    </OuderKader>
  )
}

/** Waar komt de voet van een item te staan als je op een tegel tikt? */
const anker = (soort: ItemSoort, tx: number, ty: number): { x: number; y: number } =>
  soort === 'huis' ? { x: tx + 0.5, y: ty + 0.4 } : soort === 'gebouw' ? { x: tx + 0.5, y: ty + 0.5 } : { x: tx + 0.5, y: ty + 0.85 }

function Bewerker({ begin }: { begin: Opgeslagen }) {
  const { bron, kinderen } = useSessie()
  const bewoners = useMemo(() => kinderen.slice(0, MAX_HUIZEN), [kinderen])
  const kidIds = useMemo(() => bewoners.map((k) => k.id), [bewoners])
  const kinderHuizen = useMemo(() => bewoners.map((k) => { const huis = huisVan(k); return { id: k.id, naam: k.naam, model: huis.model, huis, kleur: kidKleur[k.thema ?? 'blauw'] } }), [bewoners])
  const kleurVan = (id: string) => kinderHuizen.find((h) => h.id === id)?.kleur ?? '#6A5BD1'

  const [o, setO] = useState<Opgeslagen>(begin)
  const [bewaard, setBewaard] = useState(JSON.stringify(begin))
  const [geschiedenis, setGeschiedenis] = useState<Opgeslagen[]>([])
  const [gebied, setGebied] = useState<GebiedId>('dorp')
  const [tab, setTab] = useState<Tab>('kies')
  const [gereedschap, setGereedschap] = useState<Gereedschap>({ k: 'kies' })
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [eerste, setEerste] = useState<{ tx: number; ty: number } | null>(null)
  const [zoom, setZoom] = useState<1 | 2 | 3>(2)
  const [raster, setRaster] = useState(true)
  const [melding, setMelding] = useState('')
  const [herstelVraag, setHerstelVraag] = useState(false)
  const [bezig, setBezig] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vlakRef = useRef<SVGSVGElement>(null)

  const items = useMemo(() => effectieveItems(kidIds, o), [kidIds, o])
  const alleGebouwen = gebouwen as GebouwBeeld[]
  const { kaart, huizen: plekken, gebouwen: gebouwHier } = useMemo(() => maakGebiedKaart(gebied, items, kinderHuizen, kleurVan, alleGebouwen), [gebied, items, kinderHuizen, alleGebouwen]) // eslint-disable-line react-hooks/exhaustive-deps
  const huizen = useMemo(() => plekken.map((h) => { const k = kinderHuizen.find((x) => x.id === h.id)!; return { ...h, naam: k.naam, huis: k.huis, kleur: k.kleur } }), [plekken, kinderHuizen])
  const hier = useMemo(() => items.filter((i) => i.gebied === gebied), [items, gebied])
  const maat = useMemo(() => ({
    huis: (ref: string, x: number, y: number) => {
      const k = kinderHuizen.find((h) => h.id === ref)
      return k ? huisRechthoek({ id: ref, model: k.model, deurX: x, deurY: y }) : null
    },
  }), [kinderHuizen])
  const vuil = JSON.stringify(o) !== bewaard
  const gekozenItem = gekozen ? items.find((i) => i.id === gekozen) : undefined

  // Het gebied tekenen met dezelfde tekenaar als de wereld, beeldvullend; de plaatjes laden even, dus een paar keer per seconde.
  const tekenRef = useRef({ kaart, huizen, gebouwHier })
  useEffect(() => { tekenRef.current = { kaart, huizen, gebouwHier } }, [kaart, huizen, gebouwHier])
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const tek = new Tekenaar(cv, 1.2)
    tek.rustig = true
    const teken = () => {
      const { kaart: k, huizen: h, gebouwHier: g } = tekenRef.current
      tek.teken({
        t: 0, kaart: k, huizen: h, gebouwen: g, me: { x: -999, y: -999, face: 'down', moving: false, fase: 0 }, mijnId: '', kleur: '#2D6BD6',
        figuurtjes: {}, kleurVan: {}, overzicht: true,
      })
    }
    // een nieuwe maat wist het canvas: meteen opnieuw tekenen
    const pas = () => { const r = cv.getBoundingClientRect(); if (r.width > 0) { tek.zet(r.width, r.height); teken() } }
    pas()
    const waarnemer = new ResizeObserver(pas)
    waarnemer.observe(cv)
    const tik = setInterval(teken, 200)
    return () => { clearInterval(tik); waarnemer.disconnect() }
  }, [zoom])

  const wijzig = (nieuw: Opgeslagen) => { setGeschiedenis((h) => [...h.slice(-40), o]); setO(nieuw); setMelding('') }
  const ongedaanMaken = () => { const v = geschiedenis[geschiedenis.length - 1]; if (v) { setO(v); setGeschiedenis((h) => h.slice(0, -1)); setMelding('') } }
  const aantalNieuw = (o.nieuw ?? []).length

  /** Zet een huis, gebouw of ding op een tegel; een bestaand item verplaatst. */
  function plaats(soort: ItemSoort, ref: string, tx: number, ty: number, bestaand?: string): boolean {
    const a = anker(soort, tx, ty)
    const id = bestaand ?? (soort === 'ding' ? nieuwId(ref) : `${soort}:${ref}`)
    const item: Item = { id, soort, ref, gebied, x: a.x, y: a.y }
    return zet(item, !bestaand && soort === 'ding')
  }
  function zet(item: Item, nieuw: boolean): boolean {
    if (nieuw && aantalNieuw >= MAX_NIEUW) { setMelding('Er staat al heel veel extra op de kaart.'); return false }
    if (!kanHier(item, items, maat)) { setMelding('Daar past het niet: iets staat in de weg of het is aan de rand van het gebied.'); return false }
    wijzig(nieuw ? zetErbij(o, kidIds, item) : verplaats(o, kidIds, item.id, item.gebied, item.x, item.y))
    setGekozen(item.id)
    return true
  }

  function tik(ev: React.PointerEvent<SVGSVGElement>) {
    const r = ev.currentTarget.getBoundingClientRect()
    const px = (ev.clientX - r.left) / r.width * WERELD_BREED, py = (ev.clientY - r.top) / r.height * WERELD_HOOG
    const tx = Math.max(0, Math.min(55, Math.floor(px / U))), ty = Math.max(0, Math.min(27, Math.floor(py / U)))
    // wat staat hier? het voorste item dat de tik raakt
    const geraakt = hier.filter((i) => i.soort !== 'pad').filter((i) => { const q = itemRechthoek(i, maat); return px > q[0] - 8 && px < q[2] + 8 && py > q[1] - 8 && py < q[3] + 8 }).sort((a, b) => b.y - a.y)[0]
    if (gereedschap.k === 'plaats') { plaats(gereedschap.soort, gereedschap.ref, tx, ty, gereedschap.soort === 'ding' ? undefined : `${gereedschap.soort}:${gereedschap.ref}`); return }
    if (gereedschap.k === 'gum') {
      if (geraakt && isWisbaar(geraakt)) { wijzig(haalWeg(o, kidIds, geraakt.id)); setGekozen(null) }
      else { const pad = hier.find((i) => i.soort === 'pad' && i.x === tx && i.y === ty); if (pad) wijzig(haalWeg(o, kidIds, pad.id)); else setMelding('Hier is niets om weg te halen. Huizen en gebouwen verplaats je alleen.') }
      return
    }
    if (gereedschap.k === 'pad' || gereedschap.k === 'padwis') {
      if (!eerste) { setEerste({ tx, ty }); setMelding(gereedschap.k === 'pad' ? 'Tik nu waar het pad moet eindigen.' : 'Tik nu de andere hoek van het stuk dat weg moet.'); return }
      let n = o
      if (gereedschap.k === 'pad') {
        const breed = gereedschap.breed, punten: [number, number][] = []
        const stap = (a: number, b: number) => (b >= a ? 1 : -1)
        for (let x = eerste.tx; x !== tx + stap(eerste.tx, tx); x += stap(eerste.tx, tx)) for (let d = 0; d < breed; d++) punten.push([x, eerste.ty + d])
        for (let y = eerste.ty; y !== ty + stap(eerste.ty, ty); y += stap(eerste.ty, ty)) for (let d = 0; d < breed; d++) punten.push([tx + d, y])
        const bestaand = new Set(hier.filter((i) => i.soort === 'pad').map((i) => i.id))
        let toegevoegd = 0
        for (const [x, y] of punten) {
          if (x < 0 || y < 0 || x > 55 || y > 27) continue
          const id = `pad:${gebied}:${x}:${y}`
          if (bestaand.has(id)) continue
          if ((n.nieuw ?? []).length >= MAX_NIEUW + 400) break
          n = zetErbij(n, kidIds, { id, soort: 'pad', ref: 'pad', gebied, x, y }); bestaand.add(id); toegevoegd++
        }
        if (toegevoegd) wijzig(n); else setMelding('Daar ligt al een pad.')
      } else {
        const x0 = Math.min(eerste.tx, tx), x1 = Math.max(eerste.tx, tx), y0 = Math.min(eerste.ty, ty), y1 = Math.max(eerste.ty, ty)
        for (const i of hier) if (i.soort === 'pad' && i.x >= x0 && i.x <= x1 && i.y >= y0 && i.y <= y1) n = haalWeg(n, kidIds, i.id)
        if (n !== o) wijzig(n); else setMelding('Daar lag geen pad.')
      }
      setEerste(null)
      return
    }
    // kiezen: een item aantikken kiest het, daarna verplaatst een tik op een andere plek het
    if (geraakt) { setGekozen(geraakt.id === gekozen ? null : geraakt.id); setMelding(''); return }
    if (gekozenItem && gekozenItem.gebied === gebied) plaats(gekozenItem.soort, gekozenItem.ref, tx, ty, gekozenItem.id)
    else setGekozen(null)
  }

  const verschuif = (dx: number, dy: number) => { if (gekozenItem) zet({ ...gekozenItem, x: gekozenItem.x + dx, y: gekozenItem.y + dy }, false) }
  const kies = (g: Gereedschap) => { setGereedschap(g); setEerste(null); setMelding(''); if (g.k !== 'kies') setGekozen(null) }
  const naamVan = (i: Item) => i.soort === 'huis' ? `Huis van ${kinderHuizen.find((k) => k.id === i.ref)?.naam ?? '?'}` : i.soort === 'gebouw' ? (gebouwen.find((b) => b.id === i.ref)?.naam ?? i.ref) : DECOR_NAAM[i.ref as keyof typeof DECOR_NAAM] ?? i.ref

  async function bewaarNu() {
    if (!bron) return
    setBezig(true)
    try { await bron.wereldKaartOpslaan(o); setBewaard(JSON.stringify(o)); setMelding('Bewaard. De kinderen zien het zodra ze de wereld opnieuw openen.') }
    catch (e) { setMelding((e as Error).message || 'Bewaren lukte niet.') }
    finally { setBezig(false) }
  }

  const tabs: [Tab, string][] = [['kies', 'Kiezen'], ['huizen', 'Huizen'], ['gebouwen', 'Gebouwen'], ['decor', 'Decor'], ['paden', 'Paden']]
  const isPlaats = (soort: ItemSoort, ref: string) => gereedschap.k === 'plaats' && gereedschap.soort === soort && gereedschap.ref === ref

  return (
    <div className="kaartbew">
      <p className="tip">Tik een huis of gebouw om het te kiezen, daarna op de nieuwe plek. Zet bomen, banken en paden erbij. De poorten naar andere gebieden blijven altijd vrij.</p>
      <div className="kb-gebieden" role="tablist" aria-label="Gebied">
        {GEBIEDEN.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={g.id === gebied} className={`kb-chip${g.id === gebied ? ' aan' : ''}`} onClick={() => { setGebied(g.id); setEerste(null); setGekozen(null) }}>{g.naam}</button>
        ))}
      </div>
      <div className="kb-balk">
        <span className="kb-titel">{gebiedVan(gebied).naam}{gebiedVan(gebied).vast ? ' · plein, vijver en voetbalveld liggen vast' : ''}</span>
        <div className="kb-zoom" role="group" aria-label="Inzoomen">
          {([1, 2, 3] as const).map((z) => <button key={z} type="button" className={`kb-chip klein${zoom === z ? ' aan' : ''}`} aria-pressed={zoom === z} onClick={() => setZoom(z)}>{z}×</button>)}
          <button type="button" className={`kb-chip klein${raster ? ' aan' : ''}`} aria-pressed={raster} onClick={() => setRaster((x) => !x)}>Raster</button>
        </div>
      </div>
      <div className="kb-vak">
        <div className="kb-doek" style={{ width: `${zoom * 100}%` }}>
          <canvas ref={canvasRef} className="kb-canvas" role="img" aria-label={`Kaart van ${gebiedVan(gebied).naam}`} />
          <svg ref={vlakRef} className="kb-vlak" viewBox={`0 0 ${WERELD_BREED / U} ${WERELD_HOOG / U}`} onPointerDown={tik}>
            {raster && (
              <g stroke="rgba(255,255,255,.35)" strokeWidth="0.04">
                {Array.from({ length: 55 }, (_, i) => <line key={'v' + i} x1={i + 1} y1="0" x2={i + 1} y2="28" />)}
                {Array.from({ length: 27 }, (_, i) => <line key={'h' + i} x1="0" y1={i + 1} x2="56" y2={i + 1} />)}
              </g>
            )}
            {gekozenItem && gekozenItem.gebied === gebied && (() => {
              const q = itemRechthoek(gekozenItem, maat).map((v) => v / U)
              return <rect x={q[0]} y={q[1]} width={q[2] - q[0]} height={q[3] - q[1]} rx="0.25" fill="rgba(45,107,214,.14)" stroke="#2D6BD6" strokeWidth="0.14" strokeDasharray="0.5 0.35" />
            })()}
            {eerste && <rect x={eerste.tx} y={eerste.ty} width="1" height="1" fill="rgba(242,194,48,.6)" stroke="#8A5E12" strokeWidth="0.1" />}
          </svg>
        </div>
      </div>
      <p className="kb-melding" role="status" aria-live="polite">{melding}</p>

      <div className="kb-tabs" role="tablist" aria-label="Gereedschap">
        {tabs.map(([t, n]) => <button key={t} type="button" role="tab" aria-selected={tab === t} className={`kb-chip${tab === t ? ' aan' : ''}`} onClick={() => { setTab(t); if (t === 'kies') kies({ k: 'kies' }) }}>{n}</button>)}
      </div>
      <div className="kb-pal">
        {tab === 'kies' && (
          <>
            <button type="button" className={`kb-tegel${gereedschap.k === 'kies' ? ' sel' : ''}`} onClick={() => kies({ k: 'kies' })}><b>👆</b><span>Kiezen en verplaatsen</span></button>
            <button type="button" className={`kb-tegel${gereedschap.k === 'gum' ? ' sel' : ''}`} onClick={() => kies({ k: 'gum' })}><b>🧽</b><span>Wissen (decor en pad)</span></button>
          </>
        )}
        {tab === 'huizen' && kinderHuizen.map((k) => (
          <button key={k.id} type="button" className={`kb-tegel${isPlaats('huis', k.id) ? ' sel' : ''}`} onClick={() => kies({ k: 'plaats', soort: 'huis', ref: k.id })}><b style={{ background: k.kleur }}>{k.naam[0]}</b><span>Huis van {k.naam}</span></button>
        ))}
        {tab === 'gebouwen' && gebouwen.map((b) => (
          <button key={b.id} type="button" className={`kb-tegel${isPlaats('gebouw', b.id) ? ' sel' : ''}`} onClick={() => kies({ k: 'plaats', soort: 'gebouw', ref: b.id })}><b>🏠</b><span>{b.naam}</span></button>
        ))}
        {tab === 'decor' && DECOR.map((d) => (
          <button key={d} type="button" className={`kb-tegel${isPlaats('ding', d) ? ' sel' : ''}`} onClick={() => kies({ k: 'plaats', soort: 'ding', ref: d })}><b>{d === 'boom' ? '🌳' : d === 'bank' ? '🪑' : d === 'lantaarn' ? '💡' : d === 'doel' ? '🥅' : '🛝'}</b><span>{DECOR_NAAM[d]}</span></button>
        ))}
        {tab === 'paden' && (
          <>
            <button type="button" className={`kb-tegel${gereedschap.k === 'pad' && gereedschap.breed === 1 ? ' sel' : ''}`} onClick={() => kies({ k: 'pad', breed: 1 })}><b>〰</b><span>Smal pad leggen</span></button>
            <button type="button" className={`kb-tegel${gereedschap.k === 'pad' && gereedschap.breed === 2 ? ' sel' : ''}`} onClick={() => kies({ k: 'pad', breed: 2 })}><b>▬</b><span>Breed pad leggen</span></button>
            <button type="button" className={`kb-tegel${gereedschap.k === 'padwis' ? ' sel' : ''}`} onClick={() => kies({ k: 'padwis' })}><b>✂</b><span>Pad weghalen</span></button>
          </>
        )}
      </div>

      {gekozenItem && (
        <div className="kb-gekozen" role="group" aria-label={`${naamVan(gekozenItem)} verplaatsen`}>
          <strong>{naamVan(gekozenItem)}</strong>{gekozenItem.gebied !== gebied && <span className="tip"> (staat in {gebiedVan(gekozenItem.gebied).naam})</span>}
          <div className="kb-pijlen">
            <button type="button" aria-label="Omhoog" onClick={() => verschuif(0, -1)}>▲</button>
            <button type="button" aria-label="Links" onClick={() => verschuif(-1, 0)}>◀</button>
            <button type="button" aria-label="Rechts" onClick={() => verschuif(1, 0)}>▶</button>
            <button type="button" aria-label="Omlaag" onClick={() => verschuif(0, 1)}>▼</button>
            {isWisbaar(gekozenItem) && <button type="button" className="wis" onClick={() => { wijzig(haalWeg(o, kidIds, gekozenItem.id)); setGekozen(null) }}>Wissen</button>}
          </div>
        </div>
      )}

      <div className="knoppenrij kb-acties">
        <button type="button" className="knop" disabled={!geschiedenis.length} onClick={ongedaanMaken}>↶ Ongedaan</button>
        {!herstelVraag
          ? <button type="button" className="knop" onClick={() => setHerstelVraag(true)}>Gebied terugzetten</button>
          : <button type="button" className="knop" onClick={() => { wijzig(herstelGebied(o, kidIds, gebied)); setHerstelVraag(false); setGekozen(null) }}>Zeker? Alles hier terug naar standaard</button>}
        <button type="button" className="knop knop-primair" disabled={!vuil || bezig} onClick={bewaarNu}>{bezig ? 'Bewaren…' : vuil ? 'Bewaar' : 'Bewaard'}</button>
      </div>
      <Link to="/ouder/wereld" className="knop">Kijken in de wereld</Link>
    </div>
  )
}
