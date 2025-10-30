# Configuration Guide

← [Back to README](README.md)

This guide details all environment variables and configuration options for ASI Chain Wallet.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [WalletConnect Configuration](#walletconnect-configuration)
3. [Network Configuration](#network-configuration)
4. [Performance Settings](#performance-settings)
5. [Docker Configuration](#docker-configuration)

## Environment Variables

All environment variables should be prefixed with `REACT_APP_` for Create React App to include them in the build.

### Required Variables

#### WalletConnect Project ID

```env
REACT_APP_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

**Required for WalletConnect functionality.**

Get your FREE Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

**Default in docker-compose.yml**: `8b5b43fbbd61a2852c226ff2eee68ab9`

## WalletConnect Configuration

The wallet uses WalletConnect v2 protocol for DApp connectivity. Configuration is handled through the `REACT_APP_WALLETCONNECT_PROJECT_ID` environment variable.

**Relay URL**: `wss://relay.walletconnect.com` (hardcoded in service)

**Supported Methods**:
- `rchain_sendTransaction`
- `rchain_signMessage`
- `rchain_getBalance`

**Supported Events**:
- `accountsChanged`
- `chainChanged`

For production deployments, register your own Project ID at [WalletConnect Cloud](https://cloud.walletconnect.com) to ensure proper functionality and avoid rate limits.

## Network Configuration

The wallet supports multiple network endpoints configured through environment variables.

### F1R3FLY Network Endpoints

All network endpoints are currently commented out in `.env.example`. The active configuration is set in `docker-compose.yml`.

#### Mainnet (Production - AWS Lightsail Singapore)

From `docker-compose.yml`:
```env
REACT_APP_RCHAIN_HTTP_URL=http://44.198.8.24:40413
REACT_APP_RCHAIN_GRPC_URL=http://44.198.8.24:40412
REACT_APP_RCHAIN_READONLY_URL=http://44.198.8.24:40453
```

**Port Configuration**:
- HTTP Port: `40413` (validator HTTP endpoint)
- gRPC Port: `40412` (validator gRPC endpoint)
- Read-only Port: `40453` (read-only queries)

#### GraphQL and Indexer

```env
REACT_APP_GRAPHQL_URL=http://44.198.8.24:8080/v1/graphql
REACT_APP_INDEXER_API_URL=http://44.198.8.24:9090
```

**Port Configuration**:
- GraphQL: `8080` (with `/v1/graphql` path)
- Indexer API: `9090`

#### Network Identity

```env
REACT_APP_NETWORK_NAME=F1R3FLY Network
REACT_APP_NETWORK_ID=f1r3fly-mainnet
```

### Local Development

For local development with a running F1R3FLY node:

```env
REACT_APP_FIREFLY_LOCAL_URL=http://localhost:40413
REACT_APP_FIREFLY_LOCAL_READONLY_URL=http://localhost:40453
REACT_APP_FIREFLY_LOCAL_ADMIN_URL=http://localhost:40405
REACT_APP_FIREFLY_LOCAL_GRAPHQL_URL=http://localhost:8080/v1/graphql
```

### Testnet

Testnet endpoints are commented out in `.env.example`. To use testnet, uncomment and configure:

```env
REACT_APP_FIREFLY_TESTNET_URL=http://13.251.66.61:40413
REACT_APP_FIREFLY_TESTNET_READONLY_URL=http://13.251.66.61:40453
```

### Legacy RChain Endpoints

For backward compatibility, legacy endpoint variables are available:

```env
REACT_APP_RCHAIN_HTTP_URL=http://localhost:40413
REACT_APP_RCHAIN_GRPC_URL=http://localhost:40412
REACT_APP_RCHAIN_READONLY_URL=http://localhost:40453
```

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
      - REACT_APP_WALLETCONNECT_PROJECT_ID=${WALLETCONNECT_PROJECT_ID:-8b5b43fbbd61a2852c226ff2eee68ab9}
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
export WALLETCONNECT_PROJECT_ID=your-project-id
export RCHAIN_HTTP_URL=http://your-node:40413
docker-compose up -d

# Or using .env file
echo "WALLETCONNECT_PROJECT_ID=your-project-id" > .env
docker-compose up -d
```

### Dockerfile Environment Variables

The Dockerfile sets default environment variables that can be overridden at runtime:

```dockerfile
ENV REACT_APP_WALLETCONNECT_PROJECT_ID=8b5b43fbbd61a2852c226ff2eee68ab9
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
