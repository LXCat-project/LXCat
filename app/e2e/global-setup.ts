import { chromium, FullConfig, Page } from "@playwright/test";
import { testOidcServer } from "./test-oidc-server";
import { startDbContainer } from "@lxcat/database/src/testutils";
import { exec } from "child_process";
import { resolve } from "path";
import { rm } from "fs/promises";
import { db } from "@lxcat/database/src/db";
import { Browser } from "playwright-core";
import { readFile } from "fs/promises";

async function globalSetup(config: FullConfig) {
  const env = config?.webServer?.env || {};

  console.log("Starting oidc server");
  const oidcUrl = new URL(env.TESTOIDC_CLIENT_ISSUER);
  // start test oidc server
  const oidc = testOidcServer(
    env.TESTOIDC_CLIENT_ID,
    env.TESTOIDC_CLIENT_SECRET,
    env.NEXTAUTH_URL + "/callback/testoidc",
    parseInt(oidcUrl.port)
  );

  console.log("Starting database server");
  // start db container
  const arangoUrl = new URL(env.ARANGO_URL);
  const stopDbContainer = await startDbContainer(env.ARANGO_PASSWORD, {
    container: 8529,
    host: parseInt(arangoUrl.port),
  });

  // Make child processes use right env
  process.env.ARANGO_PASSWORD = env.ARANGO_PASSWORD;
  process.env.ARANGO_ROOT_PASSWORD = env.ARANGO_PASSWORD;
  process.env.ARANGO_URL = env.ARANGO_URL;

  console.log("Create collections");
  // create db collections
  await runDbCommand("npm run setup");
  // It is up to tests to login
  // and to populate and truncate db

  console.log("Create admin user and store its cookie");
  const browser = await chromium.launch();
  const baseURL = env.NEXTAUTH_URL.replace("api/auth", "");
  const email = "admin@ng.lxcat.net";
  const adminPage = await browser.newPage({ baseURL });
  // Login with test oidc account
  await signUp(adminPage, email);
  // add admin roles
  await runDbCommand(`npm run make-admin ${email}`);
  await adminPage.context().storageState({ path: "adminStorageState.json" });
  // TODO create user for each role and store the those users cookies.
  await browser.close();

  console.log("Completed global setup");
  // return teardown method
  return async () => {
    await rm("adminStorageState.json");
    await stopDbContainer();
    oidc.close();
  };
}

export default globalSetup;

export async function runDbCommand(command: string) {
  return new Promise((presolve, reject) => {
    exec(
      command,
      {
        cwd: resolve(__dirname, "../../database"),
        env: process.env,
      },
      (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error) {
          reject(error);
        }
        presolve(stdout);
      }
    );
  });
}

async function signUp(page: Page, email: string) {
  await page.goto("/");
  await page.locator("text=Sign in").click();
  await page.locator("text=Sign in with Test dummy").click();
  // Login to test oidc server
  await page.locator('[placeholder="Enter any login"]').fill(email);
  await page.locator('[placeholder="and password"]').fill("foobar");
  await page.locator('button:has-text("Sign-in")').click();
  // Give consent that email and profile can be used by app
  await page.locator("text=Continue").click();
  await page.waitForURL("/");
}

export async function truncateNonUserCollections() {
  const collections = await db().collections(true);
  for (const c of collections) {
    console.log(`Truncating ${c.name}`);
    if (c.name !== "users") {
      await c.truncate();
    }
  }
}

export async function uploadAndPublishDummySet(
  browser: Browser,
  file = "dummy.json",
  org = "Some organization"
) {
  const page = await browser.newPage();
  // Add a set
  await page.goto("/author/scat-css/addraw");
  const dummySet = await readFile(
    `../database/seeds/test/crosssections/${file}`,
    { encoding: "utf8" }
  );
  await page.locator("textarea").fill(dummySet);
  await page.locator("text=Upload cross section set").click();
  await page.waitForSelector('span:has-text("Upload successful")');

  // Make admin user a member of organization
  await page.goto("/admin/users");
  await page.locator("select").selectOption({ label: org });
  await page.waitForSelector(`td:has-text("${org}")`);

  // Publish set
  await page.goto("/author/scat-css");
  await page.reload(); // TODO sometimes no set is listed, use reload to give server some time as workaround
  await page.waitForSelector('td:has-text("draft")');
  // await page.pause()
  await page.locator("tbody >> text=Publish").click();
  // Press publish in dialog
  await page.locator("text=Publish").nth(3).click();
  await page.waitForSelector('td:has-text("published")');
}
