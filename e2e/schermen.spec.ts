import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { OPEN } from './schermen-open.ts'

// Elk kinderscherm past zonder scrollen op gangbare tablets (liggend en staand) en op een liggende gsm.
// De meetcode is dezelfde als die van het nachtelijke verslag (scripts/schermcontrole.cjs).
// Wat nog niet past, staat in e2e/schermen-open.ts; past het intussen wel, dan moet het daar weg (de test zegt het).
const { vastToeval, TOESTELLEN, GSM, KINDEREN, SCHERMEN, naarScherm, welkomstpad, meet } =
  createRequire(import.meta.url)('../scripts/schermmeting.cjs')

const maten: [string, number, number][] = [
  ...TOESTELLEN.flatMap(([n, w, h]: [string, number, number]) => [[`${n} liggend`, w, h], [`${n} staand`, h, w]]),
  ...GSM,
]

test.describe.configure({ mode: 'parallel' })

KINDEREN.forEach((kind: string, k: number) => {
  maten.forEach(([toestel, w, h], t) => {
    test(`${kind} past op ${toestel} (${w}×${h})`, async ({ browser, baseURL }) => {
      test.setTimeout(120_000)
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })
      await ctx.addInitScript((id) => { try { localStorage.setItem('demo-tablet-kind', id) } catch { /* */ } }, kind)
      await ctx.addInitScript(vastToeval)
      const page = await ctx.newPage()
      await page.goto(`${baseURL}/kind/${kind}`)
      // Thema per kind en toestel, zodat alle thema's aan bod komen.
      await welkomstpad(page, k + t)
      const fout: string[] = []
      for (const scherm of SCHERMEN as string[]) {
        await naarScherm(page, `/kind/${kind}${scherm ? '/' + scherm : ''}`)
        const sleutel = `${kind} ${scherm || 'start'} ${w}x${h}`
        // Zeker zijn dat we echt op dat scherm staan: nooit nog op het welkomstpad. Stuurt de app door
        // (bv. Extra tijd voor wie zelf geen tijd vraagt), dan is dat scherm niet voor dit kind.
        const nu = new URL(page.url()).pathname.replace(/\/$/, '')
        expect(nu, sleutel).not.toContain('/welkom')
        if (nu !== `/kind/${kind}${scherm ? '/' + scherm : ''}`) continue
        const meldingen: string[] = await page.evaluate(meet)
        if (meldingen.length && !OPEN.has(sleutel)) fout.push(`${sleutel}: ${meldingen.slice(0, 3).join('; ')}`)
        // Past een open scherm nu wel: lokaal (nachtelijke controle) rood, zodat de lijst krimpt. In CI enkel een
        // waarschuwing, want schermen op het randje meten op de CI-machine soms net anders.
        if (!meldingen.length && OPEN.has(sleutel)) {
          const melding = `${sleutel} past nu: haal het weg uit e2e/schermen-open.ts`
          if (process.env.CI) test.info().annotations.push({ type: 'past nu', description: melding })
          else fout.push(melding)
        }
      }
      await ctx.close()
      // OPEN_OPNEMEN=1: schrijf wat niet past naar test-results/open/ (om e2e/schermen-open.ts bij te werken).
      if (process.env.OPEN_OPNEMEN) {
        const fs = await import('node:fs')
        fs.mkdirSync('test-results/open', { recursive: true })
        fs.writeFileSync(`test-results/open/${kind}-${w}x${h}.json`, JSON.stringify(fout.filter((f) => !f.includes('past nu')).map((f) => f.split(':')[0])))
        return
      }
      expect(fout).toEqual([])
    })
  })
})
