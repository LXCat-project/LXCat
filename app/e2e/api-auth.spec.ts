// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";
import { apiTokens, bearer } from "./api-tokens";
import { getSeededSet } from "./helpers";

// A session cookie must not be enough to use the API.
test.use({ storageState: "adminStorageState.json" });

let protectedPaths: Array<string>;

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:8001/",
    extraHTTPHeaders: bearer(),
  });
  const { setId, itemIds } = await getSeededSet(request);
  await request.dispose();

  protectedPaths = [
    "/api/scat-css",
    `/api/scat-css/${setId}`,
    `/api/scat-css/${setId}/legacy`,
    `/api/scat-cs/${itemIds[0]}`,
    `/api/scat-cs/inspect?ids=${itemIds[0]}`,
    `/api/scat-cs/inspect/legacy?ids=${itemIds[0]}`,
    `/api/references/csl-json/for-selection/${itemIds[0]}`,
    `/api/references/csl-json/${itemIds[0]}`,
    "/api/author/scat-css",
  ];
});

test.describe("authentication", () => {
  test("rejects requests without a token", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
      expect(res.headers()["www-authenticate"], path).toContain("Bearer");
    }
  });

  test("rejects a session cookie without a token", async ({ page }) => {
    // The page context carries the admin session cookie.
    for (const path of protectedPaths) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test("rejects a malformed token", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, { headers: bearer("not-a-token") });
      expect(res.status(), path).toBe(401);
    }
  });

  test("rejects an expired token", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().expired),
      });
      expect(res.status(), path).toBe(401);
    }
  });

  test("rejects a token of an unknown user", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().unknownUser),
      });
      expect(res.status(), path).toBe(401);
    }
  });

  test("rejects a token of a user without the required role", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().noRoles),
      });
      expect(res.status(), path).toBe(403);
    }
  });

  test("accepts a token of a user with the required roles", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, { headers: bearer() });
      // The reference for the item id does not exist.
      expect(res.status(), path).toBe(
        path.startsWith("/api/references/csl-json/") && !path.includes("for-")
          ? 404
          : 200,
      );
    }
  });
});

test.describe("public endpoints", () => {
  for (
    const path of [
      "/api/doc",
      "/api/scat-css/LTPDocument",
      "/api/scat-css/LTPMixture",
      "/api/scat-css/schema/upload-document",
    ]
  ) {
    test(`${path} does not need a token`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(200);
    });
  }
});

test.describe("removed endpoints", () => {
  for (
    const path of [
      "/api/species",
      "/api/species/children?id=x",
      "/api/reactions/type-tags",
      "/api/reactions/reversible",
      "/api/reactions/cs-set",
      "/api/states/partaking",
      "/api/states/in-reaction",
      "/api/scat-cs",
      "/api/author/scat-cs",
      "/api/users/x",
      "/api/organizations",
    ]
  ) {
    test(`${path} does not exist`, async ({ request }) => {
      const res = await request.get(path, { headers: bearer() });
      expect(res.status()).toBe(404);
    });
  }
});

test.describe("CORS", () => {
  test("answers a preflight request without allowing credentials", async ({ request }) => {
    const res = await request.fetch("/api/scat-css", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization",
      },
    });
    expect(res.status()).toBe(204);
    const headers = res.headers();
    expect(headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(headers["access-control-allow-headers"]).toContain("Authorization");
    expect(headers["access-control-allow-credentials"]).toBeUndefined();
  });
});
