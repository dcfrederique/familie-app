import { describe, expect, it } from 'vitest'
import { U, gebouwen } from '../../data/wereld.ts'
import {
  GEBIEDEN, aankomstNa, effectieveItems, haalWeg, herstelGebied, kanHier, leesOpgeslagen, leegOpgeslagen, maakGebiedKaart, padRechthoeken, poortOp, standaardItems, verplaats, zetErbij,
  type GebiedId, type Item,
} from './gebieden.ts'
import { POORT_TEGELS, huisRechthoek, maakTegels, nieuweTegelStand } from './kaart.ts'

const kids = ['luca', 'yuna', 'feline']
const kleur = () => '#2D6BD6'
const leden = kids.map((id) => ({ id, naam: id, model: 'huisje' }))

describe('de gebieden', () => {
  it('hebben poorten die in beide richtingen kloppen', () => {
    for (const g of GEBIEDEN) for (const p of g.poorten) {
      if (p.doel === 'springland') continue
      const buur = GEBIEDEN.find((x) => x.id === p.doel)!
      expect(buur.poorten.some((q) => q.doel === g.id), `${g.id} naar ${p.doel}`).toBe(true)
    }
  })
  it('zijn allemaal bereikbaar vanuit het dorp', () => {
    const gezien = new Set<string>(['dorp']), rij = ['dorp']
    for (const id of rij) for (const p of GEBIEDEN.find((g) => g.id === id)!.poorten) if (p.doel !== 'springland' && !gezien.has(p.doel)) { gezien.add(p.doel); rij.push(p.doel) }
    expect([...gezien].sort()).toEqual(GEBIEDEN.map((g) => g.id).sort())
  })
  it('laten in elk gebied de poorttegels vrij en bereikbaar vanaf de aankomstplek', () => {
    const items = effectieveItems(kids)
    for (const g of GEBIEDEN) {
      const { kaart } = maakGebiedKaart(g.id, items, leden, kleur, gebouwen)
      const tegels = maakTegels(kaart)
      for (const p of g.poorten) {
        for (const [tx, ty] of POORT_TEGELS[p.zijde]) expect(tegels.kan(tx, ty), `${g.id} ${p.zijde} ${tx},${ty}`).toBe(true)
        const aan = p.doel === 'springland' ? null : aankomstNa({ zijde: p.zijde === 'n' ? 'z' : p.zijde === 'z' ? 'n' : p.zijde === 'w' ? 'o' : 'w', doel: g.id })
        if (aan) expect(tegels.kan(aan.tegel[0], aan.tegel[1]), `${g.id} aankomst`).toBe(true)
      }
      // van elke poort naar elke andere poort is een looppad
      const poorten = g.poorten.map((p) => POORT_TEGELS[p.zijde][0])
      for (const a of poorten) for (const b of poorten) expect(tegels.pad(a[0], a[1], b[0], b[1]), `${g.id}`).not.toBeNull()
    }
  })
  it('hebben alleen in het dorp het vaste dorpsdecor', () => {
    const items = effectieveItems(kids)
    expect(maakGebiedKaart('dorp', items, leden, kleur, gebouwen).kaart.vast).toBe(true)
    expect(maakGebiedKaart('bos', items, leden, kleur, gebouwen).kaart.vast).toBe(false)
  })
})

describe('de standaardplekken', () => {
  it('zetten de huizen en gebouwen in het dorp en laten de andere gebieden leeg op de wegen na', () => {
    const items = standaardItems(kids)
    expect(items.filter((i) => i.soort === 'huis').map((i) => i.gebied)).toEqual(['dorp', 'dorp', 'dorp'])
    expect(items.filter((i) => i.soort === 'gebouw').length).toBe(gebouwen.length)
    // het bos is als eerste volgebouwd (docs/wereld-levendig.md); de andere gebieden blijven leeg op de wegen na
    for (const g of GEBIEDEN.filter((x) => x.id !== 'dorp' && x.id !== 'bos')) expect(items.filter((i) => i.gebied === g.id && i.soort !== 'pad')).toEqual([])
  })
  it('hebben unieke id\'s', () => {
    const ids = standaardItems(kids).map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('geven elk kind in het dorp een huis dat bereikbaar is', () => {
    const { kaart, huizen } = maakGebiedKaart('dorp', effectieveItems(kids), leden, kleur, gebouwen)
    expect(huizen.length).toBe(3)
    const tegels = maakTegels(kaart)
    for (const h of huizen) expect(tegels.pad(Math.floor(huizen[0].deurX / U), Math.floor((huizen[0].deurY! + 70) / U), Math.floor(h.deurX / U), Math.floor((h.deurY! + 22) / U))).not.toBeNull()
  })
})

describe('het bos', () => {
  it('heeft bomen en paddenstoelen en laat poort en wegen vrij', () => {
    const bos = standaardItems(kids).filter((i) => i.gebied === 'bos' && i.soort === 'ding')
    expect(bos.filter((i) => i.ref === 'boom').length).toBeGreaterThan(20)
    expect(bos.filter((i) => i.ref === 'paddenstoel').length).toBeGreaterThan(5)
    const { kaart } = maakGebiedKaart('bos', effectieveItems(kids), leden, kleur, gebouwen)
    const tegels = maakTegels(kaart)
    for (const [tx, ty] of POORT_TEGELS.o) for (let x = tx - 25; x <= tx; x++) expect(tegels.kan(x, ty), `${x},${ty}`).toBe(true)
  })
})

describe('aanpassen door de ouders', () => {
  it('verplaatst een huis naar een ander gebied en onthoudt het alleen als verschil', () => {
    const o = verplaats(leegOpgeslagen(), kids, 'huis:luca', 'bos', 10.5, 10.4)
    const luca = effectieveItems(kids, o).find((i) => i.id === 'huis:luca')!
    expect(luca).toMatchObject({ gebied: 'bos', x: 10.5 })
    expect(effectieveItems(kids, o).length).toBe(effectieveItems(kids).length)
    expect(Object.keys(o.plek ?? {})).toEqual(['huis:luca'])
  })
  it('haalt decor en paden weg en zet ze terug', () => {
    const boom = standaardItems(kids).find((i) => i.soort === 'ding')!
    const o = haalWeg(leegOpgeslagen(), kids, boom.id)
    expect(effectieveItems(kids, o).some((i) => i.id === boom.id)).toBe(false)
    const pad = standaardItems(kids).find((i) => i.soort === 'pad')!
    const zonder = haalWeg(leegOpgeslagen(), kids, pad.id)
    expect(effectieveItems(kids, zonder).some((i) => i.id === pad.id)).toBe(false)
    expect(effectieveItems(kids, zetErbij(zonder, kids, pad)).some((i) => i.id === pad.id)).toBe(true)
  })
  it('zet iets nieuws neer, verplaatst en verwijdert het', () => {
    const nieuw: Item = { id: 'nieuw:boom:a', soort: 'ding', ref: 'boom', gebied: 'bos', x: 20.5, y: 10.85 }
    let o = zetErbij(leegOpgeslagen(), kids, nieuw)
    expect(effectieveItems(kids, o).some((i) => i.id === nieuw.id)).toBe(true)
    o = verplaats(o, kids, nieuw.id, 'bos', 22.5, 10.85)
    expect(effectieveItems(kids, o).find((i) => i.id === nieuw.id)!.x).toBe(22.5)
    o = haalWeg(o, kids, nieuw.id)
    expect(effectieveItems(kids, o).some((i) => i.id === nieuw.id)).toBe(false)
  })
  it('herstelt een gebied naar de standaard', () => {
    let o = verplaats(leegOpgeslagen(), kids, 'huis:luca', 'bos', 10.5, 10.4)
    o = zetErbij(o, kids, { id: 'nieuw:boom:a', soort: 'ding', ref: 'boom', gebied: 'bos', x: 20.5, y: 10.85 })
    o = verplaats(o, kids, 'huis:yuna', 'dorp', 20.5, 10.4)
    const na = effectieveItems(kids, herstelGebied(o, kids, 'bos'))
    expect(na.find((i) => i.id === 'huis:luca')!.gebied).toBe('dorp')
    expect(na.some((i) => i.id === 'nieuw:boom:a')).toBe(false)
    expect(na.find((i) => i.id === 'huis:yuna')!.x).toBe(20.5)
  })
  it('weigert plekken die bezet zijn, buiten het gebied vallen of een poort versperren', () => {
    const items = effectieveItems(kids)
    const winkel = items.find((i) => i.id === 'gebouw:winkel')!
    const huis = items.find((i) => i.id === 'huis:luca')!
    expect(kanHier({ ...huis, x: winkel.x, y: winkel.y }, items)).toBe(false)
    expect(kanHier({ ...huis, gebied: 'strand', x: 20.5, y: 10.4 }, items)).toBe(true)
    expect(kanHier({ ...huis, gebied: 'strand', x: 0.5, y: 10.4 }, items)).toBe(false)
    expect(kanHier({ ...huis, gebied: 'strand', x: 52.5, y: 12.4 }, items)).toBe(false)
  })
  it('rekent met de echte maat van een huis (in beeldpunten) bij het neerzetten', () => {
    const items = effectieveItems(kids)
    const maat = { huis: (ref: string, x: number, y: number) => huisRechthoek({ id: ref, model: 'huisje', deurX: x, deurY: y }) }
    const luca = items.find((i) => i.id === 'huis:luca')!
    expect(kanHier({ ...luca, gebied: 'strand', x: 20.5, y: 10.4 }, items, maat)).toBe(true)
    expect(kanHier({ ...luca, gebied: 'strand', x: 53.5, y: 10.4 }, items, maat)).toBe(false)
  })
  it('leest alleen geldige gegevens uit de database', () => {
    const o = leesOpgeslagen({ plek: { 'huis:luca': { g: 'bos', x: 3, y: 4 }, x: { g: 'nergens', x: 1, y: 1 }, y: null }, nieuw: [{ id: 'a', soort: 'ding', ref: 'boom', gebied: 'bos', x: 1, y: 2 }, { id: 'b', soort: 'ding', ref: 'kasteel', gebied: 'bos', x: 1, y: 2 }, { id: 'c', soort: 'pad', gebied: 'meer', x: 1.2, y: 3 }] })
    expect(Object.keys(o.plek!).sort()).toEqual(['huis:luca', 'y'])
    expect(o.nieuw!.map((i) => i.id)).toEqual(['a', 'c'])
    expect(leesOpgeslagen(null)).toEqual({ v: 1 })
  })
})

describe('paden en poorten', () => {
  it('voegt tegels van een rechte weg samen tot één rechthoek', () => {
    const paden: Item[] = []
    for (let x = 3; x < 9; x++) for (const y of [4, 5]) paden.push({ id: `${x}${y}`, soort: 'pad', ref: 'pad', gebied: 'dorp' as GebiedId, x, y })
    expect(padRechthoeken(paden)).toEqual([[3 * U, 4 * U, 9 * U, 6 * U]])
  })
  it('herkent een poort en de aankomst aan de andere kant', () => {
    expect(poortOp('dorp', 27, 4)?.doel).toBe('berg')
    expect(poortOp('dorp', 20, 4)).toBeNull()
    expect(aankomstNa({ zijde: 'n', doel: 'berg' })).toEqual({ gebied: 'berg', tegel: [27, 23] })
    expect(aankomstNa({ zijde: 'w', doel: 'springland' })).toBeNull()
  })
  it('laat het figuurtje van het dorp naar het bos lopen via de poorten', () => {
    // tegel voor tegel: dorp noord naar berg, berg west naar bos
    const items = effectieveItems(kids)
    const berg = maakGebiedKaart('berg', items, leden, kleur, gebouwen)
    const tegels = maakTegels(berg.kaart)
    expect(tegels.pad(27, 23, 3, 12)).not.toBeNull()
    expect(nieuweTegelStand().prog).toBe(0)
  })
})
