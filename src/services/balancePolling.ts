// Balance Polling Service - Automatic background balance checking

import { store } from 'store';
import { fetchBalance } from 'store/walletSlice';
import { getTokenDisplayName } from '../constants/token';
import TransactionHistoryService from './transactionHistory';

interface PollingConfig {
  enabled: boolean;
  intervalMinutes: number;
  lastPollTime?: Date;
}

class BalancePollingService {
  private static readonly STORAGE_KEY = 'asi_wallet_balance_polling_config';
  private static pollingInterval: NodeJS.Timeout | null = null;
  private static isPolling = false;

  private static readonly DEFAULT_CONFIG: PollingConfig = {
    enabled: false,
    intervalMinutes: 5,
  };

  static getConfig(): PollingConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading polling config:', error);
    }
    return this.DEFAULT_CONFIG;
  }

  // Save polling configuration
  static saveConfig(config: PollingConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving polling config:', error);
    }
  }

  // Enable polling
  static enable(intervalMinutes?: number): void {
    const config = this.getConfig();
    config.enabled = true;
    if (intervalMinutes) {
      config.intervalMinutes = intervalMinutes;
    }
    this.saveConfig(config);
    this.start();
  }

  // Disable polling
  static disable(): void {
    const config = this.getConfig();
    config.enabled = false;
    this.saveConfig(config);
    this.stop();
  }

  // Start polling
  static start(): void {
    const config = this.getConfig();
    
    if (!config.enabled) {
      console.info('Balance polling is disabled');
      return;
    }

    this.stop();

    this.pollBalances();

    const intervalMs = config.intervalMinutes * 60 * 1000;
    this.pollingInterval = setInterval(() => {
      this.pollBalances();
    }, intervalMs);
  }

  // Stop polling
  static stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.info('Balance polling stopped');
    }
  }

  // Perform balance polling for all accounts
  static async pollBalances(): Promise<void> {
    if (this.isPolling) {
      console.info('Balance polling already in progress, skipping...');
      return;
    }

    this.isPolling = true;
    const state = store.getState();
    const { accounts, selectedNetwork } = state.wallet;
    const { isAuthenticated } = state.auth;

    // Only poll if authenticated and has accounts
    if (!isAuthenticated || accounts.length === 0) {
      this.isPolling = false;
      return;
    }

    console.info(`[Balance Polling] Starting poll for ${accounts.length} accounts on ${selectedNetwork.name}...`);

    try {
      // Store current balances before fetching
      const previousBalances = new Map<string, string>();
      accounts.forEach(account => {
        const prevBalance = account.balance || '0';
        previousBalances.set(account.id, prevBalance);
      });

      // Fetch balance for each account
      for (const account of accounts) {
        try {
          
          // Dispatch the fetchBalance action
          const result = await store.dispatch(fetchBalance({ account, network: selectedNetwork }));
          
          if (result.payload) {
            const newBalance = (result.payload as any).balance;
            const oldBalance = previousBalances.get(account.id) || '0';
            
            // Detect received transactions if balance increased
            if (parseFloat(newBalance) > parseFloat(oldBalance)) {
              try {
                TransactionHistoryService.detectReceivedTransaction(
                  account.revAddress,
                  oldBalance,
                  newBalance,
                  selectedNetwork.name
                );
              } catch (error) {
              }
            }
          }
          
          // Small delay between requests to avoid overwhelming the node
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[Balance Polling] Failed for account ${account.name}:`, error);
        }
      }

      // Update last poll time
      const config = this.getConfig();
      config.lastPollTime = new Date();
      this.saveConfig(config);

      console.info('[Balance Polling] Completed successfully');
    } catch (error) {
      console.error('[Balance Polling] Error:', error);
    } finally {
      this.isPolling = false;
    }
  }

  // Get time until next poll
  static getTimeUntilNextPoll(): string {
    const config = this.getConfig();
    
    if (!config.enabled || !config.lastPollTime) {
      return 'Not scheduled';
    }

    const lastPoll = new Date(config.lastPollTime);
    const nextPoll = new Date(lastPoll.getTime() + config.intervalMinutes * 60 * 1000);
    const now = new Date();
    const msRemaining = nextPoll.getTime() - now.getTime();

    if (msRemaining <= 0) {
      return 'Polling now...';
    }

    const minutesRemaining = Math.floor(msRemaining / 60000);
    const secondsRemaining = Math.floor((msRemaining % 60000) / 1000);

    if (minutesRemaining > 0) {
      return `${minutesRemaining}m ${secondsRemaining}s`;
    } else {
      return `${secondsRemaining}s`;
    }
  }

  // Initialize polling on app start
  static initialize(): void {
    const config = this.getConfig();
    if (config.enabled) {
      // Wait a bit before starting to ensure app is fully loaded
      setTimeout(() => {
        this.start();
      }, 5000);
    }
  }

  // Update interval
  static updateInterval(intervalMinutes: number): void {
    const config = this.getConfig();
    config.intervalMinutes = intervalMinutes;
    this.saveConfig(config);
    
    // Restart polling if enabled
    if (config.enabled) {
      this.start();
    }
  }

  // Check if polling is enabled
  static isEnabled(): boolean {
    return this.getConfig().enabled;
  }

  // Get current interval in minutes
  static getIntervalMinutes(): number {
    return this.getConfig().intervalMinutes;
  }
}

export default BalancePollingService;