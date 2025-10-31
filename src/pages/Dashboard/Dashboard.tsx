import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { RootState } from 'store';
import { fetchBalance } from 'store/walletSlice';
import { Card, CardHeader, CardTitle, CardContent, Button } from 'components';
import { useNavigate } from 'react-router-dom';
import { formatBalanceDashboard } from 'utils/balanceUtils';
import { getAddressLabel } from '../../constants/token';
import TransactionHistoryService from '../../services/transactionHistory';
import { SendIcon, ReceiveIcon, AccountsIcon, ContractIcon, IDEIcon, ClipboardIcon } from 'components/Icons';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 769px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
`;

const BalanceCard = styled(Card)`
  background: ${({ theme }) => theme.gradient.primary};
  color: white !important; /* Force white text in both themes */
  border: none;
  position: relative;
  overflow: hidden;

  /* Add a subtle dark overlay to improve text contrast */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  /* Ensure content appears above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
  
  /* Force all text elements to be white */
  * {
    color: white !important;
  }
`;

const BalanceAmount = styled.div`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: white !important;
`;

const BalanceLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  color: white !important;
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddressRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const AddressLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text.secondary};
`;

const AddressValue = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (min-width: 769px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-top: 24px;
  }
`;

const ActionCard = styled(Card)`
  cursor: pointer;
  transition: transform 0.2s ease;
  overflow: hidden;
  min-height: 100px;
  
  /* Touch feedback for mobile */
  &:active {
    transform: scale(0.98);
  }

  @media (min-width: 769px) {
    &:hover {
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(-2px);
    }
  }

  p {
    font-size: 13px;
    line-height: 1.4;
    margin: 0;
    color: ${({ theme }) => theme.text.secondary};
  }
`;

const ActionCardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NetworkStatusBar = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ $connected, theme }) =>
    $connected ? theme.success + '20' : theme.danger + '20'};
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.danger + '20'};
  color: ${({ theme }) => theme.danger};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.danger};
`;

const StatusDot = styled.div<{ $connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $connected, theme }) => 
    $connected ? theme.success : theme.danger};
`;

const LoadingSkeleton = styled.div<{ height?: string }>`
  height: ${({ height }) => height || '20px'};
  background: ${({ theme }) => theme.surface};
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const NetworkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.text.secondary};
`;

const LastUpdated = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text.tertiary};
`;

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedAccount, selectedNetwork, isLoading } = useSelector(
    (state: RootState) => state.wallet
  );
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (selectedAccount && selectedAccount.revAddress && selectedNetwork) {
      const oldBalance = selectedAccount.balance || '0';
      
      if (selectedNetwork.graphqlUrl) {
        TransactionHistoryService.syncFromBlockchain(
          selectedAccount.revAddress,
          selectedAccount.publicKey,
          selectedNetwork.name,
          selectedNetwork.graphqlUrl
        ).then(result => {
          if (result.added > 0 || result.updated > 0) {
            console.log(`[Dashboard] Synced ${result.added} new, ${result.updated} updated transactions from blockchain`);
          }
        }).catch(error => {
          console.error('[Dashboard] Error syncing from blockchain:', error);
        });
      }
      
      dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any).then((result: any) => {
        if (result.payload) {
          const newBalance = result.payload.balance;
          
          if (parseFloat(newBalance) > parseFloat(oldBalance)) {
            console.log(`[Dashboard] Balance increased for ${selectedAccount.name}, checking for received transactions...`);
            try {
              TransactionHistoryService.detectReceivedTransaction(
                selectedAccount.revAddress,
                oldBalance,
                newBalance,
                selectedNetwork.name
              );
            } catch (error) {
              console.error(`[Dashboard] Error detecting received transaction for ${selectedAccount.name}:`, error);
            }
          }
        }
      });
      
      setLastRefresh(new Date());
    }
  }, [dispatch, selectedAccount, selectedNetwork]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.revAddress && selectedNetwork) {
      const interval = setInterval(() => {
        if (selectedAccount && selectedAccount.revAddress) {
          const oldBalance = selectedAccount.balance || '0';
          
          dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any).then((result: any) => {
            if (result.payload) {
              const newBalance = result.payload.balance;
              
              if (parseFloat(newBalance) > parseFloat(oldBalance)) {
                console.log(`[Dashboard Auto-refresh] Balance increased for ${selectedAccount.name}, checking for received transactions...`);
                try {
                  TransactionHistoryService.detectReceivedTransaction(
                    selectedAccount.revAddress,
                    oldBalance,
                    newBalance,
                    selectedNetwork.name
                  );
                } catch (error) {
                  console.error(`[Dashboard Auto-refresh] Error detecting received transaction for ${selectedAccount.name}:`, error);
                }
              }
            }
          });
          
          setLastRefresh(new Date());
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [dispatch, selectedAccount, selectedNetwork]);

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      if (!selectedNetwork) return;
      
      const networkUrl = selectedNetwork.readOnlyUrl || selectedNetwork.url;
      if (!networkUrl || !networkUrl.trim()) {
        setNetworkStatus('disconnected');
        return;
      }
      
      setNetworkStatus('checking');
      try {
        const response = await fetch(networkUrl + '/api/status', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        setNetworkStatus(response.ok ? 'connected' : 'disconnected');
      } catch {
        setNetworkStatus('disconnected');
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const handleRefreshBalance = () => {
    if (selectedAccount && selectedNetwork) {
      dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any);
      setLastRefresh(new Date());
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (!selectedAccount) {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to ASI Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No accounts found. Create or import an account to get started.</p>
            <ActionButtons>
              <Button onClick={() => navigate('/accounts')}>Manage Accounts</Button>
            </ActionButtons>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <NetworkStatusBar id="dashboard-network-status-bar" $connected={networkStatus === 'connected'}>
        <StatusDot $connected={networkStatus === 'connected'} />
        <NetworkInfo id="dashboard-network-info">
          <span id="dashboard-network-name-display">{selectedNetwork.name}</span>
          <span>•</span>
          <span id="dashboard-network-status">
            {networkStatus === 'checking' ? 'Checking...' : 
             networkStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
          <span>•</span>
          <LastUpdated id="dashboard-last-updated">Updated {formatRelativeTime(lastRefresh)}</LastUpdated>
        </NetworkInfo>
      </NetworkStatusBar>
      
      <DashboardContainer>
        <BalanceCard>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton height="48px" />
            ) : (
            <BalanceAmount id="dashboard-current-balance">
              {formatBalanceDashboard(selectedAccount.balance)}
            </BalanceAmount>
            )}
            <BalanceLabel>Current Balance</BalanceLabel>
            <Button
              id="dashboard-refresh-balance-button"
              variant="ghost"
              size="small"
              onClick={handleRefreshBalance}
              loading={isLoading}
              style={{ marginTop: '16px', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
            >
              Refresh
            </Button>
          </CardContent>
        </BalanceCard>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountInfo>
              <AddressRow>
                <AddressLabel>Name:</AddressLabel>
                <AddressValue id="dashboard-account-name" title={selectedAccount.name}>
                  {selectedAccount.name}
                </AddressValue>
              </AddressRow>
              <AddressRow>
                <AddressLabel>{getAddressLabel()}:</AddressLabel>
                <AddressValue
                  id="dashboard-asi-address"
                  onClick={() => copyToClipboard(selectedAccount.revAddress)}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy"
                >
                  {formatAddress(selectedAccount.revAddress)}
                </AddressValue>
              </AddressRow>
              <AddressRow>
                <AddressLabel>ETH Address:</AddressLabel>
                <AddressValue
                  onClick={() => copyToClipboard(selectedAccount.ethAddress)}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy"
                >
                  {formatAddress(selectedAccount.ethAddress)}
                </AddressValue>
              </AddressRow>
              <AddressRow>
                <AddressLabel>Network:</AddressLabel>
                <AddressValue id="dashboard-network-name">{selectedNetwork.name}</AddressValue>
              </AddressRow>
              <AddressRow>
                <AddressLabel>Last Updated:</AddressLabel>
                <AddressValue>{formatRelativeTime(lastRefresh)}</AddressValue>
              </AddressRow>
            </AccountInfo>
          </CardContent>
        </Card>
      </DashboardContainer>

      <QuickActions>
        <ActionCard onClick={() => navigate('/send')}>
          <CardHeader>
            <ActionCardTitle>
              <SendIcon size={20} />
              Send ASI
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>Send ASI tokens to another address</p>
          </CardContent>
        </ActionCard>

        <ActionCard onClick={() => navigate('/receive')}>
          <CardHeader>
            <ActionCardTitle>
              <ReceiveIcon size={20} />
              Receive ASI
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>Get your address to receive ASI tokens</p>
          </CardContent>
        </ActionCard>

        <ActionCard onClick={() => navigate('/accounts')}>
          <CardHeader>
            <ActionCardTitle>
              <AccountsIcon size={20} />
              Manage Accounts
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>Create, import, or switch between accounts</p>
          </CardContent>
        </ActionCard>

        <ActionCard onClick={() => navigate('/deploy')}>
          <CardHeader>
            <ActionCardTitle>
              <ContractIcon size={20} />
              Deploy Contract
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>Deploy custom Rholang contracts</p>
          </CardContent>
        </ActionCard>

        <ActionCard onClick={() => navigate('/ide')}>
          <CardHeader>
            <ActionCardTitle>
              <IDEIcon size={20} />
              IDE
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>Develop and test Rholang contracts</p>
          </CardContent>
        </ActionCard>

        <ActionCard onClick={() => navigate('/history')}>
          <CardHeader>
            <ActionCardTitle>
              <ClipboardIcon size={20} />
              Transaction History
            </ActionCardTitle>
          </CardHeader>
          <CardContent>
            <p>View and export transaction history</p>
          </CardContent>
        </ActionCard>

      </QuickActions>
    </div>
  );
};