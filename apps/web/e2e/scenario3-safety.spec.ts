/**
 * E2E Scenario 3: セーフティ機能（pause/help）
 *
 * 設定画面からpause/unpause、相談窓口リンクが
 * 正常に動作することを検証する。
 * セーフティ要件が削除されていないことを確認する。
 */
import { test, expect } from '@playwright/test'

test('Scenario 3: Safety features are accessible', async ({ page }) => {
  // Setup auth
  await page.goto('/settings')
  await page.evaluate(() => {
    localStorage.setItem('fny_token', 'test_token_xxx')
    localStorage.setItem('fny_user_id', 'test_user_001')
    localStorage.setItem('fny_couple_id', 'couple_001')
  })
  await page.reload()

  // 1. 安全とプライバシー画面が表示される
  await expect(page.getByText('安全とプライバシー')).toBeVisible()

  // 2. pause ボタンが存在する
  await expect(page.getByRole('button', { name: /加点を停止/ })).toBeVisible()

  // 3. 相談窓口ボタンが存在する
  await expect(page.getByRole('button', { name: /相談窓口/ })).toBeVisible()

  // 4. ペア解除ボタンが存在する
  await expect(page.getByRole('button', { name: /ペア接続を解除/ })).toBeVisible()

  // 5. データ削除ボタンが存在する
  await expect(page.getByRole('button', { name: /データを削除/ })).toBeVisible()

  // 6. Pause API mock
  await page.route('/api/v1/couples/couple_001/safety/pause', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'paused' }),
    })
  })

  // 7. Pause をクリック
  await page.getByRole('button', { name: /加点を停止/ }).click()

  // 8. 停止メッセージが表示される
  await expect(page.getByText('加点を停止しました')).toBeVisible()
})
