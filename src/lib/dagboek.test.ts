import { describe, expect, it } from 'vitest'
import { demoGebruikers } from '../data/gezin.ts'
import { demoBron } from './bron/demoBron.ts'

// Het Dagboek (docs/sterrenpot-dagboek.md): pas na aanzetten door een ouder, een dag per kind, geen sterren.
const luca = demoGebruikers.filter((k) => k.rol === 'kind')[0].id
const invoer = { gevoel: 'blij' as const, redenen: ['school' as const], tekst: 'Leuk', tekening: null, wil_praten: true }

describe('dagboek in de demo', () => {
  it('opslaan kan pas als een ouder het aanzette en overschrijft dezelfde dag', async () => {
    const b = demoBron(demoGebruikers.filter((k) => k.rol === 'kind'))
    await expect(b.dagboekOpslaan(luca, invoer)).rejects.toThrow()
    expect(await b.dagboekInstellen(luca, true, null)).toBe('ingesteld')
    const voor = (await b.saldi())[luca].saldo
    await b.dagboekOpslaan(luca, invoer)
    await b.dagboekOpslaan(luca, { ...invoer, gevoel: 'moe' })
    const o = await b.dagboekOverzicht()
    expect(o.aan[luca]).toBe(true)
    expect(o.dagen).toHaveLength(1)
    expect(o.dagen[0].gevoel).toBe('moe')
    expect((await b.saldi())[luca].saldo).toBe(voor)
    await b.dagboekGezien(luca, o.dagen[0].dag)
    expect((await b.dagboekOverzicht()).dagen[0].gezien_op).not.toBeNull()
    expect(await b.dagboekWeek(luca)).toHaveLength(1)
  })
})
