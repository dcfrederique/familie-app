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

// Gangbare tablets in CSS-pixels (liggend; staand is gewoon omgedraaid), plus gsm liggend.
const TOESTELLEN = [
  ['iPad 9.7', 1024, 768], ['iPad 10.2', 1080, 810], ['iPad Air', 1180, 820], ['iPad Pro 11', 1194, 834],
  ['iPad Pro 12.9', 1366, 1024], ['Galaxy Tab A / Fire HD 10', 1280, 800], ['Galaxy Tab S7 / Lenovo M10', 962, 601],
  ['Galaxy Tab S6 Lite', 1143, 686], ['Fire 7 / tablet 7"', 1024, 600], ['Galaxy Tab S9+', 1376, 860],
]
const GSM = [['Gsm liggend', 844, 390], ['Gsm groot liggend', 915, 412]]

const KINDEREN = (optie('kind', 'luca,yuna,feline')).split(',')
const SCHERMEN = (optie('scherm', '') || [
  '', 'wereld', 'taken', 'huis', 'figuurtje', 'thema', 'spelen', 'winkel', 'tijd', 'verhalen', 'verhaal/1', 'kleurplaten', 'tekenen',
  'schrijven', 'chat', 'rekenen', 'memory', 'penalty', 'huisdier', 'racen', 'koken', 'touwspringen', 'basket',
  'puzzel', 'pompoen', 'springen',
].join(',')).split(',')

async function naarScherm(page, pad) {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, pad)
  await page.waitForTimeout(700)
}

// Doorloopt het welkomstpad, zodat het kind daarna op zijn startscherm komt (demo-data leeft in het geheugen).
// Het thema wisselt per kind en per dag, zo komen alle thema's (race, kasteel, tuin, voetbal...) aan de beurt.
async function welkomstpad(page, themaNr) {
  for (let i = 0; i < 12; i++) {
    if (!page.url().includes('/welkom')) return
    const klaar = page.getByRole('button', { name: 'Naar mijn startscherm' })
    if (await klaar.count()) { await klaar.click(); await page.waitForTimeout(800); continue }
    const themas = page.locator('.thema-keuze')
    if (await themas.count()) await themas.nth(themaNr % await themas.count()).click()
    await page.getByRole('button', { name: /^(Starten|Verder)$/ }).click()
    await page.waitForTimeout(400)
  }
}

// Meet in de pagina: moet je scrollen (pagina of een vak), en valt er iets zichtbaars buiten beeld?
function meet() {
  const W = innerWidth, H = innerHeight, fouten = []
  const se = document.scrollingElement
  if (se.scrollHeight > H + 1) fouten.push(`pagina scrollt ${se.scrollHeight - H}px verticaal`)
  if (se.scrollWidth > W + 1) fouten.push(`pagina scrollt ${se.scrollWidth - W}px horizontaal`)
  const naam = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '')
  for (const el of document.querySelectorAll('body *')) {
    const st = getComputedStyle(el)
    if (st.display === 'none' || st.visibility === 'hidden') continue
    // Bewust scrollend: de landkaart van Springland (slepen) en de chatgeschiedenis.
    if (el.matches('.spring-kaart, .gesprek-lijst')) continue
    const oy = st.overflowY, ox = st.overflowX
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 2)
      fouten.push(`vak ${naam(el)} scrollt ${el.scrollHeight - el.clientHeight}px`)
    if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 2)
      fouten.push(`vak ${naam(el)} scrollt ${el.scrollWidth - el.clientWidth}px horizontaal`)
  }
  // Knoppen en tekst die (deels) buiten het scherm vallen, ook als body overflow verbergt.
  for (const el of document.querySelectorAll('button, a, h1, h2, h3, p, svg, canvas, img, input')) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (el.closest('[aria-hidden="true"], .spring-kaart, .gesprek-lijst')) continue
    let geknipt = false
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p)
      if (ps.overflow !== 'visible' && p !== document.documentElement) {
        const pr = p.getBoundingClientRect()
        if (pr.bottom < r.bottom - 2 || pr.right < r.right - 2 || pr.top > r.top + 2 || pr.left > r.left + 2) { geknipt = true; break }
      }
    }
    if (r.bottom > H + 2 || r.right > W + 2 || r.top < -2 || r.left < -2)
      fouten.push(`${naam(el)} valt buiten beeld (${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)})${geknipt ? ' [afgeknipt]' : ''}`)
  }
  return [...new Set(fouten)].slice(0, 12)
}

;(async () => {
  const browser = await chromium.launch()
  const uitslag = []
  const maten = [...TOESTELLEN.flatMap(([n, w, h]) => [[`${n} liggend`, w, h], [`${n} staand`, h, w]]), ...GSM]
  for (const kind of KINDEREN) {
    for (const [toestel, w, h] of maten) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, deviceScaleFactor: 1 })
      await ctx.addInitScript((k) => { try { localStorage.setItem('demo-tablet-kind', k) } catch { /* */ } }, kind)
      const page = await ctx.newPage()
      await page.goto(`${URL}/kind/${kind}`)
      await page.waitForTimeout(800)
      await welkomstpad(page, KINDEREN.indexOf(kind) + Number(optie('thema-nr', new Date().getDate())))
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
