// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  workers: 1, // We only run one database so tests that need db need to be run sequentially
  globalSetup: "./e2e/global-setup",
  // globalTimeout: 5 * 60 * 1000, // Wait for 5 minutes to spinup oidc server and database
  webServer: {
    command: `bun ${process.env.CI ? "coverage:start" : "start"} --port 8001`,
    port: 8001,
    // timeout: 2 * 60 * 1000, // Wait for 2 minutes to spinup app dev server
    reuseExistingServer: !process.env.CI,
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 500,
    },
    env: {
      ARANGO_PASSWORD: "pw4tests",
      ARANGO_URL: process.env.GITLAB_CI
        ? "http://docker:8003"
        : "http://localhost:8003",
      NEXTAUTH_SECRET: "secret4tests",
      NEXT_PUBLIC_URL: "http://localhost:8001",
      NEXTAUTH_URL: "http://localhost:8001/api/auth",
      TESTOIDC_CLIENT_ID: "lxcat-test",
      TESTOIDC_CLIENT_SECRET: "clientsecret4tests",
      TESTOIDC_CLIENT_ISSUER: "http://localhost:8002",
    },
  },
  use: {
    trace: "on-first-retry",
    baseURL: "http://localhost:8001/",
  },
  testDir: "./e2e",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
};
export default config;
