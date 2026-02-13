import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from 'store';
import { logout } from 'store/authSlice';
import { SecureStorage } from 'services/secureStorage';
import { onCrossTabLogin } from 'services/sessionChannel';

/**
 * Watches for login events in other tabs.
 * When another tab logs in, this tab's session is invalidated
 * and the user is redirected to /login.
 */
export function useSessionGuard(): void {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    const currentSessionId = SecureStorage.getSessionToken();
    if (!currentSessionId) return;

    unsubscribeRef.current = onCrossTabLogin(currentSessionId, () => {
      dispatch(logout());
      navigate('/login', { replace: true });
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [isAuthenticated, dispatch, navigate]);
}