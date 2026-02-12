const WALLET_LOGIN_LOCK_NAME = 'wallet-login';

type LockCallback<T> = () => Promise<T> | T;

type NavigatorLocksLike = {
  request: <T>(
    name: string,
    optionsOrCallback: unknown,
    maybeCallback?: unknown
  ) => Promise<T>;
};

function getNavigatorLocks(): NavigatorLocksLike | null {
  if (typeof navigator === 'undefined') return null;
  const locks = (navigator as any).locks;
  if (!locks || typeof locks.request !== 'function') return null;
  return locks as NavigatorLocksLike;
}

export async function withWalletLoginLock<T>(fn: LockCallback<T>): Promise<T> {
  const locks = getNavigatorLocks();
  if (!locks) {
    return await fn();
  }

  return await locks.request<T>(WALLET_LOGIN_LOCK_NAME, async () => await fn());
}
