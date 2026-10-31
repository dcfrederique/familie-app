import { expect, test } from '@playwright/test'

// Weekmenu met momenten, standaardmaaltijden, receptkiezer en deelrecepten (docs/weekmenu.md, docs/voorraad.md), in de demo.
const rij = (p: import('@playwright/test').Page, naam: string) => p.locator('.voorraad-rij', { hasText: naam }).first()

test('standaard ontbijt: aanzetten, afboeken per moment', async ({ page }) => {
  await page.goto('/ouder/weekmenu')
  await page.getByText('Momenten en standaardmaaltijden').click()
  await page.getByRole('checkbox', { name: /Ontbijt/ }).check()
  await page.getByRole('button', { name: 'Standaard erbij' }).click()
  await page.getByLabel('Standaard 1', { exact: true }).fill('Boterhammen')
  await page.locator('.week-instelling').getByRole('button', { name: 'Bewaren' }).click()
  await expect(page.locator('.week-instelling').getByText('Bewaard.')).toBeVisible()

  // Elke dag heeft nu een ontbijt met de standaard als tip.
  await expect(page.getByPlaceholder('Standaard: Boterhammen').first()).toBeVisible()

  // Voorraad: het ontbijt van vandaag vraagt een tik; 2 brood voor 2 personen × 6 eters = 6 brood eraf.
  await page.getByRole('link', { name: /Voorraad/ }).first().click()
  await expect(page.getByRole('heading', { name: /Vandaag · ontbijt: Boterhammen/ })).toBeVisible()
  await expect(rij(page, 'Brood')).toContainText('8')
  await page.getByRole('region', { name: /Gekookt op .*ontbijt/ }).last().getByRole('button', { name: 'Gegeten, boek af' }).click()
  await expect(page.getByRole('heading', { name: /Vandaag · ontbijt/ })).toHaveCount(0)
  await expect(rij(page, 'Brood')).toContainText('2')
})

test('receptkiezer vult het weekmenu in, met wat in huis is bovenaan', async ({ page }) => {
  await page.goto('/ouder/weekmenu')
  await page.getByRole('button', { name: /Recept kiezen voor/ }).nth(1).click()
  const kiezer = page.getByRole('group', { name: /Recept kiezen voor avond/ })
  await expect(kiezer.getByText('Bolognaisesaus')).toHaveCount(0) // een deelrecept is geen maaltijd
  await expect(kiezer.getByRole('button', { name: /Boterhammen/ })).toContainText('alles in huis')
  await kiezer.getByRole('button', { name: /Lasagne/ }).click()
  await expect(page.locator('input[id^=gerecht-]').nth(1)).toHaveValue('Lasagne')
})

test('deelrecept koken zet porties in de voorraad', async ({ page }) => {
  await page.goto('/ouder/recepten')
  await page.getByRole('button', { name: /Bolognaisesaus/ }).click()
  await expect(page.getByText(/Dit is een deelrecept/)).toBeVisible()
  await page.getByRole('button', { name: /Nu gekookt: \+4 portie/ }).click()
  await page.getByRole('link', { name: /Voorraad/ }).first().click()
  await expect(rij(page, 'Bolognaisesaus')).toContainText('6')
})
