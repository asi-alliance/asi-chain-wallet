import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RootState, AppDispatch } from 'store';
import { loginWithPassword } from 'store/authSlice';
import { selectAccount, loadAccountsFromStorage } from 'store/walletSlice';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from 'components';
import { SecureStorage } from 'services/secureStorage';
import {
  buildContextKey,
  getRateLimitInfo,
  formatLockoutMessage,
  RateLimitInfo,
} from 'services/loginRateLimit';
import { analyzeRecentActivity, SuspiciousActivityReport } from 'services/loginAuditLog';

const LoginContainer = styled.div`
  max-width: 400px;
  margin: 100px auto;
`;

const Logo = styled.h1`
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 40px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.danger};
  color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const WarningBanner = styled.div`
  background: ${({ theme }) => `${theme.warning}18`};
  border: 1px solid ${({ theme }) => `${theme.warning}40`};
  color: ${({ theme }) => theme.warning};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.4;
`;

const LockoutBanner = styled.div`
  background: ${({ theme }) => `${theme.danger}18`};
  border: 1px solid ${({ theme }) => `${theme.danger}40`};
  color: ${({ theme }) => theme.danger};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
`;

const CountdownText = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const SecurityWarningBanner = styled.div`
  background: ${({ theme }) => `${theme.info}12`};
  border: 1px solid ${({ theme }) => `${theme.info}40`};
  color: ${({ theme }) => theme.text.primary};
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.5;
`;

const SecurityWarningTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: ${({ theme }) => theme.info};
`;

const DismissLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.text.secondary};
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  margin-top: 8px;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.text.primary};
  }
`;

const ActionButtons = styled.div`
  margin-top: 24px;
`;

const LinkButton = styled(Button)`
  margin-top: 16px;
  text-align: center;
`;

const AccountSelector = styled.select`
  padding: 12px 16px;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text.primary};
  font-size: 16px;
  margin-bottom: 16px;
  width: 100%;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.text.secondary};
  margin-top: -8px;
  margin-bottom: 16px;
`;

const ATTEMPTS_WARNING_THRESHOLD = 3;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, hasAccounts, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [password, setPassword] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [showError, setShowError] = useState(false);

  // Rate limit UI state
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [countdownMs, setCountdownMs] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Security warning state (persists across sessions via audit log)
  const [activityReport, setActivityReport] = useState<SuspiciousActivityReport | null>(null);
  const [securityWarningDismissed, setSecurityWarningDismissed] = useState(false);

  const isLockedOut = rateLimitInfo?.locked === true && countdownMs > 0;
  const remainingAttempts = rateLimitInfo
    ? rateLimitInfo.maxAttempts - rateLimitInfo.failedAttempts
    : null;
  const showAttemptsWarning =
    !isLockedOut &&
    remainingAttempts !== null &&
    rateLimitInfo !== null &&
    rateLimitInfo.failedAttempts >= ATTEMPTS_WARNING_THRESHOLD &&
    remainingAttempts > 0;

  const availableAccountNames = useMemo(() => {
    const accounts = SecureStorage.getEncryptedAccounts();
    const uniqueNames = Array.from(new Set(
      accounts
        .filter(acc => acc.name)
        .map(acc => acc.name!)
    ));
    return uniqueNames;
  }, []);

  // ── Rate limit polling ──────────────────────────────────────────────────

  const refreshRateLimitInfo = useCallback(async () => {
    const contextKey = buildContextKey(selectedAccountName || undefined);
    const info = await getRateLimitInfo(contextKey);
    setRateLimitInfo(info);

    if (info.locked && info.remainingMs > 0) {
      setCountdownMs(info.remainingMs);
    } else {
      setCountdownMs(0);
    }
  }, [selectedAccountName]);

  // Analyze audit log for security warnings (3+ consecutive failures, account switching)
  const refreshActivity = useCallback(async () => {
    const report = await analyzeRecentActivity();
    setActivityReport(report);
  }, []);

  const showSecurityWarning =
    !securityWarningDismissed &&
    activityReport !== null &&
    activityReport.showSecurityWarning;

  // Check rate limit + activity on mount and when selected account changes
  useEffect(() => {
    refreshRateLimitInfo();
    refreshActivity();
  }, [refreshRateLimitInfo, refreshActivity]);

  // Countdown timer
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (countdownMs <= 0) return;

    countdownRef.current = setInterval(() => {
      setCountdownMs(prev => {
        const next = prev - 1_000;
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          refreshRateLimitInfo();
          return 0;
        }
        return next;
      });
    }, 1_000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [countdownMs > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Existing effects ────────────────────────────────────────────────────

  useEffect(() => {
    if (availableAccountNames.length > 0 && !selectedAccountName) {
      setSelectedAccountName(availableAccountNames[0]);
    }
  }, [availableAccountNames, selectedAccountName]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!password.trim() || isLockedOut) return;

    try {
      const resultAction = await dispatch(loginWithPassword({ 
        password,
        accountName: selectedAccountName || undefined 
      }));
      
      if (loginWithPassword.fulfilled.match(resultAction)) {
        dispatch(loadAccountsFromStorage());

        if (selectedAccountName) {
          const accountToSelect = resultAction.payload.find(
            acc => acc.name === selectedAccountName
          );
          if (accountToSelect) {
            dispatch(selectAccount(accountToSelect.id));
          }
        } else if (resultAction.payload.length > 0) {
          dispatch(selectAccount(resultAction.payload[0].id));
        }

        navigate('/');
      } else {
        setSecurityWarningDismissed(false);
        await refreshRateLimitInfo();
        await refreshActivity();
      }
    } catch {
      setSecurityWarningDismissed(false);
      await refreshRateLimitInfo();
      await refreshActivity();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim() && !isLockedOut) {
      handleLogin();
    }
  };

  const handleCreateAccount = () => {
    navigate('/accounts');
  };

  if (!hasAccounts) {
    return (
      <LoginContainer>
        <Logo>ASI Wallet</Logo>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ marginBottom: '24px', textAlign: 'center' }}>
              No accounts found. Create your first account to get started.
            </p>
            <Button id="login-create-account-button" onClick={handleCreateAccount} fullWidth>
              Create Account
            </Button>
          </CardContent>
        </Card>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <Logo>ASI Wallet</Logo>
      <Card>
        <CardHeader>
          <CardTitle>Unlock Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          {isLockedOut && (
            <LockoutBanner>
              {formatLockoutMessage(countdownMs)}
              <br />
              <CountdownText>{formatCountdown(countdownMs)}</CountdownText>
            </LockoutBanner>
          )}

          {showAttemptsWarning && (
            <WarningBanner>
              {remainingAttempts === 1
                ? 'Last attempt before temporary lockout.'
                : `${remainingAttempts} attempts remaining before temporary lockout.`}
            </WarningBanner>
          )}

          {showSecurityWarning && (
            <SecurityWarningBanner>
              <SecurityWarningTitle>Security notice</SecurityWarningTitle>
              We noticed several failed login attempts on this wallet.
              If it wasn&apos;t you, consider changing your password after logging in.
              {activityReport?.accountNameChanged && (
                <>
                  <br />
                  Attempts were made with different account names.
                </>
              )}
              <br />
              <DismissLink onClick={() => setSecurityWarningDismissed(true)}>
                Dismiss
              </DismissLink>
            </SecurityWarningBanner>
          )}

          {showError && error && !isLockedOut && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {availableAccountNames.length > 1 && (
            <FormGroup>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: 500,
                color: 'inherit'
              }}>
                Select Wallet
              </label>
              <AccountSelector
                id="login-account-selector"
                value={selectedAccountName}
                onChange={(e) => setSelectedAccountName(e.target.value)}
              >
                {availableAccountNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </AccountSelector>
              <InfoText>
                Different wallets can have the same password. Select the wallet you want to unlock.
              </InfoText>
            </FormGroup>
          )}

          <FormGroup>
            <Input
              id="login-password-input"
              data-testid="login-password-input"
              data-cy="login-password-input"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => {
                const target = e.currentTarget;
                if (target.value !== password) {
                  setPassword(target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={isLockedOut ? 'Temporarily locked' : 'Enter your password'}
              autoFocus={availableAccountNames.length <= 1 && !isLockedOut}
              autoComplete="current-password"
              disabled={isLockedOut}
            />
          </FormGroup>

          <ActionButtons>
            <Button
              id="login-unlock-button"
              onClick={handleLogin}
              loading={isLoading}
              disabled={!password.trim() || isLockedOut}
              fullWidth
            >
              {isLockedOut ? 'Locked' : 'Unlock'}
            </Button>

            <LinkButton
              variant="ghost"
              onClick={handleCreateAccount}
              fullWidth
            >
              Import or Create New Account
            </LinkButton>
          </ActionButtons>
        </CardContent>
      </Card>
    </LoginContainer>
  );
};