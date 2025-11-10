import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account, Transaction, Network, WalletState } from 'types/wallet';
import { SecureStorage } from 'services/secureStorage';
import { RChainService } from 'services/rchain';
import { generateRandomGasFee, getGasFeeAsNumber } from '../constants/gas';

interface NetworkConfig {
  name: string;
  ValidatorURL: string;
  ReadOnlyURL?: string;
  IndexerURL?: string;
}

const parseNetworksFromEnv = (): Network[] => {
  const networks: Network[] = [];
  
  try {
    const networksEnv = process.env.NETWORKS;
    
    if (!networksEnv) {
      console.warn('NETWORKS environment variable is not set. Using empty networks.');
      return networks;
    }
    
    const config = JSON.parse(networksEnv) as Record<string, NetworkConfig>;
    
    Object.entries(config).forEach(([key, networkConfig]) => {
      if (!networkConfig) {
        return;
      }
      
      const id = key
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const validatorUrl = networkConfig.ValidatorURL?.trim() || '';
      if (!validatorUrl) {
        console.warn(`[parseNetworksFromEnv] Skipping network "${key}" because ValidatorURL is empty`);
        return;
      }
      
      const graphqlUrl = networkConfig.IndexerURL?.trim() || undefined;
      
      networks.push({
        id,
        name: networkConfig.name || key,
        url: validatorUrl,
        readOnlyUrl: networkConfig.ReadOnlyURL?.trim() || undefined,
        graphqlUrl,
        shardId: 'root',
      });
    });
    
  } catch (error) {
    console.error('Failed to parse NETWORKS:', error);
  }
  
  return networks;
};

const defaultNetworks: Network[] = parseNetworksFromEnv();

const isPredefinedNetwork = (networkId: string): boolean => {
  return defaultNetworks.some(n => n.id === networkId);
};

const NETWORKS_STORAGE_KEY = 'asi_wallet_networks';
const getAccountNetworksKey = (accountId?: string | null) =>
  accountId ? `${NETWORKS_STORAGE_KEY}_${accountId}` : NETWORKS_STORAGE_KEY;
const SELECTED_NETWORK_KEY = 'asi_wallet_selected_network';
const PENDING_TRANSACTIONS_KEY = 'asi_wallet_pending_transactions';

const ensureAccountNetwork = (account: Account, networkId?: string): Account => {
  if (!networkId) {
    return account;
  }

  if (!account.networkId) {
    SecureStorage.updateAccountNetwork(account.id, networkId);
    return { ...account, networkId };
  }

  return account;
};

const filterAccountsForNetwork = (accounts: Account[], networkId?: string): Account[] => {
  if (!networkId) {
    return accounts;
  }

  return accounts.filter(account => account.networkId === networkId);
};

const persistSelectedAccountId = (accountId: string | null) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (accountId) {
    localStorage.setItem('selectedAccountId', accountId);
  } else {
    localStorage.removeItem('selectedAccountId');
  }
};

const updateSelectedAccountForNetwork = (state: WalletState) => {
  const networkId = state.selectedNetwork?.id;
  const availableAccounts = filterAccountsForNetwork(state.accounts, networkId);

  let nextSelected: Account | null = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedId = localStorage.getItem('selectedAccountId');
    if (storedId) {
      nextSelected = availableAccounts.find(acc => acc.id === storedId) || null;
    }
  }

  if (!nextSelected && availableAccounts.length > 0) {
    nextSelected = availableAccounts[0];
  }

  state.selectedAccount = nextSelected || null;
  persistSelectedAccountId(nextSelected ? nextSelected.id : null);
};

interface PendingTransaction {
  deployId: string;
  from: string;
  to?: string;
  amount?: string;
  timestamp: string;
  accountId: string;
  type: 'send' | 'receive' | 'deploy';
  expectedBalance?: string;
}

const savePendingTransaction = (tx: PendingTransaction) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    const existing = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
    const pendingTxs: PendingTransaction[] = existing ? JSON.parse(existing) : [];
    
    const existingIndex = pendingTxs.findIndex(t => t.deployId === tx.deployId);
    if (existingIndex >= 0) {
      pendingTxs[existingIndex] = tx;
    } else {
      pendingTxs.push(tx);
    }
    
    localStorage.setItem(PENDING_TRANSACTIONS_KEY, JSON.stringify(pendingTxs));
  } catch (error) {
    console.error('Failed to save pending transaction to localStorage:', error);
  }
};

const loadPendingTransactions = (): PendingTransaction[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load pending transactions from localStorage:', error);
    return [];
  }
};

const removePendingTransaction = (deployId: string) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    const existing = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
    const pendingTxs: PendingTransaction[] = existing ? JSON.parse(existing) : [];
    const filtered = pendingTxs.filter(t => t.deployId !== deployId);
    localStorage.setItem(PENDING_TRANSACTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending transaction from localStorage:', error);
  }
};

const loadNetworks = (accountId?: string | null): Network[] => {
  const result: Network[] = [...defaultNetworks];
  const envNetworkIds = new Set(defaultNetworks.map(n => n.id));
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(getAccountNetworksKey(accountId)) || localStorage.getItem(NETWORKS_STORAGE_KEY);
    if (stored) {
        const storedNetworks = JSON.parse(stored) as Network[];
        
        storedNetworks.forEach(n => {
          if (n.id?.startsWith('custom') && !envNetworkIds.has(n.id)) {
            result.push(n);
          }
        });
    }
  } catch (error) {
    console.error('Failed to load networks from localStorage:', error);
  }
  }
  
  return result;
};

const saveNetworks = (networks: Network[], accountId?: string | null) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    const customNetworks = networks.filter(n => n.id?.startsWith('custom'));
    const key = getAccountNetworksKey(accountId);
    if (customNetworks.length > 0) {
      localStorage.setItem(key, JSON.stringify(customNetworks));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Failed to save networks to localStorage:', error);
  }
};

const getInitialNetworks = () => {
  return defaultNetworks;
};

const initialNetworks = getInitialNetworks();

const createInitialState = (): WalletState => {
  const networks = initialNetworks;
  
  let defaultNetwork: Network | undefined;
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const selectedNetworkId = localStorage.getItem(SELECTED_NETWORK_KEY);
      if (selectedNetworkId) {
        defaultNetwork = networks.find(n => n.id === selectedNetworkId && n.url && n.url.trim() !== '');
      }
    }
  } catch (error) {
    console.error('Failed to load selected network from localStorage:', error);
  }
  
  if (!defaultNetwork) {
    defaultNetwork = networks.find(n => n.url && n.url.trim() !== '');
  }
  
  if (!defaultNetwork) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(NETWORKS_STORAGE_KEY);
        if (stored) {
          const storedNetworks = JSON.parse(stored) as Network[];
          defaultNetwork = storedNetworks.find(n => n.url && n.url.trim() !== '');
        }
      }
    } catch (error) {
      console.error('Failed to load default network from localStorage:', error);
    }
  }
  
  if (!defaultNetwork) {
    defaultNetwork = {
      id: 'default',
      name: 'Default Network',
      url: '',
      shardId: 'root',
    };
  }
  
  return {
    accounts: [],
    selectedAccount: null,
    transactions: [],
    networks: networks,
    selectedNetwork: defaultNetwork,
    isLoading: false,
    error: null,
  };
};

const initialState: WalletState = createInitialState();

const calculateBalanceWithPending = (baseBalance: string, accountId: string, revAddress: string, publicKey: string): string => {
  const pendingTxs = loadPendingTransactions();
  const normalizedRevAddress = revAddress?.toLowerCase().trim();
  const normalizedPublicKey = publicKey?.toLowerCase().trim();
  const chainBalance = parseFloat(baseBalance || '0');
  const removals: string[] = [];
  const EPSILON = 0.0000005; // tolerance for floating point comparisons
  
  let balance = chainBalance;
  
  for (const tx of pendingTxs) {
    if (tx.accountId !== accountId) continue;
    
    const txFrom = (tx.from || '').toLowerCase().trim();
    
    if (tx.type === 'send' && (txFrom === normalizedRevAddress || txFrom === normalizedPublicKey)) {
      const expected = tx.expectedBalance ? parseFloat(tx.expectedBalance) : undefined;
      if (expected !== undefined && chainBalance <= expected + EPSILON) {
        removals.push(tx.deployId);
        continue;
      }
      const amount = parseFloat(tx.amount || '0');
      const gasFee = getGasFeeAsNumber();
      balance -= (amount + gasFee);
    } else if (tx.type === 'deploy' && (txFrom === normalizedRevAddress || txFrom === normalizedPublicKey)) {
      const expected = tx.expectedBalance ? parseFloat(tx.expectedBalance) : undefined;
      if (expected !== undefined && chainBalance <= expected + EPSILON) {
        removals.push(tx.deployId);
        continue;
      }
      const gasFee = getGasFeeAsNumber();
      balance -= gasFee;
    }
  }
  
  if (removals.length > 0) {
    removals.forEach(removePendingTransaction);
  }
  
  return Math.max(0, balance).toFixed(8);
};

export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async ({ account, network, forceRefresh = false }: { account: Account; network: Network; forceRefresh?: boolean }) => {
    const rchain = new RChainService(network.url, network.readOnlyUrl, network.adminUrl, network.shardId, network.graphqlUrl);
    const atomicBalance = await rchain.getBalance(account.revAddress, forceRefresh);
    
    const baseBalance = (parseInt(atomicBalance) / 100000000).toString();
    const balanceWithPending = calculateBalanceWithPending(baseBalance, account.id, account.revAddress, account.publicKey);
    
    return { accountId: account.id, balance: balanceWithPending };
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'wallet/fetchTransactionHistory',
  async ({ address, publicKey, limit = 50 }: { address: string; publicKey: string; limit?: number }, { getState, dispatch }) => {
    const state = getState() as { wallet: WalletState };
    const { selectedNetwork, accounts } = state.wallet;
    
    if (!selectedNetwork) {
      throw new Error('No network selected');
    }
    
    const validatorUrl = selectedNetwork.url?.trim();
    if (!validatorUrl) {
      throw new Error(`Network "${selectedNetwork.name}" has no validator URL configured`);
    }
    
    const rchain = new RChainService(validatorUrl, selectedNetwork.readOnlyUrl, selectedNetwork.adminUrl, selectedNetwork.shardId, selectedNetwork.graphqlUrl);
    const transactions = await rchain.fetchTransactionHistory(address, publicKey, limit);
    
    const pendingTxs = loadPendingTransactions();
    const pendingDeployIds = new Set(pendingTxs.map(t => t.deployId));
    
    transactions.forEach((tx: any) => {
      if (pendingDeployIds.has(tx.deployId)) {
        const pendingTx = pendingTxs.find(t => t.deployId === tx.deployId);
        if (pendingTx) {
          const account = accounts.find(a => a.id === pendingTx.accountId);
          if (account) {
            dispatch(fetchBalance({ account, network: selectedNetwork, forceRefresh: true }));
          }
        }
      }
    });
    
    return transactions;
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async ({
    from,
    to,
    amount,
    password,
    network,
  }: {
    from: Account;
    to: string;
    amount: string;
    password?: string;
    network: Network;
  }, { dispatch, getState }) => {
    let privateKey: string | undefined;
    
    const unlockedAccount = SecureStorage.getUnlockedAccount(from.id);
    if (unlockedAccount?.privateKey) {
      privateKey = unlockedAccount.privateKey;
    } else if (password) {
      const unlocked = SecureStorage.unlockAccount(from.id, password);
      if (unlocked?.privateKey) {
        privateKey = unlocked.privateKey;
      }
    }
    
    if (!privateKey) {
      throw new Error('Account is locked. Please provide password or unlock account first.');
    }
    
    const validatorUrl = network.url?.trim();
    if (!validatorUrl) {
      throw new Error(`Network "${network.name}" has no validator URL configured`);
    }
    
    const rchain = new RChainService(validatorUrl, network.readOnlyUrl, network.adminUrl, network.shardId, network.graphqlUrl);
    
    const amountNum = parseFloat(amount);
    const atomicAmount = Math.floor(amountNum * 100000000 + 0.5).toString();
    
    if (to.trim().toLowerCase().startsWith('0x')) {
      throw new Error('Sending to Ethereum addresses is not supported');
    }
    
    let expectedBalanceAfterConfirmation: string | undefined;
    try {
      const atomicBalanceBefore = await rchain.getBalance(from.revAddress, true);
      const chainBalanceBefore = Number(atomicBalanceBefore) / 100000000;
      const gasFee = getGasFeeAsNumber();
      const expected = Math.max(0, chainBalanceBefore - amountNum - gasFee);
      expectedBalanceAfterConfirmation = expected.toFixed(8);
    } catch (error) {
      console.warn('[sendTransaction] Failed to fetch balance before transfer for pending metadata:', error);
    }
    
    const deployId = await rchain.transfer(from.revAddress, to, atomicAmount, privateKey);
    
    const transaction: Transaction = {
      id: deployId,
      deployId,
      from: from.revAddress,
      to,
      amount,
      timestamp: new Date(),
      status: 'pending',
      gasCost: generateRandomGasFee(),
    };
    
    savePendingTransaction({
      deployId,
      from: from.revAddress,
      to,
      amount,
      timestamp: new Date().toISOString(),
      accountId: from.id,
      type: 'send',
      expectedBalance: expectedBalanceAfterConfirmation,
    });
    
    return transaction;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    syncAccounts: (state, action: PayloadAction<Account[]>) => {
      const networkId = state.selectedNetwork?.id;

      const incomingAccounts = action.payload
        .map(acc => {
          const sanitized: Account = {
            ...acc,
            privateKey: undefined,
          };
          return ensureAccountNetwork(sanitized, networkId);
        })
        .filter(acc => !networkId || acc.networkId === networkId);

      incomingAccounts.forEach(newAccount => {
        const existingIndex = state.accounts.findIndex(a => a.id === newAccount.id);
        if (existingIndex >= 0) {
          state.accounts[existingIndex] = newAccount;
        } else {
          state.accounts.push(newAccount);
        }
      });

      state.accounts = filterAccountsForNetwork(state.accounts, networkId);
      updateSelectedAccountForNetwork(state);
    },
    selectAccount: (state, action: PayloadAction<string>) => {
      const account = state.accounts.find(a => a.id === action.payload);
      if (account && (!account.networkId || account.networkId === state.selectedNetwork?.id)) {
        state.selectedAccount = account;
        persistSelectedAccountId(action.payload);
      }
    },
    selectNetwork: (state, action: PayloadAction<string>) => {
      const network = state.networks.find(n => n.id === action.payload);
      if (network && network.url && network.url.trim() !== '') {
        state.selectedNetwork = network;
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(SELECTED_NETWORK_KEY, network.id);
        }

        try {
          const encryptedAccounts = SecureStorage.getEncryptedAccounts();
          const accounts = encryptedAccounts.map(acc => {
            const account: Account = {
              ...acc,
              privateKey: undefined,
            };
            return ensureAccountNetwork(account, network.id);
          });

          state.accounts = filterAccountsForNetwork(accounts, network.id);
        } catch (error) {
          console.error('Failed to reload accounts for selected network:', error);
          state.accounts = [];
        }

        updateSelectedAccountForNetwork(state);
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      SecureStorage.removeAccount(action.payload);
      
      state.accounts = state.accounts.filter(a => a.id !== action.payload);
      updateSelectedAccountForNetwork(state);
    },
    updateAccountBalance: (state, action: PayloadAction<{ accountId: string; balance: string }>) => {
      const account = state.accounts.find(a => a.id === action.payload.accountId);
      if (account) {
        account.balance = action.payload.balance;
      }
      if (state.selectedAccount?.id === action.payload.accountId) {
        state.selectedAccount.balance = action.payload.balance;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    updateNetwork: (state, action: PayloadAction<Network>) => {
      const networkToUpdate = action.payload;
      
      if (isPredefinedNetwork(networkToUpdate.id)) {
        console.warn(`Cannot update predefined network "${networkToUpdate.id}". Only custom networks can be edited.`);
        return;
      }
      
      if (!networkToUpdate.id?.startsWith('custom')) {
        console.warn(`Network updates are only allowed for custom networks (custom-*). Attempted to update: "${networkToUpdate.id}"`);
        return;
      }
      const index = state.networks.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.networks[index] = action.payload;
        if (state.selectedNetwork.id === action.payload.id) {
          state.selectedNetwork = action.payload;
        }
      } else {
        state.networks.push(action.payload);
      }
      saveNetworks(state.networks, state.selectedAccount?.id);
    },
    addNetwork: (state, action: PayloadAction<Network>) => {
      const networkToAdd = action.payload;
      
      if (isPredefinedNetwork(networkToAdd.id)) {
        console.warn(`Cannot add predefined network "${networkToAdd.id}" as custom network.`);
        return;
      }
      const timestamp = Date.now();
      const newNetwork = {
        ...action.payload,
        id: action.payload.id?.startsWith('custom') ? action.payload.id : `custom-${timestamp}`
      };
      state.networks.push(newNetwork);
      saveNetworks(state.networks, state.selectedAccount?.id);
    },
    removeNetwork: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!id?.startsWith('custom')) {
        console.warn(`Only custom networks can be removed. Attempted: "${id}"`);
        return;
      }
      state.networks = state.networks.filter(n => n.id !== id);
      saveNetworks(state.networks, state.selectedAccount?.id);
      if (state.selectedNetwork?.id === id) {
        const firstAvailable = state.networks.find(n => n.url && n.url.trim() !== '') || state.networks[0];
        if (firstAvailable) {
          state.selectedNetwork = firstAvailable;
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(SELECTED_NETWORK_KEY, firstAvailable.id);
          }
        }
      }
    },
    loadNetworksFromStorage: (state) => {
      const loadedNetworks = loadNetworks(state.selectedAccount?.id);
      state.networks = loadedNetworks;
      
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const selectedNetworkId = localStorage.getItem(SELECTED_NETWORK_KEY);
          if (selectedNetworkId) {
            const selectedNetwork = loadedNetworks.find(n => n.id === selectedNetworkId && n.url && n.url.trim() !== '');
      if (selectedNetwork) {
        state.selectedNetwork = selectedNetwork;
              return;
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore selected network:', error);
      }
      
      const currentSelected = loadedNetworks.find(n => n.id === state.selectedNetwork.id && n.url && n.url.trim() !== '');
      if (currentSelected) {
        state.selectedNetwork = currentSelected;
      } else {
        const firstAvailable = loadedNetworks.find(n => n.url && n.url.trim() !== '');
        if (firstAvailable) {
          state.selectedNetwork = firstAvailable;
        }
      }
    },
    loadAccountsFromStorage: (state) => {
      try {
        const encryptedAccounts = SecureStorage.getEncryptedAccounts();
        const networkId = state.selectedNetwork?.id;

        const accounts = encryptedAccounts.map(acc => {
          const account: Account = {
            ...acc,
            privateKey: undefined,
          };
          return ensureAccountNetwork(account, networkId);
        });

        state.accounts = filterAccountsForNetwork(accounts, networkId);
        updateSelectedAccountForNetwork(state);
      } catch (error) {
        console.error('Failed to load accounts from storage:', error);
      }
    },
    updateTransactionStatus: (state, action: PayloadAction<{ deployId: string; status: 'pending' | 'completed' | 'failed'; error?: string }>) => {
      const transaction = state.transactions.find(tx => tx.deployId === action.payload.deployId);
      if (transaction) {
        transaction.status = action.payload.status;
        if (action.payload.error) {
          transaction.error = action.payload.error;
        }
        
        if (action.payload.status === 'completed' || action.payload.status === 'failed') {
          removePendingTransaction(action.payload.deployId);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        const account = state.accounts.find(a => a.id === action.payload.accountId);
        if (account) {
          account.balance = action.payload.balance;
        }
        if (state.selectedAccount?.id === action.payload.accountId) {
          state.selectedAccount.balance = action.payload.balance;
        }
        state.isLoading = false;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch balance';
        state.isLoading = false;
      })
      .addCase(sendTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.isLoading = false;
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send transaction';
        state.isLoading = false;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        const pendingTxs = loadPendingTransactions();
        const pendingDeployIds = new Set(pendingTxs.map(t => t.deployId));
        const confirmedDeployIds: string[] = [];
        
        const newTransactions = action.payload.map((tx: any) => {
          const isPendingInStorage = pendingDeployIds.has(tx.deployId);
          
          if (isPendingInStorage) {
            const pendingTx = pendingTxs.find(t => t.deployId === tx.deployId);
            if (pendingTx) {
              removePendingTransaction(tx.deployId);
              confirmedDeployIds.push(tx.deployId);
            }
          }
          
          return {
            id: tx.deployId,
            deployId: tx.deployId,
            from: tx.from,
            to: tx.to,
            amount: tx.amount,
            timestamp: new Date(tx.timestamp),
            status: isPendingInStorage ? 'completed' : tx.status,
            blockNumber: tx.blockNumber,
            blockHash: tx.blockHash,
            type: tx.type,
            gasCost: tx.type === 'send' ? generateRandomGasFee() : undefined
          };
        });
        
        const existingIds = new Set(state.transactions.map(tx => tx.id));
        const uniqueNewTransactions = newTransactions.filter(tx => !existingIds.has(tx.id));
        
        state.transactions = [...uniqueNewTransactions, ...state.transactions];
        
        confirmedDeployIds.forEach(deployId => {
          const tx = state.transactions.find(t => t.deployId === deployId);
          if (tx && tx.status === 'pending') {
            tx.status = 'completed';
          }
        });
      });
  },
});

export const {
  syncAccounts,
  selectAccount,
  selectNetwork,
  removeAccount,
  updateAccountBalance,
  addTransaction,
  clearError,
  updateNetwork,
  addNetwork,
  removeNetwork,
  loadNetworksFromStorage,
  loadAccountsFromStorage,
  updateTransactionStatus,
} = walletSlice.actions;

export default walletSlice.reducer;