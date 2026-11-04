// Gedeelde meetcode voor de schermcontrole: scripts/schermcontrole.cjs (nachtelijk verslag, schermafdrukken)
// en e2e/schermen.spec.ts (Playwright-tests). Eén versie, zodat beide hetzelfde meten.

// Gangbare tablets in CSS-pixels (liggend; staand is gewoon omgedraaid), plus gsm liggend.
const TOESTELLEN = [
  ['iPad 9.7', 1024, 768], ['iPad 10.2', 1080, 810], ['iPad Air', 1180, 820], ['iPad Pro 11', 1194, 834],
  ['iPad Pro 12.9', 1366, 1024], ['Galaxy Tab A / Fire HD 10', 1280, 800], ['Galaxy Tab S7 / Lenovo M10', 962, 601],
  ['Galaxy Tab S6 Lite', 1143, 686], ['Fire 7 / tablet 7"', 1024, 600], ['Galaxy Tab S9+', 1376, 860],
]
const GSM = [['Gsm liggend', 844, 390], ['Gsm groot liggend', 915, 412]]

const KINDEREN = ['luca', 'yuna', 'feline']
const SCHERMEN = [
  '', 'wereld', 'taken', 'kiezen', 'ik', 'huis', 'figuurtje', 'thema', 'spelen', 'winkel', 'tijd', 'verhalen', 'verhaal/1', 'kleurplaten', 'tekenen',
  'schrijven', 'chat', 'rekenen', 'memory', 'penalty', 'huisdier', 'racen', 'koken', 'touwspringen', 'basket',
  'puzzel', 'pompoen', 'bladeren', 'springen', 'ketting', 'schoen', 'weg', 'lichtjes', 'schaduw', 'verkleed', 'doolhof', 'winterslaap', 'kastanjes', 'pakjesschuiven', 'stippen', 'inpakken',
]

async function naarScherm(page, pad) {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, pad)
  await page.waitForTimeout(700)
  await page.evaluate(() => document.fonts.ready)
}

// Doorloopt het welkomstpad, zodat het kind daarna op zijn startscherm komt (demo-data leeft in het geheugen).
// Het thema wisselt per kind en per dag, zo komen alle thema's (race, kasteel, tuin, voetbal...) aan de beurt.
async function welkomstpad(page, themaNr) {
  await welkomstpadDoorlopen(page, themaNr)
  // De dagelijkse hoera-melding (nieuw in de winkel, cadeautje) hoort niet bij de schermen zelf: wegtikken.
  const hoera = page.getByRole('button', { name: 'Super!' })
  await hoera.waitFor({ timeout: 2500 }).then(() => hoera.click(), () => {})
  await page.waitForTimeout(300)
}

async function welkomstpadDoorlopen(page, themaNr) {
  // Eerst laten doorsturen naar /welkom (gebeurt pas na het laden van de sessie).
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
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


// Vaste toevalsgetallen (addInitScript): willekeurige inhoud (letters bij Schrijven, sommen...) is dan elke run dezelfde,
// zodat een meting niet de ene keer past en de andere keer niet.
function vastToeval() {
  let a = 20261026
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

module.exports = { vastToeval, TOESTELLEN, GSM, KINDEREN, SCHERMEN, naarScherm, welkomstpad, meet }
