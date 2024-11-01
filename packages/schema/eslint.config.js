// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import jslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  jslint.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: globals.browser } },
];
