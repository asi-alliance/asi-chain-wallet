# Configuration Guide

← [Back to README](README.md)

This guide lists every environment variable the application reads, explains how `NETWORKS` is parsed and validated, and describes where the wallet keeps its data.

## Table of Contents

1. [How Configuration Is Loaded](#how-configuration-is-loaded)
2. [Environment Variables](#environment-variables)
3. [Network Management](#network-management)
4. [Custom Networks](#custom-networks)
5. [Bridge Configuration](#bridge-configuration)
6. [Data Storage](#data-storage)
7. [Polling And Refresh Intervals](#polling-and-refresh-intervals)
8. [Docker Configuration](#docker-configuration)

## How Configuration Is Loaded

All configuration is **build time**. The application reads `process.env` only, and Create React App inlines those values into the bundle when it is built.

1. Create React App loads `.env.development.local`, `.env.local`, `.env.development` and `.env` in its usual order and exposes every `REACT_APP_*` variable.
2. [config-overrides.js](config-overrides.js) additionally parses `.env.local` if it exists, otherwise `.env`, with its own parser that unescapes the quoted `NETWORKS` JSON, and writes the result into `process.env`.
3. `DefinePlugin` then inlines `process.env.NETWORKS`, `process.env.NODE_ENV`, `process.env.REACT_APP_EXPLORER_URL` and `process.env.REACT_APP_FAUCET_URL` explicitly. `NETWORKS` needs this because it is not prefixed with `REACT_APP_` and CRA would otherwise drop it.

Startup logs from that step are prefixed with `[config-overrides]` and report whether `NETWORKS` was found, its length and the network ids it contains.

> **There is no runtime configuration.** `docker-entrypoint.sh` still writes a `window._env_` object into `index.html`, and `src/utils/env.ts` still reads it, but nothing in the application imports that helper any more. Changing environment variables requires a rebuild.

`.env.example` lists exactly the variables described below and is the template to copy.

## Environment Variables

### Networks

| Variable | Required | Read by | Purpose |
| --- | --- | --- | --- |
| `NETWORKS` | Yes | [src/constants/networks.ts](src/constants/networks.ts) | JSON object mapping a network id to its endpoints. See [Network Management](#network-management) |

Missing or invalid: the SDK client is not created and the application renders the validation message instead of the UI.

### Credentials

| Variable | Required | Read by | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_WALLETCONNECT_PROJECT_ID` | No | [src/wagmiConfig.ts](src/wagmiConfig.ts) | WalletConnect project id used by RainbowKit when connecting an EVM destination wallet. Falls back to the literal `asi-wallet-bridge`, which is not a valid project id, so WalletConnect transports fail without a real value |
| `REACT_APP_CAPTCHA_TOKEN` | No | [src/utils/captchaFetch.ts](src/utils/captchaFetch.ts) | AWS WAF captcha API key for the feedback form. Without it the form posts through plain `fetch` and a warning is logged |

### External Links And Services

| Variable | Required | Read by | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_EXPLORER_URL` | No | Layout navigation components | Target of the Explorer link. `DefinePlugin` falls back to the build mode name, so when the variable is unset the link points at the relative path `development` or `production` |
| `REACT_APP_FAUCET_URL` | No | Layout navigation components | Target of the Faucet link, with the same fallback |
| `REACT_APP_FEEDBACK_FORM_URL` | No | [src/components/community/FeedbackForm/meta.ts](src/components/community/FeedbackForm/meta.ts) | Endpoint the feedback form posts to. Defaults to an empty string, which makes submission fail |
| `REACT_APP_JSAPI_URL` | No | [src/utils/captchaFetch.ts](src/utils/captchaFetch.ts) | AWS WAF captcha JS API bundle. Required together with `REACT_APP_CAPTCHA_TOKEN` for the captcha to be applied |

### Bridge: ASI Source Chain

| Variable | Required | Type | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_ASI_CHAIN_ID` | Yes | number | Route id of ASI Chain in the bridge contracts |
| `REACT_APP_ASI_BRIDGE_URI` | Yes | string | `rho:id:...` URI of the bridge contract used by the lock deploy |

### Bridge: EVM Destinations

| Variable | Required | Type | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_SEPOLIA_BRIDGE_ADDRESS` | Yes | address | Bridge contract on Sepolia |
| `REACT_APP_SEPOLIA_TOKEN_ADDRESS` | Yes | address | Wrapped ASI token on Sepolia |
| `REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS` | Yes | address | Bridge contract on Base Sepolia |
| `REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS` | Yes | address | Wrapped ASI token on Base Sepolia |

Route ids for these two chains are not configurable: they come from `sepolia.id` and `baseSepolia.id` in `viem/chains`.

### Bridge: Cosmos Destination (Fetch.ai Dorado)

| Variable | Required | Type | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_FETCHHUB_DORADO_ROUTE_ID` | Yes | number | Route id used by the bridge contracts |
| `REACT_APP_FETCHHUB_DORADO_CHAIN_ID` | Yes | string | Cosmos chain id, for example `dorado-1` |
| `REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS` | Yes | string | CosmWasm bridge contract address |
| `REACT_APP_FETCHHUB_DORADO_DENOM` | Yes | string | Native denom used for balances and fees |
| `REACT_APP_FETCHHUB_DORADO_RPC_URL` | Yes | url | Tendermint RPC endpoint |
| `REACT_APP_FETCHHUB_DORADO_REST_URL` | Yes | url | REST (LCD) endpoint |

### Bridge: Cardano Destination (Preprod)

| Variable | Required | Type | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_CARDANO_PREPROD_ROUTE_ID` | Yes | number | Route id used by the bridge contracts |
| `REACT_APP_CARDANO_PREPROD_NETWORK_ID` | Yes | string | Cardano network name, for example `preprod` |
| `REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC` | Yes | number | Network magic of that network |
| `REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS` | Yes | string | Bridge script address |
| `REACT_APP_CARDANO_PREPROD_POLICY_ID` | Yes | string | Policy id of the bridged asset |
| `REACT_APP_CARDANO_PREPROD_ASSET_NAME` | Yes | string | Hex encoded asset name |
| `REACT_APP_CARDANO_PREPROD_KOIOS_URL` | No | url | Koios API used to build the lock transaction. Defaults to an empty string, which makes transaction building fail |

## Network Management

`process.env.NETWORKS` is read in exactly one place, [src/constants/networks.ts](src/constants/networks.ts). It parses and validates the variable once at startup and exports everything the app needs:

| Export | Used by |
| --- | --- |
| `NETWORKS` | Redux initial state (`state.walletsStore.networks`) and the network selection UI |
| `NETWORKS_CONFIG` | `Client.create({ networksConfig })` in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx) |
| `getInitialNetwork()` | Initially selected network for both the store and the SDK client |
| `getNetworksEnvError()` | Fatal configuration errors surfaced by `SdkClientProvider` |
| `NETWORKS_ENV_ISSUES` | Full validation report (errors and warnings) |
| `UNCONFIGURED_NETWORK` | Placeholder network used when no entry survived validation |

The JSON key of every entry is the network id, and it is the same id the SDK uses in `setNetwork(id)`.

### Entry Format

```json
{
  "DevNet": {
    "ValidatorURL": "https://validator.example/HTTP_API",
    "ReadOnlyURL": "https://observer.example/HTTP_API",
    "IndexerURL": "https://indexer.example/v1/graphql",
    "nodeApiProfile": "rust"
  }
}
```

An entry may also carry `name`; without it the id is used as the display name. `nodeApiProfile` selects the node API dialect (`scala` or `rust`, validated by the SDK) and falls back to the SDK default when absent.

### Validation Rules

Errors are fatal: the SDK client is not created and the application shows the reason instead of failing deep inside the SDK.

- `NETWORKS` is missing or empty
- `NETWORKS` is not valid JSON (the parser message is included)
- `NETWORKS` is not a non-empty JSON object mapping ids to configurations
- **No entry is fully configured**: at least one network needs a valid `http(s)` `ValidatorURL`, `ReadOnlyURL` and `IndexerURL`

Warnings keep the app running and are reported per network:

- The entry is not a non-empty object: skipped
- A field is present but not a string: ignored, with the received type in the message
- `ValidatorURL` is missing or not a valid `http(s)` URL: **the whole entry is skipped**. This is why placeholder entries such as `MainNet` and `TestNet` with empty URLs never reach the SDK or the UI
- `ReadOnlyURL` is missing or invalid: kept as empty, reported as `reads is unavailable`. There is **no** fallback to `ValidatorURL`
- `IndexerURL` is missing or invalid: kept as empty, reported as `transaction history is unavailable`
- `nodeApiProfile` is missing or unsupported: the SDK default profile is used

A URL is accepted when it parses as a URL, uses the `http` or `https` protocol and contains a host. Every issue is logged once at startup with the `[NETWORKS env]` prefix, errors through `console.error` and warnings through `console.warn`.

### Network Model In The App

In application code a network is `Network` from [src/types/wallet.ts](src/types/wallet.ts), whose fields map onto the SDK ones: `validatorUrl` to `ValidatorURL` (deploys), `observerUrl` to `ReadOnlyURL` (read-only queries), `indexerUrl` to `IndexerURL` (GraphQL history), plus `nodeApiProfile`.

The selected network id is persisted in `localStorage` under `asi_wallet_selected_network` by `WalletPreferencesStorage` ([src/services/walletPreferences.ts](src/services/walletPreferences.ts)) and restored by `getInitialNetwork()` on the next start. When no network survived validation, `UNCONFIGURED_NETWORK` is selected and the UI shows `Network is not configured`.

Networks that the SDK reports as busy are disabled in the network selector; the state comes from the `NETWORK_BUSY_CHANGED` event exposed through `useBusyNetworkIds`.

## Custom Networks

- Custom networks are added, edited and deleted on the **Network Settings** page.
- They are stored by the SDK in **IndexedDB** together with wallets and accounts, not in `localStorage`, and are shared by every wallet on the device.
- The form validates the name and the endpoint URLs before the network is created.
- Networks from `NETWORKS` are marked as default, are read-only in the UI and always available.
- Clearing browser storage removes custom networks along with the wallets.

## Bridge Configuration

The bridge reads its configuration through the `envStr` and `envNum` helpers in [src/constants/bridgeChains.ts](src/constants/bridgeChains.ts), at module load, into module-level constants. Both helpers **throw** when a variable is missing, empty, or (for `envNum`) not a finite number.

Because the Bridge page is imported statically by the router, that throw happens while the bundle is evaluated, before React mounts: the page stays blank and the console shows `Env variable with key REACT_APP_... not found`. Treat every bridge variable in the tables above as required for the application to start, not only for the Bridge page to work.

The only exception is `REACT_APP_CARDANO_PREPROD_KOIOS_URL`, which is read in [src/utils/cardanoTx.ts](src/utils/cardanoTx.ts) with an empty-string default and fails later, when a Cardano lock transaction is built.

The gas reserved for a bridge lock is not configurable: `BRIDGE_LOCK_PHLO_LIMIT` and `BRIDGE_LOCK_PHLO_PRICE` in [src/services/rchain.ts](src/services/rchain.ts) define the maximum cost that the Bridge page validates the amount against.

## Data Storage

| Data | Where | Key or scope |
| --- | --- | --- |
| Wallets, signers, accounts, custom networks | IndexedDB, managed by the SDK | SDK database, encrypted signer material |
| Selected network | `localStorage` | `asi_wallet_selected_network` |
| Selected account per wallet | `localStorage` | `asi_wallet_selected_accounts` |
| IDE files and workspace (Deploy Pro mode) | `localStorage` | `asi_wallet_ide_files`, `asi_wallet_ide_workspace` |
| Login rate limit counters | Storage adapter (IndexedDB) with a `localStorage` fallback | hashed `asi_wallet_rate_limit_*` keys |
| Theme | `localStorage`, written by the theme slice | `darkMode` |
| Transaction history and balances | Not persisted: RTK Query cache in memory, refetched from the indexer | |

Pending transactions are no longer written to `localStorage`. The SDK reports them through the `pending` history source, backed by its own transaction reservations, and the History page maps the Status filter onto that option.

The session itself is not persisted: the authenticated state lives in Redux memory, so a reload returns to the Login page. The `sessionStorage` and IndexedDB session helpers under `src/services` belong to the pre-SDK implementation and are not part of the current flow.

## Polling And Refresh Intervals

Polling intervals are constants, not environment variables. The earlier `REACT_APP_BALANCE_POLLING_INTERVAL` and `REACT_APP_DEPLOY_STATUS_POLLING_INTERVAL` variables are no longer read anywhere.

| Interval | Value | Defined in |
| --- | --- | --- |
| Balance and history refresh on Dashboard and History | 30 s | `ACCOUNT_DATA_POLLING_INTERVAL_SECONDS` in [src/constants/polling.ts](src/constants/polling.ts) |
| Network status check in the header | 60 s | [src/components/Layout/Layout.tsx](src/components/Layout/Layout.tsx) |
| Signing session auto-lock | 15 s | `security.autoLockMs` in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx) |
| Deploy status | Event driven | `watchDeploy` from the SDK, subscribed in [src/store/WalletsStore/thunks.ts](src/store/WalletsStore/thunks.ts) |

## Docker Configuration

### docker-compose.yml

`docker-compose.yml` runs the **published image** and passes a single variable:

```yaml
services:
  asi-chain-wallet:
    image: public.ecr.aws/f6y9h6x4/asi-chain/wallet:latest
    container_name: asi-chain-wallet
    ports:
      - "3000:80"
    environment:
      - NETWORKS=${NETWORKS:-<default DevNet/TestNet/MainNet JSON>}
    restart: unless-stopped
```

Because configuration is baked in at build time, setting `NETWORKS` on the container only affects an image that is built with it. To run your own configuration, build an image from a tree whose `.env` contains the values you need.

### Dockerfile

The multi-stage `Dockerfile` installs dependencies, copies `.env.example` to `.env` when no `.env` is present, builds the application and serves `build/` with nginx. It cannot build this repository as it stands: `package.json` resolves the SDK from `file:../asi-chain-wallet-sdk`, a path outside the build context. See [DEVELOPMENT.md](DEVELOPMENT.md).

### docker-entrypoint.sh

The entrypoint writes `/usr/share/nginx/html/env-config.js` with `window._env_` (`REACT_APP_WALLETCONNECT_PROJECT_ID` and three `REACT_APP_RCHAIN_*` variables), injects the script tag into `index.html` and runs `envsubst` over the nginx template. None of this reaches the application: the `REACT_APP_RCHAIN_*` variables are not read by any current code path, the nginx template contains no placeholders to substitute, and the helper that would read `window._env_` is unused.

### nginx

[nginx.conf.template](nginx.conf.template) serves the SPA, sets cache headers, exposes `/health` and sets the security headers and the Content Security Policy. Extend the `connect-src` directive there when the deployment talks to endpoints that are not covered by it.

---

For development workflow and deployment instructions, see the [Development Guide](DEVELOPMENT.md).
