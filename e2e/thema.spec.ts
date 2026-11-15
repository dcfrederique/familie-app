import { expect, test, type Page } from '@playwright/test'
import { themaKeuzes } from '../src/data/thema.ts'

async function naar(page: Page, pad: string) {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, pad)
}

async function openThemas(page: Page, kind = 'luca') {
  await page.addInitScript((id) => localStorage.setItem('demo-tablet-kind', id), kind)
  await page.goto(`/kind/${kind}/welkom`)
  await page.getByRole('button', { name: 'Starten' }).click()
  await page.getByRole('button', { name: 'Verder' }).click()
  await page.locator('.welkom-knop.overslaan').click()
  await page.getByRole('button', { name: 'Verder' }).click()
  await page.getByRole('button', { name: 'Naar mijn startscherm' }).click()
  const hoera = page.getByRole('button', { name: 'Super!' })
  await hoera.waitFor({ timeout: 3000 }).then(() => hoera.click(), () => {})
  await naar(page, `/kind/${kind}/thema`)
  await expect(page.locator('.thema-galerij')).toBeVisible()
}

test('alle thema’s bereikbaar, eigen prenten laden en gekozen bladzijde blijft bewaard', async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 })
  await openThemas(page)
  await expect(page.getByRole('link', { name: 'Mijn figuurtje aankleden' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vorige bladzijde' })).toBeDisabled()
  const gezien: string[] = []
  for (let blad = 0; blad < 5; blad++) {
    const kaarten = page.locator('.thema-kaart')
    await expect(kaarten).toHaveCount(blad === 4 ? 7 : 8)
    gezien.push(...await kaarten.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')!)))
    await expect.poll(() => kaarten.locator('img').evaluateAll((imgs) => imgs.every((im) => (im as HTMLImageElement).complete && (im as HTMLImageElement).naturalWidth > 0))).toBe(true)
    if (blad < 4) await page.getByRole('button', { name: 'Volgende bladzijde' }).click()
  }
  expect(gezien).toEqual(themaKeuzes.map((t) => t.naam))
  await expect(page.getByRole('button', { name: 'Volgende bladzijde' })).toBeDisabled()
  await page.getByRole('button', { name: 'Paars', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Paars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await naar(page, '/kind/luca/ik')
  await naar(page, '/kind/luca/thema')
  await expect(page.getByRole('button', { name: 'Paars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.thema-bladstand')).toContainText('5 / 5')
})

for (const kind of ['luca', 'feline']) {
  test(`themagalerij past zonder scrollen voor ${kind}, licht en donker`, async ({ page }) => {
    await page.setViewportSize({ width: 1194, height: 834 })
    await openThemas(page, kind)
    for (const kleur of ['light', 'dark']) {
      await page.evaluate((thema) => document.documentElement.dataset.theme = thema, kleur)
      for (const [width, height] of [[1194, 834], [834, 1194], [1024, 600], [600, 1024], [962, 601], [844, 390]]) {
        await page.setViewportSize({ width, height })
        await expect(page.locator('.thema-kaart')).toHaveCount(height <= 520 ? 4 : 8)
        await page.evaluate(() => document.fonts.ready)
        await expect.poll(() => page.locator('.thema-kaart img').evaluateAll((imgs) => imgs.every((im) => (im as HTMLImageElement).complete && (im as HTMLImageElement).naturalWidth > 0))).toBe(true)
        const maten = await page.evaluate(() => {
          const se = document.scrollingElement!
          const knoppen = [...document.querySelectorAll('.thema-kaart, .thema-bladeren button')]
          return {
            scroll: se.scrollHeight > innerHeight + 1 || se.scrollWidth > innerWidth + 1,
            buiten: knoppen.some((el) => { const r = el.getBoundingClientRect(); return r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < 0 || r.height < 44 }),
          }
        })
        expect(maten, `${kind} ${kleur} ${width}×${height}`).toEqual({ scroll: false, buiten: false })
        await page.screenshot({ path: test.info().outputPath(`${kind}-${kleur}-${width}x${height}.png`) })
      }
    }
  })
}
