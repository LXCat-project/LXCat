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
    "/api/set",
    `/api/set/${setId}`,
    `/api/set/${setId}/legacy`,
    `/api/scat-cs/${itemIds[0]}`,
    `/api/scat-cs/inspect?ids=${itemIds[0]}`,
    `/api/scat-cs/inspect/legacy?ids=${itemIds[0]}`,
    `/api/references/csl-json/for-selection/${itemIds[0]}`,
    `/api/references/csl-json/${itemIds[0]}`,
    "/api/author/set",
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

  test("rejects a token that is not stored for the user", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().unregistered),
      });
      expect(res.status(), path).toBe(401);
    }
  });

  test("rejects a token from before tokens were stored", async ({ request }) => {
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().legacy),
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

  test("rejects a token of a user without the developer role", async ({ request }) => {
    // A token only works while its user has the developer role, also for the
    // author routes that only check for the author role.
    for (const path of protectedPaths) {
      const res = await request.get(path, {
        headers: bearer(apiTokens().authorOnly),
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

test.describe("OpenAPI spec", () => {
  type Spec = {
    components: { securitySchemes: Record<string, unknown> };
    paths: Record<string, Record<string, { security?: Array<object> }>>;
  };

  test("declares the bearer scheme and the corrected paths", async ({ request }) => {
    const spec: Spec = await (await request.get("/api/doc")).json();

    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(Object.keys(spec.paths)).toContain(
      "/author/set/{id}/publish",
    );
    expect(Object.keys(spec.paths)).not.toContain("/author/set/publish");
  });

  // Keeps the documentation in line with the middleware of the routes.
  test("documents a security requirement exactly for the operations that need a token", async ({ request }) => {
    const spec: Spec = await (await request.get("/api/doc")).json();

    for (const [path, operations] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        const url = `/api${path.replace(/\{[^}]+\}/g, "x")}`;
        const res = await request.fetch(url, { method: method.toUpperCase() });
        const documented = (operation.security?.length ?? 0) > 0;
        expect(res.status() === 401, `${method} ${path}`).toBe(documented);
      }
    }
  });
});

test.describe("public endpoints", () => {
  for (
    const path of [
      "/api/doc",
      "/api/set/LTPDocument",
      "/api/set/LTPMixture",
      "/api/set/schema/upload-document",
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
    const res = await request.fetch("/api/set", {
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

  test("only allows exactly the allowed origins", async ({ request }) => {
    const allowed = ["https://loki-suite.github.io", "http://localhost:3000"];
    const lookalikes = [
      "https://loki-suite.github.io.example.com",
      "https://xloki-suite.github.io",
      "https://loki-suiteXgithub.io",
      "http://localhost:3000.example.com",
      "http://xlocalhost:3000",
    ];

    for (const origin of allowed) {
      const res = await request.get("/api/set", {
        headers: { Origin: origin },
      });
      expect(res.headers()["access-control-allow-origin"], origin).toBe(origin);
    }
    for (const origin of lookalikes) {
      const res = await request.get("/api/set", {
        headers: { Origin: origin },
      });
      expect(res.headers()["access-control-allow-origin"], origin)
        .toBeUndefined();
    }
  });

  test("varies the response on the origin", async ({ request }) => {
    const responses = [
      // Preflight.
      await request.fetch("/api/set", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      }),
      // An allowed, a foreign and no origin, all rejected without a token.
      await request.get("/api/set", {
        headers: { Origin: "http://localhost:3000" },
      }),
      await request.get("/api/set", {
        headers: { Origin: "https://example.com" },
      }),
      await request.get("/api/set"),
    ];

    for (const res of responses) {
      expect(res.headers()["vary"]).toContain("Origin");
    }
  });
});
