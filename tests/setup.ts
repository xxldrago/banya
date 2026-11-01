/**
 * Vitest global setup.
 *
 * Prisma is NOT globally mocked here so integration tests under
 * tests/catalog/ can hit the seeded database. Unit tests that need a
 * mock should call `vi.mock("@/shared/db/client", ...)` locally.
 */
import "@testing-library/jest-dom/vitest";

import fs from "node:fs";
import path from "node:path";

/**
 * Vitest does not inject non-VITE_ variables from .env into process.env.
 * Modules that parse env directly (JWT secrets) need them — fill only
 * keys that are not already set, so real environment always wins.
 */
try {
  const envPath = path.resolve(__dirname, "../.env");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
} catch {
  // No .env file — rely on the real environment
}
