// Transaction History Service - GraphQL-only transaction tracking
import { utils } from 'ethers';
import { generateRandomGasFee } from '../constants/gas';

export interface Transaction {
  id: string;
  timestamp: Date;
  type: 'send' | 'receive' | 'deploy';
  from: string;
  to?: string;
  amount?: string;
  deployId?: string;
  blockHash?: string;
  gasCost?: string;
  status: 'pending' | 'confirmed' | 'failed';
  contractCode?: string;
  note?: string;
  network: string;
  detectedBy?: 'balance_change' | 'manual' | 'auto';
}

export interface TransactionFilter {
  type?: 'send' | 'receive' | 'deploy';
  status?: 'pending' | 'confirmed' | 'failed';
  from?: string;
  to?: string;
  startDate?: Date;
  endDate?: Date;
  network?: string;
}

class TransactionHistoryService {
  static async getTransactions(
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string,
    limit: number = 100
  ): Promise<Transaction[]> {
    try {
      if (!address || !publicKey) {
        console.error('[TransactionHistoryService] Missing parameters:', {
          hasAddress: !!address,
          hasPublicKey: !!publicKey,
          address,
          publicKey
        });
        return [];
      }
      
      console.log('[TransactionHistoryService] Fetching transactions:', {
        address: address?.substring(0, 20) + '...',
        addressFull: address,
        publicKey: publicKey?.substring(0, 20) + '...',
        publicKeyFull: publicKey,
        network,
        graphqlUrl,
        limit
      });
      
      if (!graphqlUrl || !graphqlUrl.trim()) {
        console.error('[TransactionHistoryService] GraphQL URL is missing or empty:', graphqlUrl);
        return [];
      }
      
      const { RChainService } = await import('./rchain');
      
      console.log('[TransactionHistoryService] Creating RChainService with graphqlUrl:', graphqlUrl.substring(0, 60) + '...');
      
      const rchain = new RChainService('', '', '', 'root', graphqlUrl);
      
      console.log('[TransactionHistoryService] About to call fetchTransactionHistory');
      let blockchainTxs;
      try {
        blockchainTxs = await rchain.fetchTransactionHistory(address, publicKey, limit);
        console.log('[TransactionHistoryService] fetchTransactionHistory succeeded, received:', blockchainTxs.length);
      } catch (error: any) {
        console.error('[TransactionHistoryService] fetchTransactionHistory failed:', {
          error: error.message,
          stack: error.stack,
          address,
          publicKey,
          graphqlUrl
        });
        throw error;
      }
      
      console.log('[TransactionHistoryService] Received transactions from blockchain:', blockchainTxs.length);
      
      const transactions: Transaction[] = [];
      
      for (const bcTx of blockchainTxs) {
        const normalizedAddress = address?.toLowerCase().trim();
        const normalizedPublicKey = publicKey?.toLowerCase().trim();
        const normalizedTo = bcTx.to?.toLowerCase().trim();
        const normalizedFrom = bcTx.from?.toLowerCase().trim();
        
        const isReceive = normalizedTo && normalizedTo === normalizedAddress;
        const isSend = normalizedFrom && normalizedFrom === normalizedPublicKey;
        
        if (!isReceive && !isSend) {
          continue;
        }
        
        const transaction: Transaction = {
          id: bcTx.deployId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(bcTx.timestamp),
          type: bcTx.type, // Use the type already determined by RChainService
          from: bcTx.from,
          to: bcTx.to,
          amount: bcTx.amount,
          deployId: bcTx.deployId,
          blockHash: bcTx.blockHash,
          gasCost: generateRandomGasFee(),
          status: bcTx.status,
          network: network,
          detectedBy: 'auto'
        };
        
        transactions.push(transaction);
      }
      
      return transactions;
    } catch (error: any) {
      console.error('[TransactionHistoryService] getTransactions error:', {
        error: error?.message,
        stack: error?.stack,
        address,
        publicKey,
        network,
        graphqlUrl
      });
      return [];
    }
  }

  static async getFilteredTransactions(
    filter: TransactionFilter,
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string
  ): Promise<Transaction[]> {
    const transactions = await this.getTransactions(address, publicKey, network, graphqlUrl);
    
    return transactions.filter(tx => {
      if (filter.type && tx.type !== filter.type) return false;
      if (filter.status && tx.status !== filter.status) return false;
      if (filter.from && tx.from.toLowerCase() !== filter.from.toLowerCase()) return false;
      if (filter.to && tx.to?.toLowerCase() !== filter.to.toLowerCase()) return false;
      if (filter.network && tx.network !== filter.network) return false;
      
      const txDate = new Date(tx.timestamp);
      if (filter.startDate && txDate < filter.startDate) return false;
      if (filter.endDate && txDate > filter.endDate) return false;
      
      return true;
    });
  }

  static async getStatistics(
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string
  ) {
    const transactions = await this.getTransactions(address, publicKey, network, graphqlUrl);

    const stats = {
      total: transactions.length,
      sent: 0,
      received: 0,
      deployed: 0,
      pending: 0,
      confirmed: 0,
      failed: 0,
      totalSent: '0',
      totalReceived: '0',
      totalGas: '0'
    };

    transactions.forEach(tx => {
      if (tx.type === 'send') stats.sent++;
      else if (tx.type === 'receive') stats.received++;
      else if (tx.type === 'deploy') stats.deployed++;

      if (tx.status === 'pending') stats.pending++;
      else if (tx.status === 'confirmed') stats.confirmed++;
      else if (tx.status === 'failed') stats.failed++;

      if (tx.status === 'confirmed' && tx.amount) {
        if (tx.type === 'send') {
          stats.totalSent = (BigInt(stats.totalSent) + BigInt(tx.amount)).toString();
        } else if (tx.type === 'receive') {
          const txAmount = utils.parseEther(tx.amount);
          const totalAmount = utils.parseEther(stats.totalReceived);
          stats.totalReceived = (txAmount.add(totalAmount)).toString();
        }
      }

      if (tx.gasCost) {
        stats.totalGas = (BigInt(stats.totalGas) + BigInt(tx.gasCost)).toString();
      }
    });

    return stats;
  }

  static async exportTransactions(
    format: 'json' | 'csv' = 'json',
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string
  ): Promise<string> {
    const transactions = await this.getTransactions(address, publicKey, network, graphqlUrl);
    
    if (format === 'json') {
      return JSON.stringify(transactions, null, 2);
    }
    
    const headers = [
      'Date',
      'Time',
      'Type',
      'Status',
      'From',
      'To',
      'Amount',
      'Gas Cost',
      'Deploy ID',
      'Block Hash',
      'Network',
      'Note'
    ];
    
    const rows = transactions.map(tx => {
      const date = new Date(tx.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.type,
        tx.status,
        tx.from,
        tx.to || '',
        tx.amount || '',
        tx.gasCost || '',
        tx.deployId || '',
        tx.blockHash || '',
        tx.network,
        tx.note || ''
      ].map(val => `"${val}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  static async downloadTransactions(
    format: 'json' | 'csv' = 'json',
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string
  ) {
    const data = await this.exportTransactions(format, address, publicKey, network, graphqlUrl);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asi-wallet-transactions-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static detectReceivedTransaction(
    toAddress: string,
    previousBalance: string,
    newBalance: string,
    network: string
  ): Transaction | null {
    const prevBalanceNum = BigInt(previousBalance);
    const newBalanceNum = BigInt(newBalance);
    
    if (newBalanceNum <= prevBalanceNum) {
      return null;
    }
    
    const amount = (newBalanceNum - prevBalanceNum).toString();
    
    const transaction: Transaction = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'receive',
      from: 'Unknown',
      to: toAddress,
      amount: amount,
      status: 'confirmed',
      network: network,
      detectedBy: 'balance_change',
      note: 'Detected from balance increase (temporary)'
    };
    
    return transaction;
  }

  static async syncFromBlockchain(
    address: string,
    publicKey: string,
    network: string,
    graphqlUrl: string
  ): Promise<{ added: number; updated: number }> {
    try {
      const transactions = await this.getTransactions(address, publicKey, network, graphqlUrl);
      return { added: transactions.length, updated: 0 };
    } catch (error) {
      return { added: 0, updated: 0 };
    }
  }
}

export default TransactionHistoryService;