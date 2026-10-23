// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { startDbContainer } from "@lxcat/database/test";
import { NewLTPDocument } from "@lxcat/schema";
import { Browser, chromium, errors, FullConfig, Page } from "@playwright/test";
import { exec } from "child_process";
import { readFile, rm, writeFile } from "fs/promises";
import { encode } from "next-auth/jwt";
import { resolve } from "path";
import { signApiToken } from "../src/auth/api-token";
import { API_TOKENS_FILE, ApiTokens } from "./api-tokens";
import { testOidcServer } from "./test-oidc-server";

export const ADMIN_EMAIL = "admin@ng.lxcat.net";

async function globalSetup(config: FullConfig) {
  const env = config?.webServer?.env || {};

  console.log("Starting oidc server");
  const oidcUrl = new URL(env.TESTOIDC_CLIENT_ISSUER);
  // start test oidc server
  const oidc = testOidcServer(
    env.TESTOIDC_CLIENT_ID,
    env.TESTOIDC_CLIENT_SECRET,
    env.NEXTAUTH_URL + "/callback/testoidc",
    parseInt(oidcUrl.port),
  );

  // CI starts ArangoDB in the background while dependencies install, so the
  // container start-up overlaps with other work. Locally we start our own.
  const arangoUrl = new URL(env.ARANGO_URL);
  let stopDbContainer = async () => {};
  if (process.env.E2E_EXTERNAL_DB) {
    console.log("Waiting for external database server");
    await waitForDb(env.ARANGO_URL);
  } else {
    console.log("Starting database server");
    stopDbContainer = await startDbContainer(env.ARANGO_PASSWORD, {
      container: 8529,
      host: parseInt(arangoUrl.port),
    });
  }

  // Make child processes use right env
  process.env.ARANGO_USERNAME = "lxcat";
  process.env.ARANGO_DB = "lxcat";
  process.env.ARANGO_PASSWORD = env.ARANGO_PASSWORD;
  process.env.ARANGO_ROOT_PASSWORD = env.ARANGO_PASSWORD;
  process.env.ARANGO_URL = env.ARANGO_URL;

  console.log("Create collections");
  // Setup the `lxcat` database and user.
  await runDbCommand("bun setup");

  // Public data shared by all read-only specs. Specs that modify data
  // (`author-*.spec.ts`) create their own data.
  console.log("Seed public data");
  await seedPublicData();

  console.log("Create admin user and store its cookie");
  const browser = await chromium.launch();
  const baseURL = env.NEXT_PUBLIC_URL;
  const email = ADMIN_EMAIL;
  const adminPage = await browser.newPage({ baseURL });
  // Login with test oidc account.
  await signUp(adminPage, email);
  // Add admin roles.
  await runDbCommand(`bun make-admin ${email}`);
  await adminPage.context().storageState({ path: "adminStorageState.json" });
  // TODO create user for each role and store the those users cookies.
  await browser.close();

  console.log("Create API tokens");
  await createApiTokens(env.NEXTAUTH_SECRET, email);

  console.log("Completed global setup");

  return async () => {
    await rm("adminStorageState.json");
    await rm(API_TOKENS_FILE);
    await stopDbContainer();
    oidc.close();
  };
}

export default globalSetup;

const DAY = 24 * 60 * 60;

/**
 * Create API tokens, like the ones users get on the developer page. Tokens
 * identify a user by key, are stored for the user, and the roles are looked up
 * in the database.
 */
async function createApiTokens(secret: string, adminEmail: string) {
  const noRolesKey = await db().addUser({
    email: "no-roles@ng.lxcat.net",
    roles: [],
    accounts: [],
    sessions: [],
  });
  const authorOnlyKey = await db().addUser({
    email: "author-only@ng.lxcat.net",
    roles: ["author"],
    accounts: [],
    sessions: [],
  });
  const adminKey = (await db().getUserByEmail(adminEmail))!._key!;

  const tokenFor = async (userKey: string, store = true) => {
    const { token, apiToken } = await signApiToken(userKey, DAY, secret);
    if (store) {
      await db().addApiToken(userKey, apiToken);
    }
    return token;
  };

  const tokens: ApiTokens = {
    developer: await tokenFor(adminKey),
    noRoles: await tokenFor(noRolesKey!),
    authorOnly: await tokenFor(authorOnlyKey!),
    unknownUser: await tokenFor("nobody"),
    unregistered: await tokenFor(adminKey, false),
    legacy: await encode({ token: { email: adminEmail }, secret, maxAge: DAY }),
    expired: await encode({ token: { sub: adminKey }, secret, maxAge: -DAY }),
  };
  await writeFile(API_TOKENS_FILE, JSON.stringify(tokens));
}

async function runDbCommand(command: string) {
  const dir = new URL(".", import.meta.url).pathname;

  return new Promise((presolve, reject) => {
    exec(
      command,
      {
        cwd: resolve(dir, "../../packages/database"),
        env: process.env,
      },
      (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error) {
          reject(error);
        }
        presolve(stdout);
      },
    );
  });
}

async function waitForDb(url: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    try {
      const res = await fetch(new URL("/_api/version", url));
      // 401 also means that the server is up.
      if (res.status < 500) return;
    } catch {
      // Not up yet.
    }
    if (Date.now() > deadline) {
      throw new Error(`Database at ${url} did not become ready.`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

export const seedDir = "../packages/database/src/test/seed/cross-sections";

/** Insert the dummy sets as published sets directly through the database layer. */
async function seedPublicData() {
  for (const file of ["dummy.json", "dummy2.json"]) {
    const content = await readFile(`${seedDir}/${file}`, { encoding: "utf8" });
    const doc = NewLTPDocument.parse(JSON.parse(content));
    await db().upsertOrganization(doc.contributor);
    // Sets are created as published by default.
    await db().createSet(doc);
  }
}

async function signUp(page: Page, email: string) {
  await page.goto("/", { timeout: 60000 });
  await page.locator("text=Sign in").click();
  await page.locator("text=Sign in with Test dummy").click();

  // Login to test oidc server
  // NOTE: The test would sometimes fail to click the `Sign in with Test dummy` button on the first try.
  try {
    await page.locator("[placeholder=\"Enter any login\"]").fill(email, {
      timeout: 1000,
    });
  } catch (error) {
    if (error instanceof errors.TimeoutError) {
      // Retry
      await page.locator("text=Sign in with Test dummy").click();
      await page.locator("[placeholder=\"Enter any login\"]").fill(email);
    } else {
      throw error;
    }
  }
  await page.locator("[placeholder=\"and password\"]").fill("foobar");
  await page.locator("button:has-text(\"Sign-in\")").click();
  // Give consent that email and profile can be used by app
  await page.locator("text=Continue").click();
  await page.waitForURL("/");
}

/**
 * Upload and publish a dummy set through the UI, as a member of `org`.
 *
 * The set's contributor is replaced by `org` so that it does not mix with the
 * seeded public data.
 */
export async function uploadAndPublishDummySet(
  browser: Browser,
  file = "dummy.json",
  org = "Author test organization",
) {
  const page = await browser.newPage();

  try {
    await db().upsertOrganization(org);

    // Make admin user a member of organization
    await page.goto("/admin/users");
    await page.locator("tr", { hasText: ADMIN_EMAIL }).locator(
      "div.mantine-MultiSelect-input",
    ).click({ position: { x: 10, y: 10 } });
    await page.getByRole("option", { name: org }).click();
    await page.waitForSelector(`div:has-text("${org}")`);

    // Add a set
    await page.goto("/author/set/addraw");
    const dummySet = JSON.parse(
      await readFile(`${seedDir}/${file}`, { encoding: "utf8" }),
    );
    dummySet.contributor = org;
    // Pre-format like the input does on blur. Otherwise the layout shifts
    // under the upload button and the click is lost.
    await page.locator("textarea.mantine-JsonInput-input").fill(
      JSON.stringify(dummySet, null, 2),
    );
    await page.locator("text=Upload cross section set").click();
    await page.getByText("The ID of the newly created draft is").waitFor({
      state: "visible",
    });

    // Publish set
    await page.goto("/author/set");
    await page.waitForSelector("td:has-text(\"draft\")");
    await page.locator("svg.tabler-icon-file-check").click();
    // Press publish in dialog
    await page.getByLabel("Are you sure you want to").getByRole("button", {
      name: "Publish",
    }).click();
    await page.waitForSelector("td:has-text(\"published\")");
  } finally {
    await page.close();
  }
}
