import { test, expect } from '@playwright/test'

test('/api/scat-css', async ({request}) => {
    test.fixme();
    // TODO login with test oidc account

    // TODO add roles to account

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    const resp = await request.get('/api/scat-css', { headers })
    console.log(await resp.text())
    expect(resp.ok()).toBeTruthy()

    const data = await resp.json()

    expect(data.items).toEqual([])
})