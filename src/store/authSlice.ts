import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SecureStorage } from 'services/secureStorage';
import { Account, Network } from 'types/wallet';
import { generateKeyPair, importPrivateKey, importEthAddress, importRevAddress } from 'utils/crypto';
import { recordLoginAttempt, LoginAttemptStatus } from 'services/loginAuditLog';

export interface AuthState {
  isAuthenticated: boolean;
  hasAccounts: boolean;
  unlockedAccounts: Account[];
  requirePasswordForTransaction: boolean;
  idleTimeout: number;
  lastActivity: number;
  isLoading: boolean;
  error: string | null;
}

const initUserId = SecureStorage.getCurrentUserId();
const initUnlockedAccounts = SecureStorage.getAllUnlockedAccounts();
const initHasUnlocked = initUnlockedAccounts.length > 0;
const initSessionToken = SecureStorage.getSessionToken();
const initIsAuthenticated =
  SecureStorage.isAuthenticated() && initHasUnlocked && !!initUserId && !!initSessionToken;

if (!initIsAuthenticated && SecureStorage.isAuthenticated()) {
  SecureStorage.setAuthenticated(false);
}

const initialState: AuthState = {
  isAuthenticated: initIsAuthenticated,
  hasAccounts: SecureStorage.hasAccounts(initUserId || undefined),
  unlockedAccounts: initUnlockedAccounts,
  requirePasswordForTransaction: SecureStorage.getSettings().requirePasswordForTransaction,
  idleTimeout: SecureStorage.getSettings().idleTimeout,
  lastActivity: Date.now(),
  isLoading: false,
  error: null,
};

type CreateAccountPayload = {
  name: string;
  password: string;
  networkId?: string;
};

export const createAccountWithPassword = createAsyncThunk(
  'auth/createAccountWithPassword',
  async ({ name, password, networkId }: CreateAccountPayload, { getState }) => {
    const state = getState() as { wallet: { selectedNetwork?: Network } };
    const selectedNetworkId = networkId || state.wallet?.selectedNetwork?.id;
    
    const userId = SecureStorage.generateUserIdFromPassword(password, name);
    const hadAccountsBefore = SecureStorage.hasAccounts(userId);
    
    const keyPair = generateKeyPair();
    const account: Account = {
      id: Date.now().toString(),
      name,
      address: keyPair.revAddress,
      revAddress: keyPair.revAddress,
      ethAddress: keyPair.ethAddress,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      balance: '0',
      ...(selectedNetworkId ? { networkId: selectedNetworkId } : {}),
      createdAt: new Date(),
    };

    SecureStorage.saveAccount(account, password, userId, name);
    SecureStorage.unlockAccount(account.id, password, userId);
    
    if (!hadAccountsBefore) {
      SecureStorage.setAuthenticated(true);
    }

    SecureStorage.setCurrentUserId(userId);
    SecureStorage.setSessionToken(SecureStorage.generateSessionToken());

    return { account, isFirstAccount: !hadAccountsBefore };
  }
);

const normalizeAddress = (address: string | undefined): string => {
  if (!address) return '';
  return address.toLowerCase().trim();
};
const checkAccountExists = (newAccount: Account, userId?: string | null): boolean => {
  const existingAccounts = userId ? SecureStorage.getEncryptedAccounts(userId) : SecureStorage.getEncryptedAccounts();
  const normalizedNewRev = normalizeAddress(newAccount.revAddress);
  const normalizedNewEth = normalizeAddress(newAccount.ethAddress);
  
  return existingAccounts.some(existing => {
    const normalizedExistingRev = normalizeAddress(existing.revAddress);
    const normalizedExistingEth = normalizeAddress(existing.ethAddress);
    
    if (normalizedNewRev && normalizedExistingRev && normalizedNewRev === normalizedExistingRev) {
      return true;
    }
    if (normalizedNewEth && normalizedExistingEth && normalizedNewEth === normalizedExistingEth) {
      return true;
    }
    
    return false;
  });
};

type ImportAccountPayload = {
  name: string;
  value: string;
  type: 'private' | 'public' | 'eth' | 'rev';
  password: string;
  networkId?: string;
};

export const importAccountWithPassword = createAsyncThunk(
  'auth/importAccountWithPassword',
  async ({ name, value, type, password, networkId }: ImportAccountPayload, { getState }) => {
    const state = getState() as { wallet: { selectedNetwork?: Network } };
    const selectedNetworkId = networkId || state.wallet?.selectedNetwork?.id;
    
    const userId = SecureStorage.generateUserIdFromPassword(password, name);
    const hadAccountsBefore = SecureStorage.hasAccounts(userId);
    
    let accountData;
    
    switch (type) {
      case 'private':
        accountData = importPrivateKey(value);
        break;
      case 'eth':
        accountData = importEthAddress(value);
        break;
      case 'rev':
        accountData = importRevAddress(value);
        break;
      default:
        throw new Error('Invalid import type');
    }
    
    const account: Account = {
      id: Date.now().toString(),
      name,
      address: accountData.revAddress!,
      revAddress: accountData.revAddress!,
      ethAddress: accountData.ethAddress!,
      publicKey: accountData.publicKey || '',
      privateKey: accountData.privateKey,
      balance: '0',
      ...(selectedNetworkId ? { networkId: selectedNetworkId } : {}),
      createdAt: new Date(),
    };

    if (checkAccountExists(account, userId)) {
      throw new Error('Account with this address already exists');
    }
    
    if (account.privateKey) {
      SecureStorage.saveAccount(account, password, userId, name);
      SecureStorage.unlockAccount(account.id, password, userId);
    }
    
    if (!hadAccountsBefore) {
      SecureStorage.setAuthenticated(true);
    }

    SecureStorage.setCurrentUserId(userId);
    SecureStorage.setSessionToken(SecureStorage.generateSessionToken());

    return { account, isFirstAccount: !hadAccountsBefore };
  }
);

type ImportKeyfilePayload = {
  keyfileContent: string;
  name: string;
  networkId?: string;
};

export const importFromKeyfile = createAsyncThunk(
  'auth/importFromKeyfile',
  async ({ keyfileContent, name, networkId }: ImportKeyfilePayload, { getState }) => {
    const state = getState() as { wallet: { selectedNetwork?: Network } };
    const selectedNetworkId = networkId || state.wallet?.selectedNetwork?.id;
    
    let userId = SecureStorage.getCurrentUserId();
    if (!userId) {
      throw new Error('Please login first before importing a keyfile');
    }
    
    const secureAccount = SecureStorage.importFromKeyfile(keyfileContent, name, selectedNetworkId, userId);
    return secureAccount;
  }
);

export const loginWithPassword = createAsyncThunk(
  'auth/loginWithPassword',
  async ({ password, accountName }: { password: string; accountName?: string }) => {
    const allAccounts = SecureStorage.getEncryptedAccounts();
    const unlockedAccounts: Account[] = [];
    let foundUserId: string | null = null;
    const accountsToMigrate: string[] = [];

    if (accountName) {
      const userId = SecureStorage.generateUserIdFromPassword(password, accountName);
      const account = allAccounts.find(acc => acc.name === accountName);
      
      if (account) {
        const userIdMatches = !account.userId || account.userId === userId;
        
        if (userIdMatches) {
          const unlocked = SecureStorage.unlockAccount(account.id, password, userId);
          if (unlocked) {
            unlockedAccounts.push(unlocked);
            foundUserId = userId;
            
            if (!account.userId) {
              accountsToMigrate.push(account.id);
            }
          }
        }
      }
    } else {
      const uniqueAccountNames = Array.from(new Set(
        allAccounts
          .filter(acc => acc.name)
          .map(acc => acc.name!)
      ));

      for (const accountNameToTry of uniqueAccountNames) {
        const userId = SecureStorage.generateUserIdFromPassword(password, accountNameToTry);
        
        for (const account of allAccounts) {
          if (account.name !== accountNameToTry) {
            continue;
          }
          
          const userIdMatches = !account.userId || account.userId === userId;
          
          if (!userIdMatches) {
            continue;
          }
          
          const unlocked = SecureStorage.unlockAccount(account.id, password, userId);
          if (unlocked) {
            unlockedAccounts.push(unlocked);
            if (!foundUserId) {
              foundUserId = userId;
            }
            
            if (!account.userId) {
              accountsToMigrate.push(account.id);
            }
          }
        }

        if (foundUserId && unlockedAccounts.length > 0) {
          break;
        }
      }
    }

    if (accountsToMigrate.length > 0 && foundUserId) {
      const allAccountsForUpdate = SecureStorage.getEncryptedAccounts();
      let needsUpdate = false;
      
      const updatedAccounts = allAccountsForUpdate.map(acc => {
        if (accountsToMigrate.includes(acc.id) && !acc.userId) {
          needsUpdate = true;
          return { ...acc, userId: foundUserId! };
        }
        return acc;
      });
      
      if (needsUpdate) {
        SecureStorage.saveEncryptedAccounts(updatedAccounts);
      }
    }

    if (!foundUserId || unlockedAccounts.length === 0) {
      recordLoginAttempt(LoginAttemptStatus.Failure, accountName);
      throw new Error('Invalid password');
    }

    SecureStorage.setCurrentUserId(foundUserId);
    SecureStorage.setAuthenticated(true);
    SecureStorage.setSessionToken(SecureStorage.generateSessionToken());
    recordLoginAttempt(LoginAttemptStatus.Success, accountName);
    return unlockedAccounts;
  }
);

export const unlockAccount = createAsyncThunk(
  'auth/unlockAccount',
  async ({ accountId, password }: { accountId: string; password: string }) => {
    const userId = SecureStorage.getCurrentUserId();
    if (!userId) {
      throw new Error('Please login first');
    }
    
    const account = SecureStorage.unlockAccount(accountId, password, userId);
    if (!account) {
      throw new Error('Invalid password or account not found');
    }
    return account;
  }
);

export const exportAccountKeyfile = createAsyncThunk(
  'auth/exportAccountKeyfile',
  async ({ accountId }: { accountId: string }) => {
    const keyfile = SecureStorage.exportAccount(accountId);
    if (!keyfile) {
      throw new Error('Account not found');
    }

    const blob = new Blob([keyfile], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asi-wallet-${accountId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { accountId, success: true };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.unlockedAccounts = [];
      state.error = null;
      SecureStorage.clearSession();
      SecureStorage.setAuthenticated(false);
    },
    updateActivity: (state) => {
      state.lastActivity = Date.now();
      SecureStorage.updateLastActivity();
    },
    updateSettings: (state, action: PayloadAction<{
      requirePasswordForTransaction?: boolean;
      idleTimeout?: number;
    }>) => {
      if (action.payload.requirePasswordForTransaction !== undefined) {
        state.requirePasswordForTransaction = action.payload.requirePasswordForTransaction;
      }
      if (action.payload.idleTimeout !== undefined) {
        state.idleTimeout = action.payload.idleTimeout;
      }
      SecureStorage.updateSettings(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    checkAuthentication: (state) => {
      const userId = SecureStorage.getCurrentUserId();
      const unlockedAccounts = SecureStorage.getAllUnlockedAccounts();
      const token = SecureStorage.getSessionToken();
      const hasUnlocked = unlockedAccounts.length > 0;
      const isAuthenticated = SecureStorage.isAuthenticated() && hasUnlocked && !!userId && !!token;

      state.isAuthenticated = isAuthenticated;
      state.hasAccounts = SecureStorage.hasAccounts(userId || undefined);
      state.unlockedAccounts = unlockedAccounts;

      if (!isAuthenticated && SecureStorage.isAuthenticated()) {
        SecureStorage.setAuthenticated(false);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAccountWithPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccountWithPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasAccounts = true;
        if (action.payload.isFirstAccount) {
          state.isAuthenticated = true;
        }
        state.unlockedAccounts.push(action.payload.account);
      })
      .addCase(createAccountWithPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create account';
      })
      .addCase(importAccountWithPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importAccountWithPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasAccounts = true;
        if (action.payload.isFirstAccount) {
          state.isAuthenticated = true;
        }
        state.unlockedAccounts.push(action.payload.account);
      })
      .addCase(importAccountWithPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to import account';
      })
      .addCase(importFromKeyfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importFromKeyfile.fulfilled, (state) => {
        state.isLoading = false;
        state.hasAccounts = true;
      })
      .addCase(importFromKeyfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to import keyfile';
      })
      .addCase(loginWithPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.unlockedAccounts = action.payload;
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(unlockAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unlockAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        const exists = state.unlockedAccounts.find(a => a.id === action.payload.id);
        if (!exists) {
          state.unlockedAccounts.push(action.payload);
        }
      })
      .addCase(unlockAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to unlock account';
      })
      .addCase(exportAccountKeyfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(exportAccountKeyfile.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(exportAccountKeyfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to export keyfile';
      });
  },
});

export const {
  logout,
  updateActivity,
  updateSettings,
  clearError,
  checkAuthentication,
} = authSlice.actions;

export default authSlice.reducer;