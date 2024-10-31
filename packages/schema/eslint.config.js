import jslint from "@eslint/js"
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  jslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    ignores: ["*.{js,ts}", "dist/**"],
  }
];
