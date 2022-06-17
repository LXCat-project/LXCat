import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'cobertura', 'html'],
      exclude: ['**/*{.,-}spec.ts', '**/*{.,-}test.ts']
    },
  },
})
