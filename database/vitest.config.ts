import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 180_000, // Docker containers are being started, the default 5s is not enough
    hookTimeout: 180_000, // Docker containers are being started, the default 5s is not enough
    coverage: {
      reporter: ["text", "cobertura", "html"],
      exclude: ["**/*{.,-}spec.ts"],
    },
  },
});
