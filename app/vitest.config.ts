import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/e2e/**'],
        coverage: {
            reporter: ["text", "cobertura", "html"],
            exclude: ["**/*{.,-}test.ts"],
        }
    }
})