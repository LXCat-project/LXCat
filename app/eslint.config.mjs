// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextTypescript,
  ...nextCoreWebVitals,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  { files: ["e2e/**"], rules: { "react-hooks/rules-of-hooks": "off" } }
]

export default config;
