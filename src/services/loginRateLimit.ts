import { hashValue } from 'utils/encryption';
import { StorageProvider } from './storage';

// ── Constants ────────────────────────────────────────────────────────────────

const RATE_LIMIT_KEY_PREFIX = 'asi_wallet_rate_limit_';
const GLOBAL_CONTEXT = '__all_accounts__';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 900_000;   // 15 minutes
const ATTEMPT_WINDOW_MS = 900_000;     // 15 minutes

// ── Types ────────────────────────────────────────────────────────────────────

interface RateLimitState {
  failedAttempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export interface RateLimitStatus {
  locked: boolean;
  remainingMs: number;
}

const UNLOCKED_STATUS: RateLimitStatus = { locked: false, remainingMs: 0 };

// ── Storage helpers (IDB-first, localStorage fallback) ───────────────────────

function storageKey(contextKey: string): string {
  return hashValue(`${RATE_LIMIT_KEY_PREFIX}${contextKey}`);
}

function parseState(raw: string | null): RateLimitState | null {
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.failedAttempts !== 'number' || typeof record.firstAttemptAt !== 'number') {
    return null;
  }
  return {
    failedAttempts: record.failedAttempts,
    firstAttemptAt: record.firstAttemptAt,
    lockedUntil: typeof record.lockedUntil === 'number' ? record.lockedUntil : undefined,
  };
}

async function readState(contextKey: string): Promise<RateLimitState | null> {
  try {
    const key = storageKey(contextKey);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      return parseState(await adapter.getItem(key));
    }
    return parseState(localStorage.getItem(key));
  } catch {
    return null;
  }
}

async function writeState(contextKey: string, state: RateLimitState): Promise<void> {
  try {
    const key = storageKey(contextKey);
    const json = JSON.stringify(state);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.setItem(key, json);
      return;
    }
    localStorage.setItem(key, json);
  } catch {
    // fail-open: best-effort persistence
  }
}

async function deleteState(contextKey: string): Promise<void> {
  try {
    const key = storageKey(contextKey);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.removeItem(key);
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // non-critical
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive a context key that scopes the rate limit counter.
 * - By-name login  → key = the account name
 * - All-accounts   → key = global constant
 *
 * This ensures that failing to log in as "alice" does not count against "bob".
 */
export function buildContextKey(accountName?: string): string {
  return accountName ?? GLOBAL_CONTEXT;
}

export interface RateLimitInfo {
  locked: boolean;
  remainingMs: number;
  failedAttempts: number;
  maxAttempts: number;
}

const UNLOCKED_INFO: RateLimitInfo = { locked: false, remainingMs: 0, failedAttempts: 0, maxAttempts: MAX_ATTEMPTS };

/**
 * Full rate-limit info for UI display: lockout status + attempt counters.
 */
export async function getRateLimitInfo(contextKey: string): Promise<RateLimitInfo> {
  const state = await readState(contextKey);
  if (!state) return UNLOCKED_INFO;

  const now = Date.now();

  if (state.lockedUntil !== undefined && state.lockedUntil > now) {
    return {
      locked: true,
      remainingMs: state.lockedUntil - now,
      failedAttempts: state.failedAttempts,
      maxAttempts: MAX_ATTEMPTS,
    };
  }

  if (state.lockedUntil !== undefined || now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    await deleteState(contextKey);
    return UNLOCKED_INFO;
  }

  return {
    locked: false,
    remainingMs: 0,
    failedAttempts: state.failedAttempts,
    maxAttempts: MAX_ATTEMPTS,
  };
}

/**
 * Check whether the caller is currently locked out.
 * Returns `{ locked: false }` if IDB is unavailable (fail-open).
 */
export async function checkRateLimit(contextKey: string): Promise<RateLimitStatus> {
  const state = await readState(contextKey);
  if (!state) return UNLOCKED_STATUS;

  const now = Date.now();

  // Active lockout?
  if (state.lockedUntil !== undefined && state.lockedUntil > now) {
    return { locked: true, remainingMs: state.lockedUntil - now };
  }

  // Lockout expired or attempt window elapsed → stale record
  if (state.lockedUntil !== undefined || now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    await deleteState(contextKey);
    return UNLOCKED_STATUS;
  }

  return UNLOCKED_STATUS;
}

/**
 * Record a failed authentication attempt.
 * Call **only** for credential failures (wrong password, no account) —
 * infrastructure errors (network, timeout) must not count.
 *
 * Returns the updated status so the caller can surface remaining time.
 */
export async function recordFailedAttempt(contextKey: string): Promise<RateLimitStatus> {
  const now = Date.now();
  let state = await readState(contextKey);

  // Fresh counter or stale window → start new
  if (!state || now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    state = { failedAttempts: 1, firstAttemptAt: now };
    await writeState(contextKey, state);
    return UNLOCKED_STATUS;
  }

  state.failedAttempts += 1;

  if (state.failedAttempts >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_DURATION_MS;
    await writeState(contextKey, state);
    return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
  }

  await writeState(contextKey, state);
  return UNLOCKED_STATUS;
}

/**
 * Reset the counter for the given context (call on successful login).
 */
export async function resetRateLimit(contextKey: string): Promise<void> {
  await deleteState(contextKey);
}

/**
 * Returns a human-friendly message for a locked-out user.
 * Deliberately rounds up to the next full minute to avoid leaking precise timing.
 */
export function formatLockoutMessage(remainingMs: number): string {
  const minutes = Math.ceil(remainingMs / 60_000);
  if (minutes <= 1) return 'Too many failed attempts. Please try again in about a minute.';
  return `Too many failed attempts. Please try again in about ${minutes} minutes.`;
}