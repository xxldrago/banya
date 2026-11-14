import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
      include: ["src/modules/**", "src/shared/**", "src/app/api/**"],
      exclude: ["**/*.test.ts", "**/node_modules/**"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/Users/alekseimikhalkin/Documents/banya/src",
    },
  },
});
