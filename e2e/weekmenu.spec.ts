import { expect, test, type Page } from '@playwright/test'

// Regressie: wat je bij "Wat eten we?" intikt ging verloren bij van week wisselen of het scherm verlaten.
const eerste = (p: Page) => p.locator('input[id^=gerecht-]').first()
const tweede = (p: Page) => p.locator('input[id^=gerecht-]').nth(1)
const volgende = (p: Page) => p.getByRole('button', { name: 'Volgende week' })
const vorige = (p: Page) => p.getByRole('button', { name: 'Vorige week' })

test('weekmenu van volgende week blijft bewaard', async ({ page }) => {
  await page.goto('/ouder/weekmenu')
  await expect(page.getByRole('heading', { name: /Deze week/ })).toBeVisible()
  const vandaag = await page.locator('.week-dag.is-vandaag input').inputValue()
  expect(vandaag).toBe('Spaghetti bolognese')

  await volgende(page).click()
  await expect(page.getByRole('heading', { name: /Volgende week/ })).toBeVisible()
  await eerste(page).fill('Lasagne')
  await tweede(page).fill('Stoofvlees')
  await vorige(page).click()          // meteen weg, zonder te wachten of te bewaren
  await expect(page.getByRole('heading', { name: /Deze week/ })).toBeVisible()
  await expect(page.locator('.week-dag.is-vandaag input')).toHaveValue(vandaag)
  await volgende(page).click()
  await expect(eerste(page)).toHaveValue('Lasagne')
  await expect(tweede(page)).toHaveValue('Stoofvlees')

  // Scherm verlaten (zonder herladen: de demo leeft in het geheugen) en terugkomen.
  await tweede(page).fill('Stoofvlees met frietjes')
  await page.getByRole('link', { name: /Boodschappen/ }).first().click()
  await page.getByRole('link', { name: /Weekmenu/ }).first().click()
  await volgende(page).click()
  await expect(eerste(page)).toHaveValue('Lasagne')
  await expect(tweede(page)).toHaveValue('Stoofvlees met frietjes')
})
