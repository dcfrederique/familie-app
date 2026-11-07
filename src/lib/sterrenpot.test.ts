import { describe, expect, it } from 'vitest'
import { demoGebruikers } from '../data/gezin.ts'
import { gezinspotVol, potVol, ruimteEigen, ruimteGezin } from '../data/sterrenpot.ts'
import { demoBron } from './bron/demoBron.ts'

// De sterrenpot (docs/sterrenpot-dagboek.md): sterren in een pot zijn niet vrij, alleen een ouder haalt ze eruit.
const kinderen = demoGebruikers.filter((k) => k.rol === 'kind')
const luca = kinderen[0].id
const feline = kinderen[kinderen.length - 1].id
const pot = (b: ReturnType<typeof demoBron>) => b.potten()

describe('sterrenpot in de demo', () => {
  it('storten maakt de sterren niet-vrij, afronden schrijft ze af', async () => {
    const b = demoBron(kinderen)
    await b.sterrenAanpassen(luca, 100, null, null)
    const voor = (await b.saldi())[luca]
    await b.potInstellen(luca, { aan: true, naam: 'Plopsaland', prent: 'pretpark', doel: 60 }, null)
    await b.potStorten(luca, 25)
    const na = (await b.saldi())[luca]
    expect(na.saldo).toBe(voor.saldo)
    expect(na.vrij).toBe(voor.vrij - 25)
    expect(na.in_pot).toBe(25)
    await expect(b.potStorten(luca, 36)).rejects.toThrow('past niet meer')
    await expect(b.potAfronden(luca, null)).rejects.toThrow('nog niet vol')
    await b.potStorten(luca, 35)
    expect(potVol((await pot(b)).eigen[luca])).toBe(true)
    expect(await b.potAfronden(luca, null)).toBe('afgerond')
    const klaar = (await b.saldi())[luca]
    expect(klaar.saldo).toBe(voor.saldo - 60)
    expect(klaar.in_pot).toBe(0)
    expect((await pot(b)).eigen[luca].aan).toBe(false)
  })

  it('sterren in de pot kan een kind niet uitgeven en een ouder niet afnemen', async () => {
    const b = demoBron(kinderen)
    await b.sterrenAanpassen(luca, 50, null, null)
    const vrij = (await b.saldi())[luca].vrij
    await b.potInstellen(luca, { aan: true, naam: 'Ijsje', prent: 'ijs', doel: 1000 }, null)
    await b.potStorten(luca, vrij)
    await expect(b.potStorten(luca, 1)).rejects.toThrow('niet genoeg vrije sterren')
    await expect(b.sterrenAanpassen(luca, -1, null, null)).rejects.toThrow('te weinig vrije sterren')
  })

  it('alleen een ouder haalt sterren uit de pot (pincode)', async () => {
    const b = demoBron(kinderen)
    await b.sterrenAanpassen(luca, 40, null, null)
    await b.potInstellen(luca, { aan: true, naam: 'x', prent: 'cadeau', doel: 30 }, null)
    await b.potStorten(luca, 20)
    expect(await b.potHalen(luca, 5, '0000')).toBe('pincode_fout')
    expect(await b.potHalen(luca, 5, '1234')).toBe('gehaald')
    expect((await pot(b)).eigen[luca].in_pot).toBe(15)
    await expect(b.potHalen(luca, 16, '1234')).rejects.toThrow('ongeldig')
  })

  it('gezinspot: maximum per kind, samen vol, bij Gedaan elk kind zijn deel af', async () => {
    const b = demoBron(kinderen)
    await b.sterrenAanpassen(luca, 60, null, null)
    await b.sterrenAanpassen(feline, 40, null, null)
    const sLuca = (await b.saldi())[luca].saldo
    const sFeline = (await b.saldi())[feline].saldo
    await b.gezinspotInstellen({ aan: true, naam: 'Dagje uit', prent: 'pretpark', doel: 50, max_per_kind: 30 }, null)
    await b.gezinspotStorten(luca, 30)
    await expect(b.gezinspotStorten(luca, 1)).rejects.toThrow('maximum per kind')
    await expect(b.gezinspotStorten(feline, 25)).rejects.toThrow('past niet meer')
    await b.gezinspotStorten(feline, 20)
    const g = (await pot(b)).gezin!
    expect(gezinspotVol(g)).toBe(true)
    expect(ruimteGezin(g, feline, 100)).toBe(0)
    expect(await b.gezinspotAfronden(null)).toBe('afgerond')
    expect((await b.saldi())[luca].saldo).toBe(sLuca - 30)
    expect((await b.saldi())[feline].saldo).toBe(sFeline - 20)
  })

  it('ruimte voor de knoppen houdt rekening met vrij saldo en doel', () => {
    const p = { kind_id: 'k', aan: true, naam: 'x', prent: 'ijs' as const, doel: 10, in_pot: 7 }
    expect(ruimteEigen(p, 100)).toBe(3)
    expect(ruimteEigen(p, 2)).toBe(2)
  })
})
