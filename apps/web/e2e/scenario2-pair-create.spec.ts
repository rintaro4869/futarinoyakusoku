/**
 * E2E Scenario 2: 招待リンク作成フロー
 *
 * ユーザーが名前を入力して招待リンクを作成し、
 * コピーボタンが表示されることを検証する。
 */
import { test, expect } from '@playwright/test'

test('Scenario 2: Create invite link', async ({ page }) => {
  // Setup: Pretend user is authenticated
  await page.goto('/pair')

  // localStorage setup
  await page.evaluate(() => {
    localStorage.setItem('fny_token', 'test_token_xxx')
    localStorage.setItem('fny_user_id', 'test_user_001')
  })
  await page.reload()

  // 1. ペアリング画面
  await expect(page.getByText('ふたりをつなぐ')).toBeVisible()

  // 2. 招待リンクを作成ボタンをクリック
  await page.getByRole('button', { name: '招待リンクを作成' }).click()

  // 3. 名前入力フォームが表示される
  await expect(page.getByPlaceholder('名前を入力')).toBeVisible()

  // 4. 名前を入力
  await page.getByPlaceholder('名前を入力').fill('テスト太郎')

  // 5. API mock
  await page.route('/api/v1/couples', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        couple_id: 'couple_001',
        invite_code: 'ABC12345',
        invite_url: 'http://localhost:3000/pair?code=ABC12345',
      }),
    })
  })

  // 6. 招待リンクを作成ボタンをクリック
  await page.getByRole('button', { name: '招待リンクを作成' }).click()

  // 7. 待機中メッセージと招待URLが表示される
  await expect(page.getByText('相手の参加を待っています')).toBeVisible()
  await expect(page.getByText('http://localhost:3000/pair?code=ABC12345')).toBeVisible()

  // 8. コピーボタンが表示される
  await expect(page.getByRole('button', { name: /コピー/ })).toBeVisible()
})
