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
      console.log('[Transaction Polling] Checking pending transactions...');
      
      // Check if GraphQL is accessible before polling
      try {
        const testRchain = new RChainService(
          selectedNetwork.url,
          selectedNetwork.readOnlyUrl,
          selectedNetwork.adminUrl,
          selectedNetwork.shardId,
          selectedNetwork.graphqlUrl
        );
        
        // Quick test to see if GraphQL is accessible
        await testRchain.fetchTransactionHistory('test', 'test', 1);
        
        // Reset CORS error count on successful connection
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
      
      // Get all pending transactions
      const pendingTxs = TransactionHistoryService.getFilteredTransactions({
        status: 'pending',
        network: selectedNetwork.name
      });

      if (pendingTxs.length === 0) {
        console.log('[Transaction Polling] No pending transactions found');
        return;
      }

      console.log(`[Transaction Polling] Found ${pendingTxs.length} pending transactions`);

      // Create RChain service instance
      const rchain = new RChainService(
        selectedNetwork.url,
        selectedNetwork.readOnlyUrl,
        selectedNetwork.adminUrl,
        selectedNetwork.shardId,
        selectedNetwork.graphqlUrl
      );

      // Check status for each pending transaction
      for (const tx of pendingTxs) {
        if (!tx.deployId) continue;

        try {
          console.log(`[Transaction Polling] Checking deploy ${tx.deployId}...`);
          
          const result = await rchain.waitForDeployResult(tx.deployId, 1);
          
          if (result.status === 'completed') {
            console.log(`[Transaction Polling] Transaction ${tx.id} confirmed`);
            TransactionHistoryService.updateTransaction(tx.id, {
              status: 'confirmed',
              blockHash: result.blockHash,
              gasCost: result.cost?.toString()
            });
            
            // Trigger balance refresh for affected accounts
            this.refreshAccountBalances(tx);
            
          } else if (result.status === 'errored' || result.status === 'system_error') {
            console.log(`[Transaction Polling] Transaction ${tx.id} failed`);
            TransactionHistoryService.updateTransaction(tx.id, {
              status: 'failed'
            });
          }
          
        } catch (error: any) {
          console.log(`[Transaction Polling] Error checking transaction ${tx.id}:`, error);
          
          // If it's a CORS error and transaction is old enough, assume it's confirmed
          if ((error.code === 'ERR_NETWORK' || error.message.includes('CORS') || error.message.includes('ERR_FAILED')) && tx.deployId) {
            const txAge = Date.now() - tx.timestamp.getTime();
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes
            
            if (txAge > fiveMinutes) {
              console.log(`[Transaction Polling] Transaction ${tx.id} is ${Math.round(txAge / 60000)} minutes old and GraphQL is unavailable. Assuming confirmed.`);
              TransactionHistoryService.updateTransaction(tx.id, {
                status: 'confirmed'
              });
            }
          }
        }
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

  // Get polling status
  static getStatus(): { isActive: boolean; interval: number } {
    return {
      isActive: this.isPolling,
      interval: this.POLL_INTERVAL
    };
  }
}

export default TransactionPollingService;
