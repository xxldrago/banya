/**
 * Vitest global setup.
 *
 * Prisma is NOT globally mocked here so integration tests under
 * tests/catalog/ can hit the seeded database. Unit tests that need a
 * mock should call `vi.mock("@/shared/db/client", ...)` locally.
 */
import "@testing-library/jest-dom/vitest";
