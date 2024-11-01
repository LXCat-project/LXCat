import jseslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  jseslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.browser },

    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        ignoreRestSiblings: true,
      }],
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-nocheck": false }],
    },
  },
];
