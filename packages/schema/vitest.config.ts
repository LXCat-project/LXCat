// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{spec,test}.ts"],
    coverage: {
      reporter: ["text", "json-summary", "json", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
