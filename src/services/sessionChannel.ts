/**
 * Cross-tab session coordination.
 *
 * When a login completes in any tab, it writes a unique session ID
 * to localStorage. Every other tab receives a `storage` event,
 * compares the new ID to its own, and logs out if they differ.
 *
 * localStorage is used (not sessionStorage) because the `storage`
 * event only fires cross-tab for localStorage changes.
 */

const BROADCAST_KEY = 'asi_wallet_active_session';

export function broadcastSessionLogin(tabSessionId: string): void {
  try {
    localStorage.setItem(BROADCAST_KEY, tabSessionId);
  } catch {
    // Storage quota or security error — non-critical
  }
}

export function clearSessionBroadcast(): void {
  try {
    localStorage.removeItem(BROADCAST_KEY);
  } catch {
    // non-critical
  }
}

export function getBroadcastedSessionId(): string | null {
  try {
    return localStorage.getItem(BROADCAST_KEY);
  } catch {
    return null;
  }
}

/**
 * Subscribe to cross-tab login events.
 * Calls `onForeignLogin` when a DIFFERENT tab writes a new session ID.
 * Returns an unsubscribe function.
 */
export function onCrossTabLogin(
  currentTabSessionId: string,
  onForeignLogin: () => void,
): () => void {
  const handler = (event: StorageEvent): void => {
    if (event.key !== BROADCAST_KEY) return;
    if (!event.newValue) return;
    if (event.newValue === currentTabSessionId) return;
    onForeignLogin();
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}