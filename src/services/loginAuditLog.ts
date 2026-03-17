import { hashValue } from 'utils/encryption';
import { StorageProvider } from './storage';

const AUDIT_LOG_KEY = hashValue('asi_wallet_login_audit_v1');
const MAX_ENTRIES = 100;

export enum LoginAttemptStatus {
  Success = 'success',
  Failure = 'failure',
}

export enum LoginType {
  ByName = 'by_name',
  AllAccounts = 'all_accounts',
}

export enum FailureReason {
  WrongPassword = 'wrong_password',
  NoAccount = 'no_account',
  LockContention = 'lock_contention',
  Unknown = 'unknown',
}

export interface LoginAuditEntry {
  timestamp: string;
  status: LoginAttemptStatus;
  accountName: string;
  loginType: LoginType;
  failureReason?: FailureReason;
}

const UNKNOWN_ACCOUNT = 'unknown';

async function readLog(): Promise<LoginAuditEntry[]> {
  try {
    const adapter = StorageProvider.getAdapter();
    const raw = adapter
      ? await adapter.getItem(AUDIT_LOG_KEY)
      : localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoginAuditEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLog(entries: LoginAuditEntry[]): void {
  const json = JSON.stringify(entries);
  const adapter = StorageProvider.getAdapter();
  if (adapter) {
    adapter.setItem(AUDIT_LOG_KEY, json).catch(() => {
      // IDB write failed; best-effort localStorage fallback
      try { localStorage.setItem(AUDIT_LOG_KEY, json); } catch { /* quota */ }
    });
    return;
  }
  try { localStorage.setItem(AUDIT_LOG_KEY, json); } catch { /* quota */ }
}

function trimEntries(entries: LoginAuditEntry[]): LoginAuditEntry[] {
  return entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function recordLoginAttempt(
  status: LoginAttemptStatus,
  accountName?: string,
  loginType: LoginType = LoginType.ByName,
  failureReason?: FailureReason,
): Promise<void> {
  const entry: LoginAuditEntry = {
    timestamp: new Date().toISOString(),
    status,
    accountName: accountName ?? UNKNOWN_ACCOUNT,
    loginType,
    ...(failureReason !== undefined ? { failureReason } : {}),
  };

  const entries = await readLog();
  writeLog(trimEntries([...entries, entry]));
}

export async function getLoginAuditLog(): Promise<LoginAuditEntry[]> {
  return readLog();
}

export async function clearLoginAuditLog(): Promise<void> {
  const adapter = StorageProvider.getAdapter();
  if (adapter) {
    await adapter.removeItem(AUDIT_LOG_KEY).catch(() => { /* non-critical */ });
  }
  try { localStorage.removeItem(AUDIT_LOG_KEY); } catch { /* non-critical */ }
}