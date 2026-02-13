import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RootState, AppDispatch } from 'store';
import { loginWithPassword } from 'store/authSlice';
import { syncAccounts, selectAccount } from 'store/walletSlice';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from 'components';
import { SecureStorage } from 'services/secureStorage';

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
`;

const InfoText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.text.secondary};
  margin-top: -8px;
  margin-bottom: 16px;
`;

export const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, hasAccounts, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [password, setPassword] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [showError, setShowError] = useState(false);

  const availableAccountNames = useMemo(() => {
    const accounts = SecureStorage.getEncryptedAccounts();
    const uniqueNames = Array.from(new Set(
      accounts
        .filter(acc => acc.name)
        .map(acc => acc.name!)
    ));
    return uniqueNames;
  }, []);

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

  const handleLogin = async () => {
    if (!password.trim()) return;

    try {
      const resultAction = await dispatch(loginWithPassword({ 
        password,
        accountName: selectedAccountName || undefined 
      }));
      
      if (loginWithPassword.fulfilled.match(resultAction)) {
        dispatch(syncAccounts(resultAction.payload));
        
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
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim()) {
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
          {showError && error && (
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
              placeholder="Enter your password"
              autoFocus={availableAccountNames.length <= 1}
              autoComplete="current-password"
            />
          </FormGroup>

          <ActionButtons>
            <Button
              id="login-unlock-button"
              onClick={handleLogin}
              loading={isLoading}
              disabled={!password.trim()}
              fullWidth
            >
              Unlock
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