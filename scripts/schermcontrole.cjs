// Schermcontrole: opent de kindschermen (demo, zonder Supabase) op gangbare tabletresoluties en
// meldt waar een kind zou moeten scrollen of waar iets buiten beeld valt.
// Gebruik: npx vite --port 5173 &  dan  node scripts/schermcontrole.cjs [--url http://127.0.0.1:5173]
//          [--kind luca] [--scherm huis] [--fotos map [--alle-fotos]] [--json uit.json] [--thema-nr 0]
// Playwright komt niet uit package.json: in de cloudomgeving staat het globaal (require('playwright')).
const { chromium } = require('playwright')

const args = process.argv.slice(2)
const optie = (naam, standaard) => { const i = args.indexOf(`--${naam}`); return i >= 0 ? args[i + 1] : standaard }
const URL = optie('url', 'http://127.0.0.1:5173')
const FOTOS = optie('fotos', null)
const JSON_UIT = optie('json', null)
const ALLE_FOTOS = args.includes('--alle-fotos')

const { vastToeval, TOESTELLEN, GSM, KINDEREN: ALLE_KINDEREN, SCHERMEN: ALLE_SCHERMEN, naarScherm, welkomstpad, meet } = require('./schermmeting.cjs')
const KINDEREN = optie('kind', ALLE_KINDEREN.join(',')).split(',')
const SCHERMEN = optie('scherm', '') ? optie('scherm', '').split(',') : ALLE_SCHERMEN

;(async () => {
  const browser = await chromium.launch()
  const uitslag = []
  const maten = [...TOESTELLEN.flatMap(([n, w, h]) => [[`${n} liggend`, w, h], [`${n} staand`, h, w]]), ...GSM]
  for (const kind of KINDEREN) {
    for (const [toestel, w, h] of maten) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, deviceScaleFactor: 1 })
      await ctx.addInitScript((k) => { try { localStorage.setItem('demo-tablet-kind', k) } catch { /* */ } }, kind)
      await ctx.addInitScript(vastToeval)
      const page = await ctx.newPage()
      await page.goto(`${URL}/kind/${kind}`)
      await page.waitForTimeout(800)
      await welkomstpad(page, ALLE_KINDEREN.indexOf(kind) + Number(optie('thema-nr', new Date().getDate())))
      for (const scherm of SCHERMEN) {
        const pad = `/kind/${kind}${scherm ? '/' + scherm : ''}`
        await naarScherm(page, pad)
        const fouten = await page.evaluate(meet)
        const thema = await page.evaluate(() => (document.querySelector('.kind')?.className.match(/thema-(?!scherm)(\w+)/) ?? [])[1] ?? 'geen')
        uitslag.push({ kind, thema, toestel, w, h, scherm: scherm || 'start', fouten })
        if (fouten.length) console.log(`✗ ${kind} (${thema}) ${scherm || 'start'} ${toestel} ${w}x${h}\n   ${fouten.join('\n   ')}`)
        if (FOTOS && (fouten.length || ALLE_FOTOS)) await page.screenshot({ path: `${FOTOS}/${kind}-${(scherm || 'start').replace('/', '-')}-${w}x${h}.png` })
      }
      await ctx.close()
    }
  }
  await browser.close()
  // Tablets moeten passen; gsm liggend is het volgende doel en telt (nog) apart.
  const tablet = uitslag.filter((u) => !GSM.some(([, w, h]) => u.w === w && u.h === h))
  const slecht = tablet.filter((u) => u.fouten.length)
  const gsm = uitslag.filter((u) => !tablet.includes(u))
  console.log(`\nTablets: ${tablet.length - slecht.length}/${tablet.length} schermen passen zonder scrollen.`)
  if (gsm.length) console.log(`Gsm liggend: ${gsm.filter((u) => !u.fouten.length).length}/${gsm.length} passen.`)
  if (JSON_UIT) require('fs').writeFileSync(JSON_UIT, JSON.stringify(uitslag, null, 2))
  process.exitCode = slecht.length ? 1 : 0
})()
