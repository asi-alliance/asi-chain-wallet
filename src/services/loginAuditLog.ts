import { hashValue } from 'utils/encryption';
import { StorageProvider } from './storage';

const AUDIT_LOG_KEY = hashValue('asi_wallet_login_audit_v1');
const MAX_ENTRIES = 100;
const CONSECUTIVE_FAILURE_WARNING_THRESHOLD = 3;

// ── Enums ────────────────────────────────────────────────────────────────────

export enum LoginAttemptStatus {
  Success = 'success',
  Failure = 'failure',
  AccountLocked = 'account_locked',
}

export enum LoginType {
  ByName = 'by_name',
  AllAccounts = 'all_accounts',
}

export enum FailureReason {
  WrongPassword = 'wrong_password',
  NoAccount = 'no_account',
  LockContention = 'lock_contention',
  Timeout = 'timeout',
  Cancelled = 'cancelled',
  NetworkError = 'network_error',
  RateLimited = 'rate_limited',
  Unknown = 'unknown',
}

export enum SuspiciousFlag {
  ConsecutiveFailures = 'consecutive_failures',
  AccountNameSwitch = 'account_name_switch',
  RateLimitTriggered = 'rate_limit_triggered',
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginAuditEntry {
  timestamp: string;
  status: LoginAttemptStatus;
  accountName: string;
  loginType: LoginType;
  failureReason?: FailureReason;
  suspiciousFlags?: SuspiciousFlag[];
}

export interface SuspiciousActivityReport {
  consecutiveFailures: number;
  showSecurityWarning: boolean;
  accountNameChanged: boolean;
  recentAccountNames: string[];
}

// ── Storage ──────────────────────────────────────────────────────────────────

const UNKNOWN_ACCOUNT = 'unknown';

async function readLog(): Promise<LoginAuditEntry[]> {
  try {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) return [];
    const raw = await adapter.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoginAuditEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeLog(entries: LoginAuditEntry[]): Promise<void> {
  const adapter = StorageProvider.getAdapter();
  if (!adapter) return;
  const json = JSON.stringify(entries);
  await adapter.setItem(AUDIT_LOG_KEY, json);
}

function trimEntries(entries: LoginAuditEntry[]): LoginAuditEntry[] {
  return entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
}

// ── Recording ────────────────────────────────────────────────────────────────

export async function recordLoginAttempt(
  status: LoginAttemptStatus,
  accountName?: string,
  loginType: LoginType = LoginType.ByName,
  failureReason?: FailureReason,
  suspiciousFlags?: SuspiciousFlag[],
): Promise<void> {
  const entry: LoginAuditEntry = {
    timestamp: new Date().toISOString(),
    status,
    accountName: accountName ?? UNKNOWN_ACCOUNT,
    loginType,
    ...(failureReason !== undefined ? { failureReason } : {}),
    ...(suspiciousFlags !== undefined && suspiciousFlags.length > 0 ? { suspiciousFlags } : {}),
  };

  const entries = await readLog();
  await writeLog(trimEntries([...entries, entry]));
}

// ── Analysis ─────────────────────────────────────────────────────────────────

/**
 * Count consecutive failures walking backwards from the end of the audit log
 * until a success is found. Ignores time — only cares about the sequence.
 * This is used for the security warning ("If it wasn't you, change your password").
 */
export async function getConsecutiveFailureCount(): Promise<number> {
  const entries = await readLog();
  let count = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].status === LoginAttemptStatus.Success) break;
    if (entries[i].status === LoginAttemptStatus.Failure) count++;
    // AccountLocked entries don't count as separate failures
  }
  return count;
}

/**
 * Count consecutive failures from the tail of the log until a success.
 * Returns count + 1 to include the upcoming entry being recorded.
 */
function countConsecutiveFailures(entries: LoginAuditEntry[]): number {
  let count = 1; // include the upcoming entry
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].status === LoginAttemptStatus.Success) break;
    if (entries[i].status === LoginAttemptStatus.Failure) count++;
  }
  return count;
}

/**
 * Check whether the most recent failure used a different account name.
 */
function didAccountNameChange(entries: LoginAuditEntry[], resolvedName: string): boolean {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.status === LoginAttemptStatus.Success) return false;
    if (entry.status !== LoginAttemptStatus.Failure) continue;
    const prevName = entry.accountName;
    return prevName !== resolvedName && prevName !== UNKNOWN_ACCOUNT && resolvedName !== UNKNOWN_ACCOUNT;
  }
  return false;
}

/**
 * Build suspicious flags for the current attempt by analyzing existing history.
 * Call this BEFORE writing the new entry so flags can be attached to it.
 */
export async function detectSuspiciousFlags(
  currentAccountName: string | undefined,
): Promise<SuspiciousFlag[]> {
  const entries = await readLog();
  if (entries.length === 0) return [];

  const flags: SuspiciousFlag[] = [];
  const resolvedName = currentAccountName ?? UNKNOWN_ACCOUNT;

  if (countConsecutiveFailures(entries) >= CONSECUTIVE_FAILURE_WARNING_THRESHOLD) {
    flags.push(SuspiciousFlag.ConsecutiveFailures);
  }

  if (didAccountNameChange(entries, resolvedName)) {
    flags.push(SuspiciousFlag.AccountNameSwitch);
  }

  return flags;
}

/**
 * Full suspicious-activity report for the Login UI.
 * `showSecurityWarning` is true when there are 3+ consecutive failures
 * with no success in between — regardless of how much time has passed.
 */
export async function analyzeRecentActivity(): Promise<SuspiciousActivityReport> {
  const entries = await readLog();

  let consecutiveFailures = 0;
  const recentNames = new Set<string>();
  let accountNameChanged = false;
  let prevFailureName: string | undefined;

  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.status === LoginAttemptStatus.Success) break;
    if (entry.status !== LoginAttemptStatus.Failure) continue;

    consecutiveFailures++;
    if (entry.accountName !== UNKNOWN_ACCOUNT) {
      recentNames.add(entry.accountName);
    }
    if (prevFailureName !== undefined && prevFailureName !== entry.accountName) {
      accountNameChanged = true;
    }
    prevFailureName = entry.accountName;
  }

  return {
    consecutiveFailures,
    showSecurityWarning: consecutiveFailures >= CONSECUTIVE_FAILURE_WARNING_THRESHOLD,
    accountNameChanged,
    recentAccountNames: Array.from(recentNames),
  };
}

// ── Getters / cleanup ────────────────────────────────────────────────────────

export async function getLoginAuditLog(): Promise<LoginAuditEntry[]> {
  return readLog();
}

export async function clearLoginAuditLog(): Promise<void> {
  const adapter = StorageProvider.getAdapter();
  if (!adapter) return;
  await adapter.removeItem(AUDIT_LOG_KEY);
}