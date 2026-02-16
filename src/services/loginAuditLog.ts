import { hashValue } from 'utils/encryption';

const AUDIT_LOG_KEY = hashValue('asi_wallet_login_audit_v1');
const MAX_ENTRIES = 100;

export enum LoginAttemptStatus {
  Success = 'success',
  Failure = 'failure',
}

export interface LoginAuditEntry {
  timestamp: string;
  status: LoginAttemptStatus;
  accountName: string;
}

const UNKNOWN_ACCOUNT = 'unknown';

function readLog(): LoginAuditEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries: LoginAuditEntry[]): void {
  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota or security error — non-critical
  }
}

function appendAndTrim(entries: LoginAuditEntry[], entry: LoginAuditEntry): LoginAuditEntry[] {
  const updated = [...entries, entry];
  return updated.length > MAX_ENTRIES ? updated.slice(updated.length - MAX_ENTRIES) : updated;
}

export function recordLoginAttempt(
  status: LoginAttemptStatus,
  accountName?: string,
): void {
  const entry: LoginAuditEntry = {
    timestamp: new Date().toISOString(),
    status,
    accountName: accountName ?? UNKNOWN_ACCOUNT,
  };

  const entries = appendAndTrim(readLog(), entry);
  writeLog(entries);
}

export function getLoginAuditLog(): LoginAuditEntry[] {
  return readLog();
}

export function clearLoginAuditLog(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
  } catch {
    // non-critical
  }
}