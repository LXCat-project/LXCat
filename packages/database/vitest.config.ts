// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 180_000, // Docker containers are being started, the default 5s is not enough
    hookTimeout: 180_000, // Docker containers are being started, the default 5s is not enough
    coverage: {
      reporter: ["text", "json-summary", "json"],
      exclude: ["**/*{.,-}spec.ts"],
    },
    globalSetup: "./src/test/global-setup.ts",
  },
});
