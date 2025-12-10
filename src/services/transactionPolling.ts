// Centralized Polling Service for Transaction Status Updates
import { store } from '../store';
import { fetchBalance } from '../store/walletSlice';
import { RChainService } from './rchain';
import TransactionHistoryService from './transactionHistory';

class TransactionPollingService {
  private static isPolling = false;
  private static corsErrorCount = 0;
  private static readonly MAX_CORS_ERRORS = 3;
  private static pollInterval: NodeJS.Timeout | null = null;
  private static readonly POLL_INTERVAL = 15000; // 15 seconds
  private static readonly MAX_POLL_ATTEMPTS = 20; // 5 minutes max

  // Start polling for pending transactions
  static start(): void {
    if (this.isPolling) {
      console.log('[Transaction Polling] Already polling, skipping start');
      return;
    }

    console.log('[Transaction Polling] Starting transaction status polling...');
    this.isPolling = true;

    this.pollInterval = setInterval(() => {
      this.pollPendingTransactions();
    }, this.POLL_INTERVAL);

    this.pollPendingTransactions();
  }

  static stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('[Transaction Polling] Stopped transaction status polling');
  }

  // Check if polling is active
  static isActive(): boolean {
    return this.isPolling;
  }

  // Poll pending transactions
  private static async pollPendingTransactions(): Promise<void> {
    if (!this.isPolling) return;

    const state = store.getState();
    const { selectedNetwork } = state.wallet;
    const { isAuthenticated } = state.auth;

    if (!isAuthenticated || !selectedNetwork) {
      return;
    }

      try {
        let graphqlAvailable = false;
        try {
          if (!selectedNetwork.graphqlUrl) {
            return;
          }
          
          const testQuery = {
            query: `query { __typename }`,
            variables: {}
          };
          
          const axios = require('axios');
          await axios.post(selectedNetwork.graphqlUrl, testQuery, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          
          graphqlAvailable = true;
          this.corsErrorCount = 0;
        } catch (error: any) {
          if (error.code === 'ERR_NETWORK' || error.message.includes('CORS') || error.message.includes('ERR_FAILED')) {
            this.corsErrorCount++;
            console.warn(`[Transaction Polling] GraphQL API not accessible due to CORS/network issues. Error count: ${this.corsErrorCount}/${this.MAX_CORS_ERRORS}`);
            
            if (this.corsErrorCount >= this.MAX_CORS_ERRORS) {
              console.warn('[Transaction Polling] Too many CORS errors. Temporarily disabling polling.');
              this.stop();
              return;
            }
            return;
          }
        }
        
        if (graphqlAvailable) {
          await this.checkPendingDeploys(selectedNetwork);
        }


    } catch (error) {
      console.error('[Transaction Polling] Error during polling:', error);
    }
  }

  // Refresh balances for accounts affected by transaction
  private static async refreshAccountBalances(tx: any): Promise<void> {
    const state = store.getState();
    const { accounts, selectedNetwork } = state.wallet;

    if (!selectedNetwork) return;

    const affectedAccounts = accounts.filter(account => 
      account.revAddress.toLowerCase() === tx.from.toLowerCase() ||
      (tx.to && account.revAddress.toLowerCase() === tx.to.toLowerCase())
    );

    for (const account of affectedAccounts) {
      try {
        console.log(`[Transaction Polling] Refreshing balance for ${account.name}...`);
        const oldBalance = account.balance || '0';
        
        const balanceResult = await store.dispatch(fetchBalance({ account, network: selectedNetwork }));
        
        if (fetchBalance.fulfilled.match(balanceResult)) {
          const newBalance = balanceResult.payload.balance;
          
          if (parseFloat(newBalance) > parseFloat(oldBalance)) {
            console.log(`[Transaction Polling] Balance increased for ${account.name}, checking for received transactions...`);
            try {
              TransactionHistoryService.detectReceivedTransaction(
                account.revAddress,
                oldBalance,
                newBalance,
                selectedNetwork.name
              );
            } catch (error) {
              console.error(`[Transaction Polling] Error detecting received transaction for ${account.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`[Transaction Polling] Error refreshing balance for ${account.name}:`, error);
      }
    }
  }

  // Force check all pending transactions (manual trigger)
  static forceCheck(): void {
    console.log('[Transaction Polling] Force checking pending transactions...');
    this.pollPendingTransactions();
  }

  private static async checkPendingDeploys(network: any): Promise<void> {
    try {
      const pendingTxsJson = localStorage.getItem('asi_wallet_pending_transactions');
      if (!pendingTxsJson) {
        return;
      }

      const pendingTxs = JSON.parse(pendingTxsJson);
      if (!Array.isArray(pendingTxs) || pendingTxs.length === 0) {
        return;
      }

      console.log(`[Transaction Polling] Checking ${pendingTxs.length} pending transactions...`);

      const rchain = new RChainService(
        network.url,
        network.readOnlyUrl,
        network.adminUrl,
        network.shardId,
        network.graphqlUrl
      );

      const updatedTxs: any[] = [];
      let hasUpdates = false;
      const MAX_PENDING_AGE_HOURS = 24;
      const now = Date.now();

      for (const tx of pendingTxs) {
        if (!tx.deployId || tx.type !== 'deploy') {
          updatedTxs.push(tx);
          continue;
        }

        const txTimestamp = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
        const ageHours = (now - txTimestamp) / (1000 * 60 * 60);
        
        if (ageHours > MAX_PENDING_AGE_HOURS) {
          console.warn(`[Transaction Polling] ⚠️ Deploy ${tx.deployId} is ${ageHours.toFixed(1)} hours old. Likely never reached the server. Removing from pending.`);
          hasUpdates = true;
          continue;
        }

        try {
          const result = await rchain.waitForDeployResult(tx.deployId, 1);
          
          if (result.status === 'completed') {
            console.log(`[Transaction Polling] ✅ Deploy ${tx.deployId} completed!`);
            hasUpdates = true;
            continue;
          } else if (result.status === 'errored') {
            console.log(`[Transaction Polling] ❌ Deploy ${tx.deployId} errored: ${result.error}`);
            hasUpdates = true;
            continue;
          } else {
            updatedTxs.push(tx);
          }
        } catch (error: any) {
          console.warn(`[Transaction Polling] Error checking deploy ${tx.deployId}:`, error.message);
          updatedTxs.push(tx);
        }
      }

      if (hasUpdates) {
        localStorage.setItem('asi_wallet_pending_transactions', JSON.stringify(updatedTxs));
        console.log(`[Transaction Polling] Updated pending transactions. Remaining: ${updatedTxs.length}`);
        
        if (updatedTxs.length < pendingTxs.length) {
          const state = store.getState();
          const { accounts } = state.wallet;
          for (const account of accounts) {
            try {
              await store.dispatch(fetchBalance({ account, network }));
            } catch (error) {
              console.error(`[Transaction Polling] Error refreshing balance:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Transaction Polling] Error checking pending deploys:', error);
    }
  }

  // Get polling status
  static getStatus(): { isActive: boolean; interval: number } {
    return {
      isActive: this.isPolling,
      interval: this.POLL_INTERVAL
    };
  }
}

export default TransactionPollingService;
