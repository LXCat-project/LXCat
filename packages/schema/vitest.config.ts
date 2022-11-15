// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "cobertura", "html"],
      exclude: ["**/*{.,-}spec.ts", "**/*{.,-}test.ts"],
    },
  },
});
