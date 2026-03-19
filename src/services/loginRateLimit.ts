/**
 * Client-side login rate limiting.
 *
 * Persists { failedAttempts, firstAttemptAt, lockedUntil? } per context key
 * in IndexedDB (primary) with localStorage as fallback, matching the
 * IDB-first pattern used throughout this codebase.
 *
 * Context scoping rules:
 *  - Login by account name  → key scoped to that account name
 *  - Login across all names → key scoped to the sorted set of all account names
 *
 * This prevents a legitimate user trying "Alice" from being blocked because
 * someone else is brute-forcing "Bob".
 */

import { hashValue } from 'utils/encryption';
import { StorageProvider } from './storage';

// ── Configuration ──────────────────────────────────────────────────────────

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPTS_WARNING_THRESHOLD = 2; // warn when ≤ N attempts remain

// ── Enums ──────────────────────────────────────────────────────────────────

export enum RateLimitContextType {
  ByName = 'by_name',
  Global  = 'global',
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface RateLimitRecord {
  failedAttempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export interface RateLimitCheckResult {
  isLocked: boolean;
  /** Milliseconds until the lockout expires. Present only when isLocked === true. */
  remainingMs?: number;
  /** How many more failures are allowed before lockout. */
  attemptsRemaining: number;
  /** True when attemptsRemaining ≤ warning threshold (and not yet locked). */
  showWarning: boolean;
}

// ── Internal: storage key ─────────────────────────────────────────────────

function buildStorageKey(contextKey: string): string {
  return hashValue(`asi_wallet_rl_v1_${contextKey}`);
}

// ── Internal: type guard ──────────────────────────────────────────────────

function isValidRecord(value: unknown): value is RateLimitRecord {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.failedAttempts === 'number' &&
    typeof rec.firstAttemptAt === 'number'
  );
}

// ── Internal: persistence (IDB-first, localStorage fallback) ──────────────

async function readRecord(storageKey: string): Promise<RateLimitRecord | null> {
  try {
    const adapter = StorageProvider.getAdapter();
    const raw = adapter
      ? await adapter.getItem(storageKey)
      : localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeRecord(storageKey: string, record: RateLimitRecord): void {
  const json = JSON.stringify(record);
  const adapter = StorageProvider.getAdapter();
  if (adapter) {
    adapter.setItem(storageKey, json).catch(() => {
      try { localStorage.setItem(storageKey, json); } catch { /* quota exceeded */ }
    });
    return;
  }
  try { localStorage.setItem(storageKey, json); } catch { /* quota exceeded */ }
}

async function removeRecord(storageKey: string): Promise<void> {
  const adapter = StorageProvider.getAdapter();
  if (adapter) {
    await adapter.removeItem(storageKey).catch(() => { /* non-critical */ });
  }
  try { localStorage.removeItem(storageKey); } catch { /* non-critical */ }
}

// ── Internal: result builders ─────────────────────────────────────────────

function buildLockedResult(record: RateLimitRecord): RateLimitCheckResult {
  const remainingMs = Math.max(0, (record.lockedUntil ?? 0) - Date.now());
  return { isLocked: true, remainingMs, attemptsRemaining: 0, showWarning: false };
}

function buildOpenResult(record: RateLimitRecord | null): RateLimitCheckResult {
  const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - (record?.failedAttempts ?? 0));
  const showWarning = attemptsRemaining > 0 && attemptsRemaining <= ATTEMPTS_WARNING_THRESHOLD;
  return { isLocked: false, attemptsRemaining, showWarning };
}

// ── Public API: context key builder ───────────────────────────────────────

/**
 * Returns the rate-limit context key for a given login attempt.
 *
 * @param accountName     The specific account name if logging in by name.
 * @param allAccountNames All stored account names (used for global key).
 */
export function buildRateLimitKey(
  accountName: string | undefined,
  allAccountNames: Array<string | undefined>,
): string {
  if (accountName) {
    return `${RateLimitContextType.ByName}:${accountName}`;
  }
  const sortedNames = allAccountNames
    .filter((n): n is string => typeof n === 'string' && n.length > 0)
    .sort((a, b) => a.localeCompare(b))
    .join(',');
  return `${RateLimitContextType.Global}:${sortedNames}`;
}

// ── Public API: rate limit operations ─────────────────────────────────────

export async function checkRateLimit(contextKey: string): Promise<RateLimitCheckResult> {
  const storageKey = buildStorageKey(contextKey);
  const record = await readRecord(storageKey);

  if (!record) return buildOpenResult(null);

  const lockoutExpired = record.lockedUntil !== undefined && Date.now() >= record.lockedUntil;
  if (lockoutExpired) {
    await removeRecord(storageKey);
    return buildOpenResult(null);
  }

  if (record.lockedUntil !== undefined) return buildLockedResult(record);

  return buildOpenResult(record);
}

export async function recordFailedAttempt(contextKey: string): Promise<void> {
  const storageKey = buildStorageKey(contextKey);
  const existing = await readRecord(storageKey);

  const now = Date.now();
  const failedAttempts = (existing?.failedAttempts ?? 0) + 1;
  const firstAttemptAt = existing?.firstAttemptAt ?? now;

  const record: RateLimitRecord = {
    failedAttempts,
    firstAttemptAt,
    ...(failedAttempts >= MAX_FAILED_ATTEMPTS ? { lockedUntil: now + LOCKOUT_DURATION_MS } : {}),
  };

  writeRecord(storageKey, record); // fire-and-forget; consistent with audit log pattern
}

/**
 * Clears the rate-limit record on successful login.
 */
export async function resetRateLimit(contextKey: string): Promise<void> {
  await removeRecord(buildStorageKey(contextKey));
}
