import axios, { AxiosInstance } from 'axios';
import { signDeploy } from 'utils/crypto';

// Global balance cache to prevent excessive API calls
const globalBalanceCache: Map<string, { balance: string; timestamp: number }> = new Map();
const BALANCE_CACHE_TTL = 15000; // 15 seconds cache

export interface Deploy {
  term: string;
  phloLimit: number;
  phloPrice: number;
  validAfterBlockNumber: number;
  timestamp: number;
  shardId?: string;
}

export interface SignedDeploy extends Deploy {
  deployer: string;
  sig: string;
  sigAlgorithm: string;
}

export class RChainService {
  private validatorClient: AxiosInstance;
  private readOnlyClient: AxiosInstance;
  private adminClient?: AxiosInstance;
  private nodeUrl: string;
  private readOnlyUrl: string;
  private adminUrl?: string;
  private graphqlUrl: string;
  private shardId: string;

  constructor(nodeUrl: string, readOnlyUrl?: string, adminUrl?: string, shardId: string = 'root', graphqlUrl?: string) {
    if (!nodeUrl || !nodeUrl.trim()) {
      if (!graphqlUrl || !graphqlUrl.trim()) {
        throw new Error('RChainService: either nodeUrl (validator URL) or graphqlUrl must be provided');
      }
      this.nodeUrl = '';
    } else {
      this.nodeUrl = nodeUrl.trim();
    }

    this.readOnlyUrl = (readOnlyUrl && readOnlyUrl.trim()) || this.nodeUrl;
    this.adminUrl = adminUrl;
    this.graphqlUrl = (graphqlUrl && graphqlUrl.trim()) || 'http://18.142.221.192:8080/v1/graphql';
    this.shardId = shardId;

    // Validator client for state-changing operations (only if nodeUrl is provided)
    this.validatorClient = axios.create({
      baseURL: this.nodeUrl || 'http://localhost',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Read-only client for queries
    this.readOnlyClient = axios.create({
      baseURL: this.readOnlyUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Admin client for propose operations (local networks)
    if (adminUrl) {
      this.adminClient = axios.create({
        baseURL: adminUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Real RNode HTTP API call with intelligent routing
  private async rnodeHttp(apiMethod: string, data?: any): Promise<any> {
    const postMethods = ['prepare-deploy', 'deploy', 'data-at-name', 'explore-deploy', 'propose'];
    const isPost = !!data && postMethods.includes(apiMethod);
    const method = isPost ? 'POST' : 'GET';
    const url = `/api/${apiMethod}`;

    // Determine which client to use based on operation type
    let client: AxiosInstance;
    let nodeDescription: string;

    if (apiMethod === 'propose' && this.adminClient) {
      // Propose operations use admin client (for local networks)
      client = this.adminClient;
      nodeDescription = `Admin Node at ${this.adminUrl}`;
    } else if (apiMethod === 'explore-deploy' || (this.isReadOnlyOperation(apiMethod) && !isPost)) {
      // explore-deploy ALWAYS goes to read-only node, even though it's a POST
      // Other read operations use read-only client only for GET requests
      client = this.readOnlyClient;
      nodeDescription = `Read-Only Node at ${this.readOnlyUrl}`;
    } else {
      // Write operations use validator client
      client = this.validatorClient;
      nodeDescription = `Validator Node at ${this.nodeUrl}`;
    }

    try {
      // F1R3wallet sends explore-deploy as plain text, not JSON
      const isExploreDeployString = apiMethod === 'explore-deploy' && typeof data === 'string';

      const response = await client.request({
        method,
        url,
        data: isPost ? data : undefined,
        headers: isExploreDeployString ? {
          'Content-Type': 'text/plain'
        } : undefined,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`RNode API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error(`Network Error: Unable to connect to ${nodeDescription}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  // Helper method to determine if an operation is read-only
  private isReadOnlyOperation(apiMethod: string): boolean {
    const readOnlyMethods = [
      'explore-deploy',      // For balance checks and exploratory deploys
      'blocks',              // Block information
      'status',              // Node status
      'deploy',              // GET only - to check deploy status
      'light-blocks-by-heights',
      'deploy-service',
      'data-at-name'
    ];

    return readOnlyMethods.includes(apiMethod);
  }

  async getBalance(revAddress: string, forceRefresh: boolean = false): Promise<string> {
    const cacheKey = `${revAddress}_${this.readOnlyUrl}`;
    const cached = globalBalanceCache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < BALANCE_CACHE_TTL) {
      return cached.balance;
    }

    const checkBalanceRho = `
      new return, rl(\`rho:registry:lookup\`), ASIVaultCh, vaultCh in {
        rl!(\`rho:rchain:asiVault\`, *ASIVaultCh) |
        for (@(_, ASIVault) <- ASIVaultCh) {
          @ASIVault!("findOrCreate", "${revAddress}", *vaultCh) |
          for (@maybeVault <- vaultCh) {
            match maybeVault {
              (true, vault) => @vault!("balance", *return)
              (false, err)  => return!(err)
            }
          }
        }
      }
    `;

    try {
      const result = await this.exploreDeployData(checkBalanceRho);

      if (result && result.length > 0) {
        // F1R3wallet expects the balance to be directly in expr[0].ExprInt.data
        const firstExpr = result[0];

        // Check if it's a direct integer (balance)
        if (firstExpr?.ExprInt?.data !== undefined) {
          const balance = firstExpr.ExprInt.data.toString();
          globalBalanceCache.set(cacheKey, { balance, timestamp: now });
          return balance;
        }

        // Check if it's an error string
        if (firstExpr?.ExprString?.data !== undefined) {
          console.error('Balance check error:', firstExpr.ExprString.data);
          // Cache zero balance for error case
          globalBalanceCache.set(cacheKey, { balance: '0', timestamp: now });
          return '0';
        }
      }

      // Cache zero balance for no result case
      globalBalanceCache.set(cacheKey, { balance: '0', timestamp: now });
      return '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      // Don't cache errors to allow retry
      return '0';
    }
  }

  async transfer(fromAddress: string, toAddress: string, amount: string, privateKey: string): Promise<string> {
    const transferRho = `
      new 
        deployerId(\`rho:rchain:deployerId\`),
        stdout(\`rho:io:stdout\`),
        rl(\`rho:registry:lookup\`),
        ASIVaultCh,
        vaultCh,
        toVaultCh,
        asiVaultkeyCh,
        resultCh
      in {
        rl!(\`rho:rchain:asiVault\`, *ASIVaultCh) |
        for (@(_, ASIVault) <- ASIVaultCh) {
          @ASIVault!("findOrCreate", "${fromAddress}", *vaultCh) |
          @ASIVault!("findOrCreate", "${toAddress}", *toVaultCh) |
          @ASIVault!("deployerAuthKey", *deployerId, *asiVaultkeyCh) |
          for (@(true, vault) <- vaultCh; key <- asiVaultkeyCh; @(true, toVault) <- toVaultCh) {
            @vault!("transfer", "${toAddress}", ${amount}, *key, *resultCh) |
            for (@result <- resultCh) {
              match result {
                (true, Nil) => {
                  stdout!(("Transfer successful:", ${amount}, "ASI"))
                }
                (false, reason) => {
                  stdout!(("Transfer failed:", reason))
                }
              }
            }
          } |
          for (@(false, errorMsg) <- vaultCh) {
            stdout!(("Sender vault error:", errorMsg))
          } |
          for (@(false, errorMsg) <- toVaultCh) {
            stdout!(("Destination vault error:", errorMsg))
          }
        }
      }
    `;

    return await this.sendDeploy(transferRho, privateKey);
  }

  // Send deploy (like F1R3FLY wallet)
  async sendDeploy(rholangCode: string, privateKey: string, phloLimit: number = 500000): Promise<string> {
    try {
      // Get latest block number
      const blocks = await this.rnodeHttp('blocks/1');
      const blockNumber = blocks && blocks.length > 0 ? blocks[0].blockNumber : 0;

      // Create deploy data
      const deployData: Deploy = {
        term: rholangCode,
        phloLimit,
        phloPrice: 1,
        validAfterBlockNumber: blockNumber,
        timestamp: Date.now(),
        shardId: this.shardId
      };

      // Sign the deploy
      const signedDeploy = signDeploy(deployData, privateKey);

      // Format for Web API (like f1r3wallet)
      const webDeploy = {
        data: {
          term: deployData.term,
          timestamp: deployData.timestamp,
          phloPrice: deployData.phloPrice,
          phloLimit: deployData.phloLimit,
          validAfterBlockNumber: deployData.validAfterBlockNumber,
          shardId: deployData.shardId
        },
        sigAlgorithm: signedDeploy.sigAlgorithm,
        signature: signedDeploy.sig,
        deployer: signedDeploy.deployer
      };

      // Debug logging
      console.log('Deploy data:', deployData);
      console.log('Signed deploy:', signedDeploy);
      console.log('Web deploy:', JSON.stringify(webDeploy, null, 2));

      // Send to RNode
      const result = await this.rnodeHttp('deploy', webDeploy);

      console.log('Deploy result:', result);

      // The deploy result should contain a signature which is the deploy ID
      // The Web API returns the signature string, sometimes with a prefix
      if (typeof result === 'string') {
        // Extract just the deploy ID if it has the "Success! DeployId is: " prefix
        const deployIdMatch = result.match(/DeployId is:\s*([a-fA-F0-9]+)/);
        if (deployIdMatch) {
          return deployIdMatch[1];
        }
        // If no prefix, assume the whole string is the deploy ID
        return result;
      }

      return result.signature || result.deployId || result;
    } catch (error: any) {
      console.error('Deploy failed:', error);
      throw new Error(`Deploy failed: ${error.message}`);
    }
  }

  // Explore deploy (read-only, like F1R3FLY wallet)
  async exploreDeployData(rholangCode: string): Promise<any> {
    try {
      console.log('Sending explore-deploy to:', this.readOnlyUrl);

      // F1R3wallet sends the Rholang code directly as a string, not as a deploy object
      const result = await this.rnodeHttp('explore-deploy', rholangCode);

      console.log('Explore-deploy result:', result);
      return result.expr;
    } catch (error: any) {
      console.error('Explore deploy failed:', error);
      if (error.message.includes('Network Error')) {
        console.error('Make sure your local RChain node is running and accessible at:', this.readOnlyUrl);
      }
      throw new Error(`Explore failed: ${error.message}`);
    }
  }

  // Get latest block number
  async getLatestBlockNumber(): Promise<number> {
    try {
      const blocks = await this.rnodeHttp('blocks/1');
      return blocks && blocks.length > 0 ? blocks[0].blockNumber : 0;
    } catch (error) {
      console.error('Error getting latest block:', error);
      return 0;
    }
  }

  async waitForDeployResult(deployId: string, maxAttempts: number = 20): Promise<any> {
    console.log(`[GraphQL] Waiting for deploy result: ${deployId}`);
    console.log(`[GraphQL] Using endpoint: ${this.graphqlUrl}`);

    // Check for mixed-content issue: if page is HTTPS and GraphQL is HTTP, skip GraphQL and use fallback
    const isMixedContent = typeof window !== 'undefined' && 
                          window.location.protocol === 'https:' && 
                          this.graphqlUrl.startsWith('http://');
    
    if (isMixedContent) {
      console.warn(`[GraphQL] Mixed-content detected: page is HTTPS but GraphQL is HTTP. Skipping GraphQL query and using fallback method.`);
      // Skip GraphQL queries and go directly to fallback
      return this.waitForDeployResultFallback(deployId);
    }

    // Auto-convert HTTP to HTTPS if page is on HTTPS to avoid mixed-content errors
    let graphqlEndpoint = this.graphqlUrl;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && graphqlEndpoint.startsWith('http://')) {
      graphqlEndpoint = graphqlEndpoint.replace('http://', 'https://');
      console.log(`[GraphQL] Converted HTTP to HTTPS to avoid mixed-content: ${graphqlEndpoint}`);
    }

    if (maxAttempts > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const graphqlQuery = {
          query: `query GetDeployStatus($deployId: String!) {
  deployments(where: {deploy_id: {_eq: $deployId}}) {
    deploy_id
    deployer
    deployment_type
    timestamp
    errored
    error_message
    block_number
    block_hash
    seq_num
    shard_id
    sig
    sig_algorithm
    created_at
    transfers {
      id
      from_address
      to_address
      amount_asi
      status
      created_at
    }
    block {
      block_number
      block_hash
      timestamp
      proposer
    }
  }
}`,
          variables: {
            deployId: deployId
          }
        };

        console.log(`[GraphQL] Querying indexer for deploy ${deployId} (attempt ${i + 1}/${maxAttempts})`);
        console.log(`[GraphQL] Endpoint:`, graphqlEndpoint);
        console.log(`[GraphQL] Request payload:`, JSON.stringify(graphqlQuery, null, 2));

        let response;
        try {
          response = await axios.post(graphqlEndpoint, graphqlQuery, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000,
            validateStatus: (status) => status < 500 
          });
        } catch (error: any) {
          console.error(`[GraphQL] Request failed for deploy ${deployId}:`, {
            message: error.message,
            code: error.code,
            response: error.response?.status,
            responseData: error.response?.data,
            config: {
              url: error.config?.url,
              method: error.config?.method
            }
          });

          // Check for mixed-content or SSL/TLS errors
          if (error.message.includes('mixed-content') || 
              error.message.includes('blocked') ||
              error.message.includes('SSL') ||
              error.message.includes('TLS') ||
              error.message.includes('certificate') ||
              (error.code === 'ERR_NETWORK' && typeof window !== 'undefined' && window.location.protocol === 'https:' && graphqlEndpoint.startsWith('https://'))) {
            console.warn(`[GraphQL] Mixed-content or HTTPS error detected.`);
            console.warn(`[GraphQL] Page protocol: ${typeof window !== 'undefined' ? window.location.protocol : 'unknown'}`);
            console.warn(`[GraphQL] GraphQL endpoint: ${graphqlEndpoint}`);
            console.warn(`[GraphQL] Original endpoint: ${this.graphqlUrl}`);
            
            // If we tried HTTPS and it failed, the server might not support HTTPS
            if (graphqlEndpoint.startsWith('https://') && this.graphqlUrl.startsWith('http://')) {
              console.error(`[GraphQL] HTTPS conversion failed. Server at ${this.graphqlUrl} may not support HTTPS.`);
              console.error(`[GraphQL] Solution: Configure HTTPS on GraphQL server or use a proxy.`);
            }
            
            return {
              status: 'pending',
              message: 'Deploy status check unavailable due to mixed-content security policy. GraphQL endpoint must use HTTPS when page is on HTTPS.',
              deployId: deployId
            };
          }

          if (error.code === 'ERR_NETWORK' || 
              error.message.includes('CORS') || 
              error.message.includes('ERR_FAILED')) {
            console.warn(`[GraphQL] CORS or network error for deploy ${deployId}. Returning pending status.`);
            return {
              status: 'pending',
              message: 'Deploy status check unavailable due to CORS/network issues',
              deployId: deployId
            };
          }

          throw error;
        }

        console.log(`[GraphQL] Response:`, response.data);

        // Check for GraphQL errors in response
        if (response.data?.errors) {
          console.error('[GraphQL] GraphQL errors:', response.data.errors);
          const errorMessages = response.data.errors.map((err: any) => err.message || JSON.stringify(err)).join('; ');
          throw new Error(`GraphQL query error: ${errorMessages}`);
        }

        if (response.data?.data?.deployments && response.data.data.deployments.length > 0) {
          const deploy = response.data.data.deployments[0];
          console.log(`[GraphQL] ✅ Deploy ${deployId} found in block ${deploy.block_number} after ${i + 1} attempts`);
          console.log(`[GraphQL] Deploy details:`, deploy);

          if (deploy.errored) {
            return {
              status: 'errored',
              error: deploy.error_message || 'Deploy execution failed',
              blockHash: deploy.block?.block_hash,
              blockNumber: deploy.block_number,
              deployId: deployId
            };
          }

          return {
            status: 'completed',
            message: 'Deploy successfully included in block',
            blockHash: deploy.block?.block_hash,
            blockNumber: deploy.block_number,
            deployId: deployId,
            timestamp: deploy.timestamp,
            transfers: deploy.transfers
          };
        }

        console.log(`[GraphQL] Deploy ${deployId} not found in indexer... (${i + 1}/${maxAttempts})`);

      } catch (error: any) {
        console.error(`[GraphQL] Error checking indexer for deploy ${deployId}:`, error.message);
        console.error(`[GraphQL] Full error:`, error);

        // Use fallback method
        return this.waitForDeployResultFallback(deployId);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.warn(`[GraphQL] Deploy ${deployId} not found after ${maxAttempts} attempts (${maxAttempts * 5} seconds). The deploy may still be processing.`);
    
    // Try fallback method before giving up
    return this.waitForDeployResultFallback(deployId);
  }

  // Fallback method using read-only node API (doesn't require GraphQL)
  private async waitForDeployResultFallback(deployId: string): Promise<any> {
    console.log(`[GraphQL] Using fallback method for deploy ${deployId}`);
    
    try {
      const blocksResult = await this.readOnlyClient.get('/api/blocks/10');

      if (blocksResult.data && Array.isArray(blocksResult.data)) {
        for (const block of blocksResult.data) {
          if (block.deploys && Array.isArray(block.deploys)) {
            const foundDeploy = block.deploys.find((deploy: any) =>
              deploy.sig === deployId || deploy.signature === deployId || deploy.deployId === deployId
            );

            if (foundDeploy) {
              console.log(`[GraphQL] Deploy ${deployId} found via fallback method in block ${block.blockHash}`);
              return {
                status: 'completed',
                message: 'Deploy successfully included in block',
                blockHash: block.blockHash,
                deployId: deployId,
                cost: foundDeploy.cost,
                timestamp: block.timestamp
              };
            }
          }
        }
      }
    } catch (fallbackError) {
      console.error('[GraphQL] Fallback method also failed:', fallbackError);
    }
    
    return {
      status: 'pending',
      message: 'Deploy status check unavailable. The deploy may still be processing.',
      deployId: deployId
    };
  }

  async fetchTransactionHistory(address: string, publicKey: string, limit: number = 50): Promise<any[]> {
    const graphqlEndpoint = this.graphqlUrl;

    if (!address || !address.trim()) {
      console.error('[GraphQL] Invalid address provided:', address);
      throw new Error('Address is required for transaction history');
    }

    if (!publicKey || !publicKey.trim()) {
      console.error('[GraphQL] Invalid publicKey provided:', publicKey);
      throw new Error('Public key is required for transaction history');
    }

    if (!graphqlEndpoint) {
      console.error('[GraphQL] No GraphQL endpoint configured. Current value:', graphqlEndpoint);
      throw new Error('GraphQL endpoint is not configured');
    }

    try {
      const graphqlQuery = {
        query: `
          query GetTransactionHistory($address: String!, $publicKey: String!, $limit: Int!) {
            transfers(
              where: {
                _or: [
                  {from_public_key: {_eq: $publicKey}},
                  {to_address: {_eq: $address}}
                ]
              },
              order_by: {block_number: desc},
              limit: $limit
            ) {
              deploy_id
              block_number
              from_address
              to_address
              amount_asi
              timestamp
              from_public_key
            }
            deployments(
              where: {
                deployer: {_eq: $publicKey}
              },
              order_by: {block_number: desc},
              limit: $limit
            ) {
              deploy_id
              block_number
              deployer
              timestamp
              block {
                block_hash
              }
            }
          }
        `,
        variables: {
          address: address.trim(),
          publicKey: publicKey.trim(),
          limit: limit
        }
      };

      const isTestQuery = address === 'test' && publicKey === 'test';

      if (!isTestQuery && (!address || !publicKey)) {
        return [];
      }

      if (isTestQuery) {
        return [];
      }

      let response;
      try {
        response = await axios.post(graphqlEndpoint, graphqlQuery, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data?.errors) {
          console.error('[GraphQL] GraphQL errors:', response.data.errors);
        }
      } catch (error: any) {
        console.error('[GraphQL] Request failed:', {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          responseData: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method
          }
        });

        if (error.code === 'ERR_NETWORK' || error.message.includes('CORS') || error.message.includes('ERR_FAILED')) {
          console.warn('[GraphQL] CORS or network error detected. Transaction history will be empty until API is configured properly.');
          return [];
        }

        throw error;
      }

      const transfers = response.data?.data?.transfers || [];
      const deployments = response.data?.data?.deployments || [];

      const deployTimestampMap = new Map();
      deployments.forEach((deploy: any) => {
        deployTimestampMap.set(deploy.deploy_id, deploy.timestamp);
      });

      const transferTxs = transfers.map((tx: any) => {
        const normalizedAddress = address?.toLowerCase().trim();
        const normalizedToAddress = tx.to_address?.toLowerCase().trim();
        const normalizedFromAddress = tx.from_address?.toLowerCase().trim();

        const isReceive = normalizedToAddress && normalizedToAddress === normalizedAddress;
        const isSend = normalizedFromAddress && normalizedFromAddress === normalizedAddress;


        let type: 'send' | 'receive' = 'send';
        if (isReceive && !isSend) {
          type = 'receive';
        } else if (isSend && !isReceive) {
          type = 'send';
        } else if (isReceive && isSend) {
          type = 'send';
        } else {
          type = 'receive';
        }

        let timestamp: string;
        if (tx.timestamp) {
          const date = new Date(parseInt(tx.timestamp));
          timestamp = date.toISOString();
        } else {
          timestamp = new Date(0).toISOString();
        }

        return {
          deployId: tx.deploy_id,
          blockNumber: tx.block_number,
          from: tx.from_address,
          to: tx.to_address,
          amount: tx.amount_asi,
          status: 'confirmed',
          timestamp: timestamp,
          blockHash: undefined,
          type: type
        };
      });

      const deployTxs = deployments.map((tx: any) => {
        let timestamp: string;
        if (tx.timestamp) {
          const date = new Date(parseInt(tx.timestamp));
          timestamp = date.toISOString();
        } else {
          timestamp = new Date(0).toISOString();
        }

        return {
          deployId: tx.deploy_id,
          blockNumber: tx.block_number,
          from: tx.deployer,
          to: undefined,
          amount: undefined,
          status: 'confirmed',
          timestamp: timestamp,
          blockHash: tx.block?.block_hash,
          type: 'deploy' as const
        };
      });

      const allTxs = [...transferTxs, ...deployTxs];

      const txMap = new Map();

      allTxs.forEach(tx => {
        const existingTx = txMap.get(tx.deployId);

        if (!existingTx) {
          txMap.set(tx.deployId, tx);
        } else {
          if (tx.type === 'deploy' && existingTx.type !== 'deploy') {
            txMap.set(tx.deployId, {
              ...existingTx,
              blockHash: tx.blockHash
            });
          } else if (existingTx.type === 'deploy' && tx.type !== 'deploy') {
            txMap.set(tx.deployId, {
              ...tx,
              blockHash: existingTx.blockHash
            });
          } else if (tx.type === 'deploy' && existingTx.type === 'deploy') {
            txMap.set(tx.deployId, tx);
          } else {
            txMap.set(tx.deployId, tx);
          }
        }
      });

      const sortedTxs = Array.from(txMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return sortedTxs;
    } catch (error) {
      console.error('Error fetching transaction history from indexer:', error);
      return [];
    }
  }

  // Check if node is accessible (checks validator node by default)
  async isNodeAccessible(nodeType: 'validator' | 'readOnly' | 'admin' = 'validator'): Promise<boolean> {
    try {
      let client: AxiosInstance;

      switch (nodeType) {
        case 'readOnly':
          client = this.readOnlyClient;
          break;
        case 'admin':
          if (!this.adminClient) return false;
          client = this.adminClient;
          break;
        default:
          client = this.validatorClient;
      }

      const response = await client.get('/api/status');
      return !!response.data;
    } catch {
      return false;
    }
  }

  // Propose block (for local networks with validator nodes)
  async propose(): Promise<any> {
    if (!this.adminClient) {
      throw new Error('Admin URL not configured. Propose is only available for local networks.');
    }

    try {
      return await this.rnodeHttp('propose', {});
    } catch (error: any) {
      throw new Error(`Propose failed: ${error.message}`);
    }
  }
}