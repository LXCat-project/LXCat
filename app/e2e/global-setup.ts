// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { startDbContainer } from "@lxcat/database/test";
import { NewLTPDocument } from "@lxcat/schema";
import { Browser, chromium, errors, FullConfig, Page } from "@playwright/test";
import { exec } from "child_process";
import { rm } from "fs/promises";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { testOidcServer } from "./test-oidc-server";

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

  console.log("Starting database server");
  // start db container
  const arangoUrl = new URL(env.ARANGO_URL);
  const stopDbContainer = await startDbContainer(env.ARANGO_PASSWORD, {
    container: 8529,
    host: parseInt(arangoUrl.port),
  });

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
  const email = "admin@ng.lxcat.net";
  const adminPage = await browser.newPage({ baseURL });
  // Login with test oidc account.
  await signUp(adminPage, email);
  // Add admin roles.
  await runDbCommand(`bun make-admin ${email}`);
  await adminPage.context().storageState({ path: "adminStorageState.json" });
  // TODO create user for each role and store the those users cookies.
  await browser.close();

  console.log("Completed global setup");

  return async () => {
    await rm("adminStorageState.json");
    await stopDbContainer();
    oidc.close();
  };
}

export default globalSetup;

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

const seedDir = "../packages/database/src/test/seed/cross-sections";

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
    await page.locator("div.mantine-MultiSelect-input").click({
      position: { x: 10, y: 10 },
    });
    await page.locator(`text=${org}`).click();
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
