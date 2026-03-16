/**
 * E2E Scenario 1: オンボーディング → 匿名ユーザー作成 → ペアリング画面遷移
 *
 * ユーザーがオンボーディングに同意し、匿名アカウントを作成して
 * ペアリング画面に遷移できることを検証する。
 */
import { test, expect } from '@playwright/test'

test('Scenario 1: Onboarding to pairing flow', async ({ page }) => {
  // 1. オンボーディング画面に到達
  await page.goto('/')
  await expect(page.getByText('ふたりの約束へようこそ')).toBeVisible()

  // 2. CTAボタンは最初disabled
  const cta = page.getByRole('button', { name: 'はじめる' })
  await expect(cta).toBeDisabled()

  // 3. すべての同意チェックボックスにチェック
  const checkboxes = page.locator('input[type="checkbox"]')
  await expect(checkboxes).toHaveCount(3)
  await checkboxes.nth(0).check()
  await checkboxes.nth(1).check()
  await checkboxes.nth(2).check()

  // 4. CTAが有効になる
  await expect(cta).toBeEnabled()

  // 5. API mock: anonymous user creation
  await page.route('/api/v1/auth/anonymous', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 'test_user_001',
        device_token: 'eyJhbGciOiJIUzI1NiJ9.test',
      }),
    })
  })

  // 6. CTA クリック → ペアリング画面へ
  await cta.click()
  await expect(page).toHaveURL('/pair')
  await expect(page.getByText('ふたりをつなぐ')).toBeVisible()
})
