# Production Configuration Guide

## Overview
This document outlines the configuration needed for the ASI Wallet to work properly in production environments.

## Production Domains
The wallet automatically detects production environments based on the following domains:
- `wallet.asi-chain.com`
- `wallet.singularitynet.io`
- `asi-wallet.singularitynet.io`

## Required Production Infrastructure

### 1. API Gateway Endpoints
For production, you need to configure:

```typescript
// Production API Gateway URL
const PRODUCTION_API_GATEWAY_URL = 'https://production-api-gateway.execute-api.us-east-1.amazonaws.com/prod';

// Production validator and observer node hashes
const PRODUCTION_VALIDATOR_HASH = 'production-validator-hash';
const PRODUCTION_OBSERVER_HASH = 'production-observer-hash';
```

### 2. GraphQL Endpoint
```typescript
// Production GraphQL URL
const PRODUCTION_GRAPHQL_URL = 'https://production-graphql-endpoint.execute-api.us-east-1.amazonaws.com/v1/graphql';
```

### 3. CORS Configuration
**CRITICAL**: The GraphQL API must be configured with proper CORS headers for production domains:

```http
Access-Control-Allow-Origin: https://wallet.asi-chain.com
Access-Control-Allow-Origin: https://wallet.singularitynet.io
Access-Control-Allow-Origin: https://asi-wallet.singularitynet.io
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Environment-Specific Behavior

### Local Development (`localhost`)
- Uses local GraphQL: `http://localhost:8080/v1/graphql`
- Uses direct node connections: `http://54.152.57.201:40413`

### Internal Dev (`wallet.asi-chain.singularitynet.dev`)
- Uses DevNet GraphQL: `https://9hwp5vthsd.execute-api.us-east-1.amazonaws.com/v1/graphql`
- Uses Internal Dev nodes via API Gateway

### Production
- Uses production GraphQL endpoint
- Uses production validator/observer nodes via production API Gateway
- Includes fallback mechanisms for CORS errors

## Deployment Checklist

### Before Production Deployment:
1. ✅ Configure production API Gateway URLs
2. ✅ Set up production GraphQL endpoint
3. ✅ Configure CORS headers for all production domains
4. ✅ Update validator/observer node hashes
5. ✅ Test transaction history loading
6. ✅ Verify received transactions are displayed
7. ✅ Test CSV/JSON export functionality

### CORS Issues Resolution:
If you see CORS errors in production:
1. Check that GraphQL API has correct `Access-Control-Allow-Origin` headers
2. Verify the production domain is included in CORS configuration
3. Ensure API Gateway is configured for the production environment

## Fallback Mechanisms

The wallet includes several fallback mechanisms:
1. **GraphQL Fallback**: If GraphQL fails, falls back to local storage
2. **CORS Error Handling**: Gracefully handles CORS errors with informative logging
3. **Network Error Recovery**: Attempts to recover from network failures

## Testing Production Configuration

To test production configuration:
1. Deploy to production domain
2. Check browser console for CORS errors
3. Verify transaction history loads correctly
4. Test sending/receiving transactions
5. Confirm export functionality works

## Current Status
- ✅ Production domain detection implemented
- ✅ Fallback mechanisms added
- ✅ CORS error handling improved
- ⚠️ Production endpoints need to be configured with actual values
- ⚠️ CORS headers need to be set on production GraphQL API
