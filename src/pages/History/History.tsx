import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { RootState } from 'store';
import { fetchBalance } from 'store/walletSlice';
import { Card, CardHeader, CardTitle, CardContent, Button } from 'components';
import TransactionHistoryService, { Transaction, TransactionFilter } from 'services/transactionHistory';
import { RChainService } from 'services/rchain';
import TransactionPollingService from 'services/transactionPolling';
import { getTokenDisplayName } from '../../constants/token';
import { utils } from 'ethers';

const HistoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.secondary};
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text.primary};
  font-size: 14px;
  min-width: 150px;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text.secondary};
`;

const TransactionTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: ${({ theme }) => theme.surface};
  border-bottom: 2px solid ${({ theme }) => theme.border};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  &:hover {
    background: ${({ theme }) => theme.surface};
  }
`;

const TableCell = styled.td<{ align?: string }>`
  padding: 12px;
  text-align: ${({ align }) => align || 'left'};
  font-size: 14px;
`;

const TableHeaderCell = styled.th<{ align?: string }>`
  padding: 12px;
  text-align: ${({ align }) => align || 'left'};
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.text.secondary};
`;

const StatusBadge = styled.span<{ status: 'pending' | 'confirmed' | 'failed' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ status, theme }) => 
    status === 'confirmed' ? theme.success + '20' :
    status === 'failed' ? theme.danger + '20' :
    theme.warning + '20'
  };
  color: ${({ status, theme }) =>
    status === 'confirmed' ? theme.success :
    status === 'failed' ? theme.danger :
    theme.warning
  };
`;

const TypeBadge = styled.span<{ type: 'send' | 'receive' | 'deploy' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ type, theme }) =>
    type === 'send' ? theme.primary + '20' :
    type === 'receive' ? theme.success + '20' :
    theme.secondary + '20'
  };
  color: ${({ type, theme }) =>
    type === 'send' ? theme.primary :
    type === 'receive' ? theme.success :
    theme.secondary
  };
`;

const AddressLink = styled.a`
  color: ${({ theme }) => theme.primary};
  text-decoration: none;
  font-family: monospace;
  font-size: 12px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${({ theme }) => theme.text.secondary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const RefreshInfo = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
};

const formatAmount = (amount?: string): string => {
  if (!amount) return '-';
  try {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return `${amount} ${getTokenDisplayName()}`;
    
    return `${amountNum.toFixed(8)} ${getTokenDisplayName()}`;
  } catch (error) {
    return `${amount} ${getTokenDisplayName()}`;
  }
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

export const History: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedAccount, selectedNetwork } = useSelector((state: RootState) => state.wallet);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [stats, setStats] = useState<any>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }, []);

  const checkPendingTransactionStatuses = useCallback(async () => {
    if (!selectedAccount || !selectedNetwork) return;
    
    const pendingTxs = await TransactionHistoryService.getTransactions(
      selectedAccount.revAddress,
      selectedAccount.publicKey,
      selectedNetwork.name,
      selectedNetwork.graphqlUrl || '',
      100
    ).then(txs => txs.filter(tx => tx.status === 'pending'));
    
    const rchain = new RChainService(
      selectedNetwork.url,
      selectedNetwork.readOnlyUrl,
      selectedNetwork.adminUrl,
      selectedNetwork.shardId,
      selectedNetwork.graphqlUrl
    );
    
    for (const tx of pendingTxs) {
      if (tx.deployId) {
        try {
          const result = await rchain.waitForDeployResult(tx.deployId, 1);
          
          if (result.status === 'completed') {
          } else if (result.status === 'errored' || result.status === 'system_error') {
          }
        } catch (error) {
        }
      }
    }
  }, [selectedAccount, selectedNetwork]);

  const loadTransactions = useCallback(async () => {
    if (!selectedAccount || !selectedNetwork) {
      setTransactions([]);
      setStats({ total: 0, sent: 0, received: 0, deployed: 0, pending: 0, confirmed: 0, failed: 0 });
      return;
    }

    try {
      const txs = await TransactionHistoryService.getTransactions(
        selectedAccount.revAddress,
        selectedAccount.publicKey,
        selectedNetwork.name,
        selectedNetwork.graphqlUrl || '',
        100
      );
      
      let filteredTxs = txs;
      if (filter.type) {
        filteredTxs = filteredTxs.filter(tx => tx.type === filter.type);
      }
      if (filter.status) {
        filteredTxs = filteredTxs.filter(tx => tx.status === filter.status);
      }
      
      setTransactions(filteredTxs);

      const statistics = {
        total: filteredTxs.length,
        sent: filteredTxs.filter(tx => tx.type === 'send').length,
        received: filteredTxs.filter(tx => tx.type === 'receive').length,
        deployed: filteredTxs.filter(tx => tx.type === 'deploy').length,
        pending: filteredTxs.filter(tx => tx.status === 'pending').length,
        confirmed: filteredTxs.filter(tx => tx.status === 'confirmed').length,
        failed: filteredTxs.filter(tx => tx.status === 'failed').length
      };
      setStats(statistics);
      
    } catch (error) {
      setTransactions([]);
      setStats({ total: 0, sent: 0, received: 0, deployed: 0, pending: 0, confirmed: 0, failed: 0 });
    }
  }, [selectedAccount, selectedNetwork, filter]);

  useEffect(() => {
    loadTransactions();
    
    checkPendingTransactionStatuses().then(() => {
      loadTransactions();
    });
  }, [loadTransactions, checkPendingTransactionStatuses, selectedAccount, selectedNetwork]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTransactions]);

  const handleExportJSON = async () => {
    if (!selectedAccount || !selectedNetwork) return;
    
    try {
      await TransactionHistoryService.downloadTransactions(
        'json',
        selectedAccount.revAddress,
        selectedAccount.publicKey,
        selectedNetwork.name,
        selectedNetwork.graphqlUrl || ''
      );
    } catch (error) {
    }
  };

  const handleExportCSV = async () => {
    if (!selectedAccount || !selectedNetwork) return;
    
    try {
      await TransactionHistoryService.downloadTransactions(
        'csv',
        selectedAccount.revAddress,
        selectedAccount.publicKey,
        selectedNetwork.name,
        selectedNetwork.graphqlUrl || ''
      );
    } catch (error) {
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Transaction history is now loaded directly from the blockchain. Click OK to refresh the data.')) {
      loadTransactions();
    }
  };

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  return (
    <HistoryContainer>
      <Card>
        <CardHeader>
          <CardTitle>
            Transaction History
            {selectedAccount && (
              <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px', opacity: 0.7 }}>
                ({selectedAccount.name})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionButtons>
            <RefreshInfo>
              <span>Auto-refresh: every 30s</span>
              <span>•</span>
              <span>Last: {lastRefresh.toLocaleTimeString()}</span>
              <Button 
                id="history-refresh-button"
                size="small" 
                variant="ghost" 
                onClick={async () => {
                  TransactionPollingService.forceCheck();
                  
                  if (selectedAccount && selectedNetwork && selectedNetwork.graphqlUrl) {
                    try {
                      const result = await TransactionHistoryService.syncFromBlockchain(
                        selectedAccount.revAddress,
                        selectedAccount.publicKey,
                        selectedNetwork.name,
                        selectedNetwork.graphqlUrl
                      );
                    } catch (error) {
                    }
                  }
                  
                  if (selectedAccount && selectedNetwork) {
                    try {
                      const oldBalance = selectedAccount.balance || '0';
                      const balanceResult = await dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any);
                      
                      if (fetchBalance.fulfilled.match(balanceResult)) {
                        const newBalance = balanceResult.payload.balance;
                        
                        if (parseFloat(newBalance) > parseFloat(oldBalance)) {
                          TransactionHistoryService.detectReceivedTransaction(
                            selectedAccount.revAddress,
                            oldBalance,
                            newBalance,
                            selectedNetwork.name
                          );
                        }
                      }
                    } catch (error) {
                    }
                  }
                  
                  loadTransactions();
                  setLastRefresh(new Date());
                }}
              >
                🔄 Refresh & Sync
              </Button>
              {selectedAccount && (
                <Button
                  id="history-refresh-balance-button"
                  size="small"
                  variant="secondary"
                  onClick={async () => {
                    if (selectedAccount && selectedNetwork) {
                      try {
                        await dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork, forceRefresh: true }) as any);
                      } catch (error) {
                      }
                    }
                  }}
                >
                  💰 Refresh Balance
                </Button>
              )}
            </RefreshInfo>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button id="history-export-json-button" size="small" variant="ghost" onClick={handleExportJSON}>
                Export JSON
              </Button>
              <Button id="history-export-csv-button" size="small" variant="ghost" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button id="history-clear-button" size="small" variant="ghost" onClick={handleClearHistory}>
                Clear History
              </Button>
            </div>
          </ActionButtons>

          <FilterSection>
            <FilterGroup>
              <FilterLabel>Type</FilterLabel>
              <FilterSelect
                id="history-filter-type-select"
                value={filter.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="send">Send</option>
                <option value="deploy">Deploy</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Status</FilterLabel>
              <FilterSelect
                id="history-filter-status-select"
                value={filter.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
              </FilterSelect>
            </FilterGroup>
          </FilterSection>

          <StatsSection>
            <StatCard>
              <CardContent>
                <StatValue>{stats.total || 0}</StatValue>
                <StatLabel>Total Transactions</StatLabel>
              </CardContent>
            </StatCard>
            <StatCard>
              <CardContent>
                <StatValue>{stats.sent || 0}</StatValue>
                <StatLabel>Sent</StatLabel>
              </CardContent>
            </StatCard>
            <StatCard>
              <CardContent>
                <StatValue>{stats.deployed || 0}</StatValue>
                <StatLabel>Deployments</StatLabel>
              </CardContent>
            </StatCard>
          </StatsSection>

          {transactions.length > 0 ? (
            <TransactionTable>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>From</TableHeaderCell>
                    <TableHeaderCell>To</TableHeaderCell>
                    <TableHeaderCell align="right">Amount</TableHeaderCell>
                    <TableHeaderCell>Details</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} id={`history-transaction-row-${tx.id}`}>
                      <TableCell>{formatDate(tx.timestamp)}</TableCell>
                      <TableCell>
                        <TypeBadge type={tx.type}>{tx.type}</TypeBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status}>{tx.status}</StatusBadge>
                      </TableCell>
                      <TableCell>
                        {tx.from === 'Unknown' ? (
                          <span style={{ color: 'inherit', opacity: 0.5 }}>Unknown</span>
                        ) : (
                          <AddressLink href="#" onClick={(e) => e.preventDefault()}>
                            {formatAddress(tx.from)}
                          </AddressLink>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.to ? (
                          <AddressLink href="#" onClick={(e) => e.preventDefault()}>
                            {formatAddress(tx.to)}
                          </AddressLink>
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right">{formatAmount(tx.amount)}</TableCell>
                      <TableCell>
                        {tx.note && <div style={{ fontSize: '12px', marginBottom: '4px' }}>{tx.note}</div>}
                        {tx.deployId && (
                          <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            Deploy: {tx.deployId.substring(0, 16)}...
                            <a
                              id={`copy-deployid-${tx.id}`}
                              href="#"
                              onClick={(e) => { e.preventDefault(); handleCopy(tx.deployId as string); }}
                              style={{ marginLeft: 8 }}
                            >
                              Copy
                            </a>
                          </div>
                        )}
                        {tx.blockHash && (
                          <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            Block: {tx.blockHash.substring(0, 16)}...
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TransactionTable>
          ) : (
            <EmptyState>
              {selectedAccount ? (
                <>
                  <p>No transactions found for {selectedAccount.name}.</p>
                  <p>Your transaction history will appear here once you send, receive, or deploy contracts.</p>
                </>
              ) : (
                <p>Please select an account to view transaction history.</p>
              )}
            </EmptyState>
          )}
        </CardContent>
      </Card>
    </HistoryContainer>
  );
};