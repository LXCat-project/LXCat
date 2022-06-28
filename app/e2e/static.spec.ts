import { test, expect } from '@playwright/test'

test('/', async ({page}) => {
    await page.goto('http://localhost:8001')
    const h1 = page.locator('h1')
    console.log(h1)
    await expect(h1).toContainText('Welcome to LXCat')
})
