import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account, Transaction, Network, WalletState } from 'types/wallet';
import { SecureStorage } from 'services/secureStorage';
import { RChainService } from 'services/rchain';
import { generateRandomGasFee } from '../constants/gas';

const DEVNET_NODES = {
  bootstrap: {
    ip: '54.152.57.201',
    hash: 'abc96ca0a78fbdd2b5e87eaa691bb05f',
    ports: {
      validator: [40400, 40410, 40420, 40430, 40440, 40450],
    }
  },
  validator1: {
    ip: '34.196.119.4',
    hash: 'bb93eaa595aaddf6912e372debc73eef',
    ports: {
      validator: [40400, 40410, 40420],
    }
  },
  validator2: {
    ip: '54.84.69.169',
    hash: '039206b26069004fc3736f3b2fb88a95',
    ports: {
      validator: [40400, 40410, 40420],
    }
  },
  validator3: {
    ip: '52.45.73.187',
    hash: 'b7dc4a862a2509f19c7dfbd22b6d6f40',
    ports: {
      validator: [40400, 40410, 40420],
    }
  },
  observer: {
    ip: '54.235.138.68',
    hash: '91e17db5a9020441d38bf4dd3d24df2b',
    ports: {
      validator: [40400, 40410, 40420, 40430, 40440, 40450],
    }
  }
};

const INTERNAL_DEV_NODES = {
  experimental: {
    ip: '44.198.8.24',
    hash: '69bca1a3d19689cc22cd78f3e2abd47e'
  },
  stable: {
    ip: '54.175.6.183',
    hash: '9a58a8ea5d22e5d33dd36435e9d4b575',
    ports: {
      validator: [40410],
      observer: [40450]
    }
  },
  indexer: {
    ip: '184.73.0.34',
    hash: '58d77d02c7298819a8ce23959a81af06'
  }
};

const API_GATEWAY_URL = 'https://ihmps4dkpg.execute-api.us-east-1.amazonaws.com/prod';

const PRODUCTION_API_GATEWAY_URL = 'https://ihmps4dkpg.execute-api.us-east-1.amazonaws.com/prod';
const PRODUCTION_GRAPHQL_URL = 'https://production-graphql-endpoint.execute-api.us-east-1.amazonaws.com/v1/graphql';
const PRODUCTION_VALIDATOR_HASH = '91e17db5a9020441d38bf4dd3d24df2b';
const PRODUCTION_OBSERVER_HASH = '91e17db5a9020441d38bf4dd3d24df2b';

const PRODUCTION_DOMAINS = [
  'wallet.dev.asichain.io'
];



const getValidatorUrl = (port: number = 40400) => {
  if (window.location.hostname === 'wallet.asi-chain.singularitynet.dev') {
    const stableNode = INTERNAL_DEV_NODES.stable;
    const devPort = 40410;
    const endpointId = Math.floor((devPort % 100) / 10); 
    const url = `${API_GATEWAY_URL}/${stableNode.hash}/endpoint_${endpointId}/HTTP_API`;
    return url;
  }
  
  if (PRODUCTION_DOMAINS.includes(window.location.hostname)) {

    const prodPort = port === 40400 ? 40400 : port;
    const endpointId = Math.floor((prodPort % 100) / 10);
    return `${PRODUCTION_API_GATEWAY_URL}/${PRODUCTION_VALIDATOR_HASH}/endpoint_${endpointId}/HTTP_API`;
  }
  
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    return `http://34.196.119.4:${port}`;
  }
  
  const devnetNode = DEVNET_NODES.validator1;
  const endpointId = Math.floor((port % 100) / 10);
  return `${API_GATEWAY_URL}/${devnetNode.hash}/endpoint_${endpointId}/HTTP_API`;
};

const getObserverUrl = (port: number = 40450) => {
  if (window.location.hostname === 'wallet.asi-chain.singularitynet.dev') {
    const stableNode = INTERNAL_DEV_NODES.stable;
    const devPort = 40450;
    const endpointId = Math.floor((devPort % 100) / 10); 
    const url = `${API_GATEWAY_URL}/${stableNode.hash}/endpoint_${endpointId}/HTTP_API`;
    return url;
  }
  
  if (PRODUCTION_DOMAINS.includes(window.location.hostname)) {
    const prodPort = port === 40450 ? 40400 : port;
    const endpointId = Math.floor((prodPort % 100) / 10);
    const url = `${PRODUCTION_API_GATEWAY_URL}/${PRODUCTION_OBSERVER_HASH}/endpoint_${endpointId}/HTTP_API`;
    return url;
  }
  
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    const url = `http://54.235.138.68:${port}`;
    return url;
  }
  
  const devnetNode = DEVNET_NODES.observer;
  const endpointId = Math.floor((port % 100) / 10);
  const url = `${API_GATEWAY_URL}/${devnetNode.hash}/endpoint_${endpointId}/HTTP_API`;
  return url;
};

const getGraphqlUrl = () => {
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080/v1/graphql';
  }
  
  if (window.location.hostname === 'wallet.asi-chain.singularitynet.dev') {
    return 'https://9hwp5vthsd.execute-api.us-east-1.amazonaws.com/v1/graphql';
  }
  
  if (PRODUCTION_DOMAINS.includes(window.location.hostname)) {
    return PRODUCTION_GRAPHQL_URL;
  }
  
  return 'https://2vlbfiujj8.execute-api.us-east-1.amazonaws.com/v1/graphql';
};

const defaultNetworks: Network[] = [
  {
    id: process.env.CUSTOMNET_ID || 'custom',
    name: process.env.CUSTOMNET_NAME || 'Devnet',
    url: process.env.REACT_APP_CUSTOMNET_URL || getValidatorUrl(40400),
    readOnlyUrl: process.env.REACT_APP_CUSTOMNET_READONLY_URL || getObserverUrl(40400),
    graphqlUrl: process.env.REACT_APP_CUSTOMNET_GRAPHQL_URL || getGraphqlUrl(),
    shardId: process.env.CUSTOMNET_SHARD_ID || 'root',
  },
  {
    id: process.env.MAINNET_ID || 'mainnet',
    name: process.env.MAINNET_NAME || 'Mainnet',
    url: process.env.REACT_APP_FIREFLY_MAINNET_URL || getValidatorUrl(40400),
    readOnlyUrl: process.env.REACT_APP_FIREFLY_MAINNET_READONLY_URL || getObserverUrl(40450),
    graphqlUrl: process.env.REACT_APP_FIREFLY_GRAPHQL_URL || getGraphqlUrl(),
    shardId: process.env.MAINNET_SHARD_ID || 'root',
  },
  {
    id: process.env.TESTNET_ID || 'testnet',
    name: process.env.TESTNET_NAME || 'Custom Network',
    url: process.env.REACT_APP_FIREFLY_TESTNET_URL || getValidatorUrl(40400),
    readOnlyUrl: process.env.REACT_APP_FIREFLY_TESTNET_READONLY_URL || getObserverUrl(40450),
    graphqlUrl: process.env.REACT_APP_FIREFLY_GRAPHQL_URL || getGraphqlUrl(),
    shardId: process.env.TESTNET_SHARD_ID || 'testnet',
  },
  {
    id: process.env.LOCALNET_ID || 'local',
    name: process.env.LOCALNET_NAME || 'Local Network',
    url: process.env.REACT_APP_FIREFLY_LOCAL_URL || 'http://localhost:40400',
    readOnlyUrl: process.env.REACT_APP_FIREFLY_LOCAL_READONLY_URL || 'http://localhost:40450',
    adminUrl: process.env.REACT_APP_FIREFLY_LOCAL_ADMIN_URL || 'http://localhost:40405',
    graphqlUrl: process.env.REACT_APP_FIREFLY_LOCAL_GRAPHQL_URL || 'http://localhost:8080/v1/graphql',
    shardId: process.env.LOCALNET_SHARD_ID || 'root',
  },
];

const NETWORKS_STORAGE_KEY = 'asi_wallet_networks';

const loadNetworks = (): Network[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultNetworks;
  }
  
  try {
    const stored = localStorage.getItem(NETWORKS_STORAGE_KEY);
    if (stored) {
      const networks = JSON.parse(stored) as Network[];
      const networkMap = new Map<string, Network>();
      
      defaultNetworks.forEach(n => networkMap.set(n.id, n));
      
      networks.forEach(n => {
        if (!networkMap.has(n.id)) {
          networkMap.set(n.id, n);
        }
      });
      
      return Array.from(networkMap.values());
    }
  } catch (error) {
    console.error('Failed to load networks from localStorage:', error);
  }
  return defaultNetworks;
};

const saveNetworks = (networks: Network[]) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    localStorage.setItem(NETWORKS_STORAGE_KEY, JSON.stringify(networks));
  } catch (error) {
    console.error('Failed to save networks to localStorage:', error);
  }
};

// Lazy load networks to avoid SSR issues
const getInitialNetworks = () => {
  // For initial state, just use defaults
  // The actual loading from localStorage will happen in a useEffect
  return defaultNetworks;
};

const initialNetworks = getInitialNetworks();

// Load accounts from secure storage (without private keys)
const loadAccountsFromSecureStorage = (): Account[] => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  
  try {
    const secureAccounts = SecureStorage.getEncryptedAccounts();
    return secureAccounts.map(acc => ({
      ...acc,
      privateKey: undefined,
    } as Account));
  } catch (error) {
    console.error('Failed to load accounts from secure storage:', error);
    return [];
  }
};

const createInitialState = (): WalletState => {
  const networks = initialNetworks;
  const defaultNetwork = networks[0] || networks.find(n => n.id === 'custom');
  
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

export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async ({ account, network, forceRefresh = false }: { account: Account; network: Network; forceRefresh?: boolean }) => {
    const rchain = new RChainService(network.url, network.readOnlyUrl, network.adminUrl, network.shardId, network.graphqlUrl);
    const atomicBalance = await rchain.getBalance(account.revAddress, forceRefresh);
    
    const balance = (parseInt(atomicBalance) / 100000000).toString();
    
    return { accountId: account.id, balance };
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'wallet/fetchTransactionHistory',
  async ({ address, publicKey, limit = 50 }: { address: string; publicKey: string; limit?: number }, { getState }) => {
    const state = getState() as { wallet: WalletState };
    const { selectedNetwork } = state.wallet;
    
    if (!selectedNetwork) {
      throw new Error('No network selected');
    }
    
    const rchain = new RChainService(selectedNetwork.url, selectedNetwork.readOnlyUrl, selectedNetwork.adminUrl, selectedNetwork.shardId, selectedNetwork.graphqlUrl);
    const transactions = await rchain.fetchTransactionHistory(address, publicKey, limit);
    
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
  }, { dispatch }) => {
    // Get private key from unlocked account or decrypt with password
    let privateKey: string | undefined;
    
    // First try to get from session
    const unlockedAccount = SecureStorage.getUnlockedAccount(from.id);
    if (unlockedAccount?.privateKey) {
      privateKey = unlockedAccount.privateKey;
    } else if (password) {
      // Try to unlock with password
      const unlocked = SecureStorage.unlockAccount(from.id, password);
      if (unlocked?.privateKey) {
        privateKey = unlocked.privateKey;
      }
    }
    
    if (!privateKey) {
      throw new Error('Account is locked. Please provide password or unlock account first.');
    }
    
    const rchain = new RChainService(network.url, network.readOnlyUrl, network.adminUrl, network.shardId, network.graphqlUrl);
    
    // Convert amount to atomic units (ASI has 8 decimal places)
    // Use more precise calculation to avoid floating point errors
    const amountNum = parseFloat(amount);
    const atomicAmount = Math.floor(amountNum * 100000000 + 0.5).toString();
    
    console.log(`[Send Transaction] Amount conversion:`, {
      userInput: amount,
      amountNum,
      atomicAmount,
      expectedDeduction: `${amountNum} ASI`
    });
    
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
    
    
    rchain.waitForDeployResult(deployId, 24).then(result => {
      if (result.status === 'completed') {
        dispatch(updateTransactionStatus({ deployId, status: 'completed' }));
        dispatch(fetchTransactionHistory({ address: from.revAddress, publicKey: from.publicKey, limit: 50 }));
      } else if (result.status === 'errored' || result.status === 'system_error') {
        dispatch(updateTransactionStatus({ deployId, status: 'failed', error: result.error }));
      }
    }).catch(error => {
      dispatch(updateTransactionStatus({ deployId, status: 'failed', error: error.message }));
    });
    
    return transaction;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Sync accounts from auth state - MERGE instead of replace
    syncAccounts: (state, action: PayloadAction<Account[]>) => {
      const newAccounts = action.payload.map(acc => ({
        ...acc,
        privateKey: undefined, // Never store private keys in wallet state
      }));
      
      // Merge new accounts with existing ones
      newAccounts.forEach(newAccount => {
        const existingIndex = state.accounts.findIndex(a => a.id === newAccount.id);
        if (existingIndex >= 0) {
          // Update existing account
          state.accounts[existingIndex] = newAccount;
        } else {
          // Add new account
          state.accounts.push(newAccount);
        }
      });
      
      // Update selected account if it exists in accounts
      if (state.selectedAccount) {
        const updated = state.accounts.find(a => a.id === state.selectedAccount!.id);
        if (updated) {
          state.selectedAccount = updated;
        } else {
          state.selectedAccount = state.accounts[0] || null;
        }
      } else if (state.accounts.length > 0) {
        state.selectedAccount = state.accounts[0];
      }
    },
    selectAccount: (state, action: PayloadAction<string>) => {
      const account = state.accounts.find(a => a.id === action.payload);
      if (account) {
        state.selectedAccount = account;
        // Save selected account ID to localStorage for persistence
        localStorage.setItem('selectedAccountId', action.payload);
      }
    },
    selectNetwork: (state, action: PayloadAction<string>) => {
      const network = state.networks.find(n => n.id === action.payload);
      if (network) {
        state.selectedNetwork = network;
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      // Remove from secure storage
      SecureStorage.removeAccount(action.payload);
      
      // Update state
      state.accounts = state.accounts.filter(a => a.id !== action.payload);
      if (state.selectedAccount?.id === action.payload) {
        state.selectedAccount = state.accounts[0] || null;
      }
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
      const index = state.networks.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.networks[index] = action.payload;
        // Update selected network if it's the one being edited
        if (state.selectedNetwork.id === action.payload.id) {
          state.selectedNetwork = action.payload;
        }
      }
      // Save to localStorage
      saveNetworks(state.networks);
    },
    addNetwork: (state, action: PayloadAction<Network>) => {
      // Generate a unique ID for the new network
      const timestamp = Date.now();
      const newNetwork = {
        ...action.payload,
        id: `custom-${timestamp}`
      };
      state.networks.push(newNetwork);
      // Save to localStorage
      saveNetworks(state.networks);
    },
    loadNetworksFromStorage: (state) => {
      const loadedNetworks = loadNetworks();
      state.networks = loadedNetworks;
      // Update selected network if it exists in loaded networks
      const selectedNetwork = loadedNetworks.find(n => n.id === state.selectedNetwork.id);
      if (selectedNetwork) {
        state.selectedNetwork = selectedNetwork;
      } else {
        // Use the first network as default instead of looking for 'custom'
        state.selectedNetwork = loadedNetworks[0];
      }
    },
    loadAccountsFromStorage: (state) => {
      // Load accounts from SecureStorage
      try {
        const encryptedAccounts = SecureStorage.getEncryptedAccounts();
        const accounts = encryptedAccounts.map(acc => ({
          ...acc,
          privateKey: undefined, // Never store private keys in Redux state
        } as Account));
        
        state.accounts = accounts;
        
        // If there's a selected account ID in localStorage, restore it
        const selectedAccountId = localStorage.getItem('selectedAccountId');
        if (selectedAccountId && accounts.length > 0) {
          const selectedAccount = accounts.find(a => a.id === selectedAccountId);
          state.selectedAccount = selectedAccount || accounts[0];
        } else if (accounts.length > 0) {
          state.selectedAccount = accounts[0];
        }
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
        const newTransactions = action.payload.map((tx: any) => ({
          id: tx.deployId,
          deployId: tx.deployId,
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          timestamp: new Date(tx.timestamp),
          status: tx.status,
          blockNumber: tx.blockNumber,
          blockHash: tx.blockHash,
          type: tx.type,
          gasCost: tx.type === 'send' ? generateRandomGasFee() : undefined
        }));
        
        const existingIds = new Set(state.transactions.map(tx => tx.id));
        const uniqueNewTransactions = newTransactions.filter(tx => !existingIds.has(tx.id));
        
        state.transactions = [...uniqueNewTransactions, ...state.transactions];
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
  loadNetworksFromStorage,
  loadAccountsFromStorage,
  updateTransactionStatus,
} = walletSlice.actions;

export default walletSlice.reducer;