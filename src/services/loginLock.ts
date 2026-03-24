// Ensures only one tab can run login (password-check → unlock → set-session) at a time

const LOGIN_LOCK_NAME = 'wallet-login';

type LoginLockResult<T> = { success: true; value: T } | { success: false; error: Error };

const isWebLocksSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'locks' in navigator &&
  typeof navigator.locks?.request === 'function';

export async function withLoginLock<T>(operation: () => Promise<T>): Promise<T> {
  if (!isWebLocksSupported()) {
    return operation();
  }

  const result = await navigator.locks.request(LOGIN_LOCK_NAME, async (): Promise<LoginLockResult<T>> => {
    try {
      const value = await operation();
      return { success: true, value };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { success: false, error };
    }
  });

  if (!result.success) {
    throw result.error;
  }

  return result.value;
}