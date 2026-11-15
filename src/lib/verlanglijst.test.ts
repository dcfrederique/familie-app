import { describe, expect, it } from 'vitest'
import { demoGebruikers } from '../data/gezin.ts'
import { MAX_WENSEN, wensPrenten } from '../data/verlanglijst.ts'
import { demoBron } from './bron/demoBron.ts'

// Mijn verlanglijstje (docs/verlanglijstje.md): pas na aanzetten door een ouder, hoogstens 10 wensen en 3 allerliefste,
// de status ziet enkel een ouder, geen sterren.
const kinderen = demoGebruikers.filter((k) => k.rol === 'kind')
const luca = kinderen[0].id
const yuna = kinderen[1].id

describe('verlanglijstje in de demo', () => {
  it('toevoegen kan pas als een ouder het aanzette', async () => {
    const b = demoBron(kinderen)
    await expect(b.verlanglijstToevoegen(luca, { soort: 'prent', prent: 'bal' })).rejects.toThrow()
    expect(await b.verlanglijstInstellen(luca, true, null)).toBe('ingesteld')
    const voor = (await b.saldi())[luca].saldo
    await b.verlanglijstToevoegen(luca, { soort: 'prent', prent: 'bal' })
    expect((await b.verlanglijst(luca))).toHaveLength(1)
    expect((await b.saldi())[luca].saldo).toBe(voor)
  })

  it('maximaal 10 wensen en 3 allerliefste', async () => {
    const b = demoBron(kinderen)
    await b.verlanglijstInstellen(luca, true, null)
    for (let i = 0; i < MAX_WENSEN; i++) await b.verlanglijstToevoegen(luca, { soort: 'tekst', tekst: `wens ${i}` })
    await expect(b.verlanglijstToevoegen(luca, { soort: 'prent', prent: 'auto' })).rejects.toThrow()
    const lijst = await b.verlanglijst(luca)
    for (const w of lijst.slice(0, 3)) await b.verlanglijstFavoriet(luca, w.id, true)
    await expect(b.verlanglijstFavoriet(luca, lijst[3].id, true)).rejects.toThrow()
    await b.verlanglijstFavoriet(luca, lijst[0].id, false)
    await b.verlanglijstFavoriet(luca, lijst[3].id, true)
  })

  it('kort de tekst in op 40 tekens', async () => {
    const b = demoBron(kinderen)
    await b.verlanglijstInstellen(luca, true, null)
    await b.verlanglijstToevoegen(luca, { soort: 'tekst', tekst: 'x'.repeat(80) })
    expect((await b.verlanglijst(luca))[0].tekst).toHaveLength(40)
  })

  it('het kind ziet nooit de status, een ouder wel en kan hem zetten', async () => {
    const b = demoBron(kinderen)
    await b.verlanglijstInstellen(luca, true, null)
    await b.verlanglijstToevoegen(luca, { soort: 'prent', prent: 'trein' })
    const w = (await b.verlanglijst(luca))[0]
    expect(w.status).toBeUndefined()
    await b.verlanglijstStatus(w.id, 'gekocht')
    expect((await b.verlanglijst(luca))[0].status).toBeUndefined()
    expect((await b.verlanglijstOverzicht()).wensen[0].status).toBe('gekocht')
  })

  it('een kind ziet en verwijdert enkel de eigen wensen', async () => {
    const b = demoBron(kinderen)
    await b.verlanglijstInstellen(luca, true, null)
    await b.verlanglijstInstellen(yuna, true, null)
    await b.verlanglijstToevoegen(luca, { soort: 'prent', prent: 'bal' })
    await b.verlanglijstToevoegen(yuna, { soort: 'prent', prent: 'pop' })
    const wensLuca = (await b.verlanglijst(luca))[0]
    await b.verlanglijstVerwijderen(yuna, wensLuca.id)
    expect(await b.verlanglijst(luca)).toHaveLength(1)
    expect(await b.verlanglijst(yuna)).toHaveLength(1)
    await b.verlanglijstVerwijderen(luca, wensLuca.id)
    expect(await b.verlanglijst(luca)).toHaveLength(0)
  })
})

describe('prentjes voor het verlanglijstje', () => {
  it('hebben unieke sleutels, een naam en tekeningen', () => {
    const sleutels = wensPrenten.map((p) => p.sleutel)
    expect(new Set(sleutels).size).toBe(sleutels.length)
    for (const p of wensPrenten) { expect(p.naam.length).toBeGreaterThan(2); expect(p.paden.length).toBeGreaterThan(0) }
    expect(wensPrenten.length).toBeLessThanOrEqual(24)
  })
})
