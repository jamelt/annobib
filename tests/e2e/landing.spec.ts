import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Your Research/i })).toBeVisible()
    await expect(page.getByText('The modern bibliography manager')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Free' })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Sign In' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Get Started' }).first().click()

    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible()
  })

  test('should display features section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Comprehensive Library')).toBeVisible()
    await expect(page.getByText('Rich Annotations')).toBeVisible()
    await expect(page.getByText('Powerful Search')).toBeVisible()
    await expect(page.getByText('Citation Styles')).toBeVisible()
    await expect(page.getByText('Veritas Score')).toBeVisible()
    await expect(page.getByText('Mind Maps')).toBeVisible()
  })

  test('should display pricing section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Simple, Transparent Pricing/i })).toBeVisible()
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Light')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
  })
})
