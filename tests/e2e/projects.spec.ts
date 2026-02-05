import { test, expect } from '@playwright/test'

test.describe('Projects Flow', () => {
  const testUser = {
    name: 'E2E Project User',
    email: `e2e-project-${Date.now()}@example.com`,
    password: 'testpassword123',
  }

  test('signs up and creates a project via modal', async ({ page }) => {
    // Sign up via UI (proven working in auth e2e)
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible()

    await page.getByPlaceholder('Your name').fill(testUser.name)
    await page.getByPlaceholder('you@example.com').fill(testUser.email)
    await page.locator('input[type="password"]').first().fill(testUser.password)
    await page.locator('input[type="password"]').nth(1).fill(testUser.password)

    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page).toHaveURL('/app', { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 })

    // Navigate to Projects
    await page.getByRole('link', { name: 'Projects' }).first().click()
    await expect(page).toHaveURL(/\/app\/projects/)
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()

    // Open "New Project" modal
    const openModalButton = page.getByRole('button', { name: /New Project|Create Project/i }).first()
    await openModalButton.click()

    // Fill and submit modal form
    const nameField = page.getByTestId('project-modal-name')
    await expect(nameField).toBeVisible()

    const projectName = `Test Project ${Date.now()}`

    await nameField.fill(projectName)
    await page.getByPlaceholder('What is this project about?').fill('Created from e2e test')

    const createButton = page.getByTestId('project-modal-submit')
    await createButton.click()

    // Modal should close and project should appear in list
    await expect(nameField).toBeHidden({ timeout: 10000 })
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 })
  })
})

