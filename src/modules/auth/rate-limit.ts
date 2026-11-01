import { HttpError } from "@/shared/lib/errors";

/**
 * In-memory login rate limiter (threat T-01-04).
 * Blocks repeated failed login attempts per email:
 * 5 failures within 15 minutes → 429 until the window expires.
 *
 * In-memory is acceptable for single-instance MVP; move to Redis
 * (or a shared store) before multi-instance deployment.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Attempt = { count: number; resetAt: number };

const failures = new Map<string, Attempt>();

function prune(now: number) {
  for (const [key, entry] of failures) {
    if (now > entry.resetAt) failures.delete(key);
  }
}

/** Throws 429 TOO_MANY_ATTEMPTS if the email is currently rate-limited. */
export function assertLoginAllowed(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  prune(now);
  const entry = failures.get(key);
  if (entry && entry.count >= MAX_ATTEMPTS) {
    throw new HttpError(
      "TOO_MANY_ATTEMPTS",
      "Слишком много попыток входа. Попробуйте позже.",
      429,
    );
  }
}

/** Record a failed login attempt for the email. */
export function recordLoginFailure(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  prune(now);
  const entry = failures.get(key);
  if (entry) {
    entry.count += 1;
  } else {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
}

/** Clear failures after a successful login. */
export function clearLoginFailures(email: string): void {
  failures.delete(email.toLowerCase());
}
