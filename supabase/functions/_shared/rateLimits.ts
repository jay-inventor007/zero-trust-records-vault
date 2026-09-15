// Centralized so every route's limit is visible in one place instead of
// buried inside each function. Not exhaustive of what the brief requires -
// verify-email isn't in the brief's rate-limited list, but is limited here
// too, since without it a 6-digit code is brute-forceable within its
// lifetime regardless of how tightly resend is throttled.
export const rateLimits = {
  signup: { limit: 5, windowSeconds: 15 * 60 },
  signin: { limit: 10, windowSeconds: 5 * 60 },
  "verify-email": { limit: 10, windowSeconds: 15 * 60 },
  "resend-verification": { limit: 1, windowSeconds: 60 },
  "forgot-password": { limit: 3, windowSeconds: 15 * 60 },
  "reset-password": { limit: 10, windowSeconds: 15 * 60 },
  // Keyed by user id, since these routes require a session. Generous, since
  // legitimate use can genuinely create/delete several records in a row, but
  // still a real ceiling against a scripted loop.
  "create-record": { limit: 30, windowSeconds: 15 * 60 },
  "delete-record": { limit: 30, windowSeconds: 15 * 60 },
} as const;

export type RateLimitedRoute = keyof typeof rateLimits;
