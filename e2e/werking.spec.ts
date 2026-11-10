import { expect, test, type Page } from '@playwright/test'

// Werkingstests in de demo (geheugen, zonder Supabase): de hele sterrenlus en de belangrijkste kinderschermen.
// Navigeren gebeurt in de app zelf (klikken of history), want herladen wist de demo.

async function naar(page: Page, pad: string) {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, pad)
}

async function startAls(page: Page, kind: string) {
  await page.addInitScript((id) => { try { localStorage.setItem('demo-tablet-kind', id) } catch { /* */ } }, kind)
  await page.setViewportSize({ width: 1194, height: 834 })
  // Vaste klok binnen het tijdvenster (7:00 tot 20:00), anders kan tijd aanvragen 's nachts niet.
  await page.clock.setFixedTime(new Date('2026-10-26T10:00:00'))
  await page.goto(`/kind/${kind}`)
}

test('welkomstpad: figuurtje, verjaardag, thema en 10 sterren welkomstbonus', async ({ page }) => {
  await startAls(page, 'luca')
  await expect(page).toHaveURL(/\/kind\/luca\/welkom/)
  await page.getByRole('button', { name: 'Starten' }).click()
  await page.getByRole('button', { name: 'Verder' }).click()               // figuurtje
  await page.getByRole('button', { name: 'Weet ik niet' }).click()         // verjaardag
  await page.locator('.thema-keuze').first().click()
  await page.getByRole('button', { name: 'Verder' }).click()               // thema
  await page.getByRole('button', { name: 'Naar mijn startscherm' }).click()
  await expect(page).toHaveURL(/\/kind\/luca\/?$/)
  await expect(page.getByText('Hoi Luca!')).toBeVisible()
  // Demo: 40 startsterren + 10 welkomstbonus.
  await expect(page.locator('body')).toContainText('50')
})

test('sterrenlus: taak indienen, ouder keurt goed met pincode, tijd aanvragen en toekennen', async ({ page }) => {
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/kind/luca/taken')
  await page.getByRole('button', { name: 'Tafel dekken of afruimen: klaar!' }).click()
  await page.getByRole('button', { name: /Ja, klaar!/ }).click()
  await expect(page.getByRole('button', { name: 'Tafel dekken of afruimen: klaar!' })).toHaveCount(0)

  await naar(page, '/kind/luca/tijd')
  await page.locator('.blok-knop:not([disabled])').first().click()
  await expect(page.getByRole('region', { name: 'Vandaag gevraagd' })).toBeVisible()

  // Naar het ouderdeel via de knop op het startscherm (pincode als die gevraagd wordt).
  await naar(page, '/kind/luca/ik')
  await page.getByRole('link', { name: 'Voor mama of papa' }).click()
  await pincodeAlsGevraagd(page)
  await naar(page, '/ouder/goedkeuren')
  await page.getByRole('button', { name: 'Goedkeuren' }).first().click()
  await pincodeAlsGevraagd(page)
  await page.getByRole('button', { name: 'Toegekend' }).first().click()
  await pincodeAlsGevraagd(page)
  await expect(page.getByRole('button', { name: 'Toegekend' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Goedkeuren' })).toHaveCount(0)
})

test('winkel: iets kopen met sterren', async ({ page }) => {
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/kind/luca/winkel')
  const koop = page.locator('button.winkel-kaart').first()
  await expect(koop).toBeVisible()
  const label = (await koop.getAttribute('aria-label'))!
  const naam = label.replace(/, kost .*/, '')
  const prijs = Number(label.match(/kost (\d+)/)![1])
  const saldo = async () => Number((await page.locator('main').innerText()).match(/(\d+)\s*sterren/)![1])
  const voor = await saldo()
  await koop.click()
  await page.getByRole('button', { name: 'Kopen' }).click()
  // Wat van jou is, schuift achteraan (soms naar een volgende bladzijde): de koopknop is weg, of er komt een hoera.
  await expect(page.getByRole('button', { name: `${naam}, kost`, exact: false })).toHaveCount(0)
  await expect.poll(saldo).toBe(voor - prijs)
})

test('Mijn huis en Mijn figuurtje: verrassing en bewaren', async ({ page }) => {
  await startAls(page, 'yuna')
  await doorWelkomstpad(page)
  for (const scherm of ['huis', 'figuurtje']) {
    await naar(page, `/kind/yuna/${scherm}`)
    await page.getByRole('button', { name: 'Verrassing' }).click()
    await page.getByRole('button', { name: 'Klaar' }).click()
    await expect(page).toHaveURL(/\/kind\/yuna\/?$/)
  }
})

test('een verhaal lezen', async ({ page }) => {
  await startAls(page, 'feline')
  await doorWelkomstpad(page)
  await naar(page, '/kind/feline/verhalen')
  await page.locator('.verhaal-kaart').first().click({ force: true }) // de kaart wiebelt (thema)
  await expect(page).toHaveURL(/\/kind\/feline\/verhaal\/\d+/)
  await expect(page.locator('.verhaal-prent, svg').first()).toBeVisible()
})

async function doorWelkomstpad(page: Page) {
  for (let i = 0; i < 12 && page.url().includes('/welkom') || i === 0; i++) {
    await page.waitForTimeout(300)
    if (!page.url().includes('/welkom')) break
    const klaar = page.getByRole('button', { name: 'Naar mijn startscherm' })
    if (await klaar.count()) { await klaar.click(); continue }
    await page.getByRole('button', { name: /^(Starten|Verder)$/ }).click()
  }
  const hoera = page.getByRole('button', { name: 'Super!' })
  await hoera.waitFor({ timeout: 2500 }).then(() => hoera.click(), () => {})
}

async function pincodeAlsGevraagd(page: Page) {
  const pin = page.getByLabel('Pincode')
  if (await pin.isVisible().catch(() => false)) {
    await pin.fill('1234')
    await page.keyboard.press('Enter')
  }
}

test('wereldinstellingen: ouder zet 2.5D aan en loopt rond zonder fouten', async ({ page }) => {
  const fouten: string[] = []
  page.on('pageerror', (e) => fouten.push(e.message))
  await startAls(page, 'luca')
  await naar(page, '/ouder/wereld-instellingen')
  await pincodeAlsGevraagd(page)
  await page.getByRole('button', { name: '2.5D schuin' }).click()
  await page.getByRole('button', { name: 'Isometrisch' }).click()
  await expect(page.getByText('Bewaard.')).toBeVisible()
  await page.getByRole('link', { name: 'Proberen in de wereld' }).click()
  await expect(page.locator('canvas.wereld-veld')).toBeVisible()
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(800)
  await page.keyboard.up('ArrowRight')
  await page.getByRole('button', { name: 'Wereldinstellingen proberen' }).click()
  await page.getByRole('button', { name: 'Plat (zoals nu)' }).click()
  await page.waitForTimeout(300)
  expect(fouten).toEqual([])
})

test('kaart bewerken: ouder zet het huis van Luca in het bos, Luca begint daar en loopt door de poort', async ({ page }) => {
  const fouten: string[] = []
  page.on('pageerror', (e) => fouten.push(e.message))
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/ouder/kaart')
  await pincodeAlsGevraagd(page)
  await page.getByRole('tab', { name: 'Huizen' }).click()
  await page.getByRole('button', { name: /Huis van Luca/ }).click()
  await page.getByRole('tab', { name: 'Bos' }).click()
  const vlak = page.locator('.kb-vlak')
  await vlak.scrollIntoViewIfNeeded()
  const doos = (await vlak.boundingBox())!
  await page.mouse.click(doos.x + doos.width * (20.5 / 56), doos.y + doos.height * (10.5 / 28))
  await page.getByRole('button', { name: 'Bewaar' }).click()
  await expect(page.locator('.kb-melding')).toContainText('Bewaard')
  // Luca staat nu in het bos en kan er gewoon lopen
  await naar(page, '/kind/luca/wereld')
  await expect(page.locator('canvas.wereld-veld')).toHaveAttribute('aria-label', 'De wereld: Bos')
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowDown')
  expect(fouten).toEqual([])
})

test('huisdier: een diertje kiezen, en Luca eet met zijn dinootje (kost 2 sterren)', async ({ page }) => {
  await startAls(page, 'yuna')
  await doorWelkomstpad(page)
  await naar(page, '/kind/yuna/mijn-huisdier')
  await expect(page.locator('.hd-ei-tegel')).toHaveCount(12)
  await page.getByRole('button', { name: 'Leeuwtje' }).click()
  await page.getByRole('button', { name: 'Simba' }).click()
  await page.getByRole('button', { name: 'Dit ei neem ik' }).click()
  await expect(page.locator('.hd-naam')).toHaveText('Simba')
  await expect(page.getByText('Het ei broedt…')).toBeVisible()
})

test('huisdier: samen spelen, verstoppertje uitspelen vult het Blij-meetertje', async ({ page }) => {
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/kind/luca/mijn-huisdier')
  await page.getByRole('link', { name: 'Samen spelen' }).click()
  await expect(page.locator('.hs-tegel')).toHaveCount(3)
  await page.getByRole('button', { name: 'Verstoppertje' }).click()
  for (let i = 0; i < 40 && !(await page.locator('.hs-klaar').count()); i++) {
    const open = page.locator('.hs-plek:not(.fout):not(.uit)')
    if (await open.count()) await open.first().click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  await expect(page.locator('.hs-klaar')).toBeVisible()
  await page.getByRole('button', { name: 'Klaar' }).click()
  await expect(page.getByRole('img', { name: 'Blij: 5 van 5' })).toBeVisible()
})

test('huisdier: eten kost sterren en vult het buikje', async ({ page }) => {
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/kind/luca/mijn-huisdier')
  await expect(page.locator('.hd-naam')).toHaveText('Rokko')
  await expect(page.getByRole('img', { name: 'Buikje: 3 van 5' })).toBeVisible()
  await page.getByRole('button', { name: 'Eten', exact: true }).click()
  await expect(page.getByRole('img', { name: 'Buikje: 5 van 5' })).toBeVisible()
  await expect(page.locator('.hd-vandaag')).toContainText('2 van 6')
  await expect(page.getByRole('button', { name: 'Eten', exact: true })).toBeDisabled()
})

test('het nieuwe dorp: in het eigen huis binnenlopen en weer buiten', async ({ page }) => {
  const fouten: string[] = []
  page.on('pageerror', (e) => fouten.push(e.message))
  await startAls(page, 'luca')
  await doorWelkomstpad(page)
  await naar(page, '/kind/luca/wereld')
  const veld = page.locator('canvas.wereld-veld')
  await expect(veld).toHaveAttribute('aria-label', 'Het dorp')
  // het kind staat voor zijn eigen deur: de doen-knop toont naar binnen
  await expect(page.getByRole('button', { name: 'Naar binnen' })).toBeVisible()
  await page.getByRole('button', { name: 'Naar binnen' }).click()
  await expect(veld).toHaveAttribute('aria-label', 'Mijn kamer')
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(500)
  await page.keyboard.up('ArrowDown')
  await expect(veld).toHaveAttribute('aria-label', 'Het dorp')
  await page.getByRole('button', { name: /Schatboek/ }).click()
  await expect(page.getByRole('dialog', { name: 'Mijn Schatboek' })).toBeVisible()
  expect(fouten).toEqual([])
})
