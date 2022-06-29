import { test, expect } from '@playwright/test'

test('/api/scat-css', async ({request, page}) => {
    await page.goto('/')

    // Login with test oidc account
    await page.locator('text=Sign in').click()
    await page.locator('text=Sign in with Test dummy').click();
    await page.locator('[placeholder="Enter any login"]').fill('admin@ng.lxcat.net');
    await page.locator('[placeholder="and password"]').fill('foobar');
    await page.locator('button:has-text("Sign-in")').click();
    // Give consent that email and profile can be used by app
    await page.locator('text=Continue').click();

    await page.pause()

    // TODO add admin roles

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    const resp = await request.get('/api/scat-css', { headers })

    expect(resp.ok()).toBeTruthy()
    const data = await resp.json()
    expect(data.items).toEqual([])
})