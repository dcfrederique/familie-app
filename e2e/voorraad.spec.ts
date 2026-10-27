import { expect, test, type Page } from '@playwright/test'

// Voorraad in de demo (docs/voorraad.md): gekookt boekt af, onder het minimum komt een artikel op de lijst, afvinken telt erbij.
const rij = (p: Page, naam: string) => p.locator('.voorraad-rij', { hasText: naam }).first()

test('voorraad: gekookt, minimum naar de lijst en afvinken telt bij', async ({ page }) => {
  await page.goto('/ouder/voorraad')
  await expect(page.getByRole('heading', { name: /Vandaag: Spaghetti bolognese/ })).toBeVisible()
  await expect(rij(page, 'Gehakt')).toContainText('0,5')
  await expect(rij(page, 'Tomatensaus')).toContainText('2')

  // Recept voor 4, we koken voor 5: 0,5 kg gehakt, 1,25 pak pasta en 1,25 pot tomatensaus gaan eraf.
  await page.getByRole('button', { name: 'Gekookt, boek af' }).click()
  await expect(page.getByRole('heading', { name: /Vandaag: Spaghetti bolognese/ })).toHaveCount(0)
  await expect(rij(page, 'Gehakt')).toContainText('0')
  await expect(rij(page, 'Pasta')).toContainText('1,75')
  await expect(rij(page, 'Tomatensaus')).toContainText('0,75')
  await expect(rij(page, 'Tomatensaus')).toContainText('op de lijst')

  // Melk staat open op de lijst; afvinken telt een aankoop van 6 liter bij de 3 liter.
  await page.getByRole('link', { name: /Boodschappen/ }).first().click()
  await expect(page.getByText('Tomatensaus').first()).toBeVisible()
  await page.getByRole('button', { name: 'Melk: in de kar' }).click()
  await page.getByRole('link', { name: /Voorraad/ }).first().click()
  await expect(rij(page, 'Melk')).toContainText('9')

  // Plus en min.
  await page.getByRole('button', { name: /Water: 1 meer/ }).click()
  await expect(rij(page, 'Water')).toContainText('13')
})
