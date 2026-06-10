# Configuration Guide

← [Back to README](README.md)

This guide details all environment variables and configuration options for ASI Chain Wallet.

## Table of Contents

1. [Network Management](#network-management)
2. [Transaction Storage](#transaction-storage)
3. [Performance Settings](#performance-settings)
4. [Docker Configuration](#docker-configuration)

## Network Management

The wallet uses a dual approach for managing network configurations:

### Environment-based Networks

- Networks are defined in `process.env.NETWORKS`
- Create React App receives values through `config-overrides.js` (DefinePlugin + reading `.env`)
- These predefined networks are **read-only** and cannot be modified by users

### Custom Networks

- Custom networks are stored in **localStorage** per account
- Storage key format: `asi_wallet_networks_<accountId>`
- Users can add, edit, and delete custom networks through Settings → Custom Network Configuration
- Custom networks are removed when localStorage is cleared

**Note**: Predefined networks from environment variables take precedence and are always available.

## Transaction Storage

The wallet implements a hybrid approach for transaction tracking:

### Pending Transactions

- Transactions are written to **localStorage** immediately after sending
- This provides instant feedback in the History page
- Pending transactions display before the indexer confirms them

### Confirmed Transactions

- Once the indexer returns the same `deployId`, the transaction status updates from pending to confirmed
- Historical transactions are fetched from the indexer
- The wallet merges pending transactions with confirmed ones for a complete history

**Storage Key**: Transaction data is stored per account in localStorage

## Performance Settings

Configure polling intervals for balance and transaction updates:

```env
REACT_APP_BALANCE_POLLING_INTERVAL=30000
REACT_APP_DEPLOY_STATUS_POLLING_INTERVAL=5000
```

**Default Values**:
- **Balance Polling**: `30000` ms (30 seconds) - How often to check account balances
- **Deploy Status Polling**: `5000` ms (5 seconds) - How often to check transaction/deployment status

These values are set in `docker-compose.yml` and can be adjusted based on network conditions and performance requirements.

## Docker Configuration

### Using docker-compose.yml

The `docker-compose.yml` file provides a complete configuration:

```yaml
services:
  asi-wallet:
    container_name: asi-wallet-v2
    ports:
      - "3000:80"
    environment:
      - REACT_APP_RCHAIN_HTTP_URL=${RCHAIN_HTTP_URL:-http://44.198.8.24:40413}
      - REACT_APP_RCHAIN_GRPC_URL=${RCHAIN_GRPC_URL:-http://44.198.8.24:40412}
      - REACT_APP_RCHAIN_READONLY_URL=${RCHAIN_READONLY_URL:-http://44.198.8.24:40453}
      - REACT_APP_GRAPHQL_URL=${GRAPHQL_URL:-http://44.198.8.24:8080/v1/graphql}
      - REACT_APP_INDEXER_API_URL=${INDEXER_API_URL:-http://44.198.8.24:9090}
      - REACT_APP_NETWORK_NAME=F1R3FLY Network
      - REACT_APP_NETWORK_ID=f1r3fly-mainnet
      - REACT_APP_BALANCE_POLLING_INTERVAL=30000
      - REACT_APP_DEPLOY_STATUS_POLLING_INTERVAL=5000
```

### Environment Variable Override

You can override any environment variable using a `.env` file in the project root or by setting environment variables before running docker-compose:

```bash
# Using environment variables
export RCHAIN_HTTP_URL=http://your-node:40413
docker-compose up -d

# Or using .env file
echo "RCHAIN_HTTP_URL=http://your-node:40413" > .env
docker-compose up -d
```

### Dockerfile Environment Variables

The Dockerfile sets default environment variables that can be overridden at runtime:

```dockerfile
ENV REACT_APP_RCHAIN_HTTP_URL=http://44.198.8.24:40413
ENV REACT_APP_RCHAIN_GRPC_URL=http://44.198.8.24:40412
ENV REACT_APP_RCHAIN_READONLY_URL=http://44.198.8.24:40453
```

These are injected into the built application through `docker-entrypoint.sh` which uses `envsubst` to replace environment variables in the static files.

## Notes

- All `REACT_APP_*` variables are embedded at build time for Create React App
- For Docker deployments, environment variables can be injected at runtime using the entrypoint script
- The wallet automatically connects to the configured network on startup
- Network endpoints can be changed in Settings → Custom Network Configuration (UI feature)

For development workflow and deployment instructions, see [Development Guide](DEVELOPMENT.md)
