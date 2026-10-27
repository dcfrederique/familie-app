// Schermafdrukken van de 3D-wereld voor het nachtelijke werk (docs/wereld-3d.md). Vite moet draaien (`npx vite --port 5173`).
// Gebruik: node scripts/wereld3d-foto.cjs [map] [toets:ms ...]   bv. `node scripts/wereld3d-foto.cjs /tmp/foto ArrowDown:9000 ArrowRight:30000`
// NACHT=1 geeft de donkere stand. Software-WebGL is traag: gebruik een klein scherm en geef lopen royaal de tijd.
const { chromium } = require('@playwright/test')
const { vastToeval, welkomstpad } = require('./schermmeting.cjs')

;(async () => {
  const [map = '/tmp/wereld3d', ...stappen] = process.argv.slice(2)
  require('fs').mkdirSync(map, { recursive: true })
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
  const ctx = await b.newContext({ viewport: { width: 800, height: 500 }, hasTouch: true, colorScheme: process.env.NACHT ? 'dark' : 'light' })
  await ctx.addInitScript(() => { try { localStorage.setItem('demo-tablet-kind', 'luca') } catch { /* */ } })
  await ctx.addInitScript(vastToeval)
  const page = await ctx.newPage()
  const logs = []
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()) })
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.stack))
  await page.goto('http://127.0.0.1:5173/kind/luca')
  await welkomstpad(page, 0)
  // Binnen de app navigeren: de demo bewaart niets na een nieuwe paginalading.
  await page.evaluate(() => { history.pushState({}, '', '/kind/luca/wereld?3d=1'); dispatchEvent(new PopStateEvent('popstate')) })
  await page.waitForTimeout(4000)
  const foto = (naam) => page.screenshot({ path: `${map}/${naam}.png`, timeout: 120000 })
  await foto('start')
  let n = 1
  for (const stap of stappen) {
    const [toets, ms] = stap.split(':')
    await page.keyboard.down(toets); await page.waitForTimeout(Number(ms)); await page.keyboard.up(toets); await page.waitForTimeout(600)
    await foto(`${n++}-${toets}`)
  }
  console.log(logs.length ? logs.join('\n') : 'geen fouten')
  await b.close()
})()
