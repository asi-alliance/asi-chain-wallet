<div align="center">

# ASI Chain Wallet

[![Status](https://img.shields.io/badge/Status-BETA-FFA500?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet)
[![Version](https://img.shields.io/badge/Version-2.2.0--dappconnect-A8E6A3?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet/releases)
[![License](https://img.shields.io/badge/License-Apache%202.0-1A1A1A?style=for-the-badge)](LICENSE)
[![Docs](https://img.shields.io/badge/Docs-Available-C4F0C1?style=for-the-badge)](https://docs.asichain.io)

<h3>A modern wallet for ASI Chain</h3>

Part of the [**Artificial Superintelligence Alliance**](https://superintelligence.io) ecosystem

*Uniting Fetch.ai, SingularityNET, and CUDOS*

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Wallets and Accounts](#wallets-and-accounts)
4. [Wallet Session and Auto-Lock](#wallet-session-and-auto-lock)
5. [Bridge](#bridge)
6. [Built on the ASI Wallet SDK](#built-on-the-asi-wallet-sdk)
7. [Known Limitations](#known-limitations)
8. [Quick Start](#quick-start)
9. [Architecture Overview](#architecture-overview)
10. [Security Model](#security-model)
11. [Project Structure](#project-structure)
12. [Commands](#commands)
13. [E2E Testing](#e2e-testing)
14. [Documentation](#documentation)
15. [Contributing](#contributing)
16. [Quick Troubleshooting](#quick-troubleshooting)
17. [License](#license)

---

## Overview

ASI Chain Wallet is a web wallet for ASI Chain, built with React and TypeScript. It runs entirely in the browser: there is no backend of its own, and it talks directly to the configured validator, read-only and indexer endpoints.

Every wallet operation - key generation, storage, unlocking, balances, transfers, Rholang deploys and transaction history - is served by the [ASI Wallet SDK](#built-on-the-asi-wallet-sdk) (`@asichain/asi-wallet-sdk`). The application layer owns the UI, the Redux state and the cross-chain bridge flow.

Besides sending and receiving ASI, the wallet can deploy Rholang contracts (a simple editor in Lite mode and a Monaco-based IDE in Pro mode) and lock tokens for transfer to other chains through the Bridge page.

## Key Features

- **HD wallet model** - one wallet per Secret Recovery Phrase, with multiple accounts derived from it on demand
- **Keyfile export and import** - export the open wallet as an encrypted keyfile, import a keyfile as a new wallet or import selected accounts from it into an existing one
- **Private key import** - kept for backward compatibility; creates a single-account wallet that cannot derive further accounts
- **Send and Receive** - address validation, QR code for the account address, QR scanning for the recipient, confirmation modal with the gas reserve
- **Bridge** - outbound locks from ASI Chain to Sepolia, Base Sepolia, FetchHub Dorado and Cardano Preprod
- **Rholang deployment** - Lite mode for a single contract, Pro mode with a Monaco editor, file explorer, tabs, workspace import and export, and a console
- **Transaction history** - auto-refreshed every 30 seconds, with a Status filter and deploy id copying (see [Known Limitations](#known-limitations))
- **Multiple networks** - networks from the `NETWORKS` environment variable plus custom networks added at runtime, with busy networks disabled in the selector
- **Wallet session with SDK auto-lock** - the password is requested again as soon as the signing session expires
- **Dark and light theme**
- **Progressive Web App** - installable, with a service worker registered in production builds

## Wallets and Accounts

The wallet follows the HD model of the SDK.

- A **wallet** is one signer, created from a Secret Recovery Phrase and protected by a password. The recovery phrase is shown once at creation and is never stored in readable form.
- An **account** is derived from that wallet. New accounts are added on the Accounts page with **Create Account**, which asks for the wallet password (no new password is created) and derives the next account.
- Only **one wallet is open at a time**. The Login page lists every wallet stored on the device, and opening one closes any other open wallet.
- The selected account is remembered per wallet in `localStorage`; accounts can be renamed, and both accounts and wallets can be removed.
- **Keyfile export** produces an encrypted file for the open wallet. Anyone with that file and its password controls the wallet.
- **Keyfile import** either registers a new wallet or, when the keyfile belongs to a wallet that already exists on the device, imports the selected accounts into it. The second case is an import, not a login: the Login page says so explicitly and offers to select the affected wallet.
- **Private key import** remains available for wallets created before the HD model. It produces a wallet of type `PRIVATE_KEY` with exactly one account, and the Accounts page hides **Create Account** for it because nothing can be derived from a bare key.

Entry points: the first-run widget on the Accounts page and the Login page offer the same four actions under slightly different labels.

| Action | Accounts page (first run) | Login page | Result |
| --- | --- | --- | --- |
| Create a wallet | Create Wallet | Create Wallet | New HD wallet from a generated recovery phrase |
| Restore a wallet | Import Wallet | Import Wallet | HD wallet restored from a recovery phrase |
| Reuse a bare key | Import Account by private key | Import Private Key | New wallet of type `PRIVATE_KEY` holding exactly one account, not an account added to an existing HD wallet |
| Reuse a keyfile | Import Wallet from keyfile | Import from Keyfile | New wallet, or the selected accounts imported into the wallet the keyfile belongs to |

## Wallet Session and Auto-Lock

The previous fixed session timeout is gone. The session is now split in two layers.

**Open wallet.** Logging in opens the wallet in the SDK with its password. While it is open, the app can read addresses, balances and history without any further prompt. The authenticated state lives in Redux memory only, so reloading the page ends the session and returns to the Login page; **Logout** closes every open wallet explicitly.

**Signing session.** Unlocking also starts a signing session that holds the decrypted key material for **15 seconds** (`security.autoLockMs` in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx#L39)). The timer starts when the wallet is unlocked and is not extended by activity. When it elapses, the SDK wipes the secret and emits a lock event; the wallet itself stays open.

**After auto-lock.** Any operation that needs the key - a transfer, a Rholang deploy, a bridge lock - is retried with a password prompt: the shared [useWalletSessionAction](src/hooks/useWalletSessionAction.ts) hook detects the locked wallet, opens the password modal, and replays the same action with the password supplied there. Operations that always take the password explicitly (deriving an account, exporting a keyfile) ask for it regardless of the session state.

In practice this means the password is requested for nearly every signed operation, which matches the security policy of the SDK.

## Bridge

The Bridge page locks ASI tokens on ASI Chain for transfer to another chain.

- **Source** is fixed to ASI Chain and rendered as a static field. The source account is the currently selected wallet account.
- **Destinations** are Sepolia, Base Sepolia, FetchHub Dorado and Cardano Preprod, listed in `DESTINATION_CHAIN_KEYS` in [src/constants/bridgeChains.ts](src/constants/bridgeChains.ts) minus the source chain.
- **Destination account** comes from an external wallet connected on the page: RainbowKit and wagmi for the EVM chains, the ASI Alliance browser wallet or Keplr for FetchHub Dorado, and a CIP-30 browser wallet through Mesh for Cardano Preprod.
- **Locking** signs a deploy to the ASI bridge contract (`REACT_APP_ASI_BRIDGE_URI`) with the destination route id. The amount is validated against the available balance and the bridge gas reserve, the lock details are frozen when the confirmation modal opens, and the resulting deploy id is shown with a copy button.

**The inbound direction is not exposed.** Locking on an external chain and releasing on ASI Chain is not reachable from the UI: the source selector is static, so although the page still contains the EVM, Cosmos and Cardano lock paths, nothing can select those chains as the source. Restoring the inbound flow means exposing the source selector again and wiring the release side; until then the Bridge page is outbound only.

All bridge parameters (route ids, bridge addresses, token addresses, RPC and REST endpoints) come from environment variables. They are read at module load and the application does not start if one of them is missing - see [CONFIGURATION.md](CONFIGURATION.md).

## Built on the ASI Wallet SDK

Wallet operations are served by `@asichain/asi-wallet-sdk`, consumed as a local dependency (`file:../asi-chain-wallet-sdk`). The client is created once in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx) and wrapped for the app by [src/sdk/SdkWalletService.ts](src/sdk/SdkWalletService.ts).

The SDK provides mnemonic generation and validation, wallet creation, opening and closing, account derivation, renaming and removal, keyfile export, preview and import, address and amount conversion, available balance (net of reservations), transfers, deploys, explore, deploy status watching, transaction history, the network registry with custom networks and busy-network events, and the session policy with auto-lock.

### Temporarily Disabled by the Migration

| Item | Where | Condition for restoring it |
| --- | --- | --- |
| History pagination and the load more control | [src/pages/History/History.tsx](src/pages/History/History.tsx), `HISTORY_LIMIT` in [src/store/WalletsStore/api.ts](src/store/WalletsStore/api.ts) | An indexer root field that returns the combined ordered timeline under one offset and limit, and an SDK `getTransactionsHistory` built on it (see [Known Limitations](#known-limitations)) |
| Search, Type and Period filters in history | [src/pages/History/History.tsx](src/pages/History/History.tsx) | The same complete server-side timeline: over a truncated window these filters cannot return a correct answer. The Status filter stays enabled because it maps onto the SDK `sources` option |
| CSV and JSON export of history | [src/pages/History/History.tsx](src/pages/History/History.tsx) | The SDK exposes a history download flow |
| ETH address format on the Receive page | [src/pages/Receive/Receive.tsx](src/pages/Receive/Receive.tsx) | The SDK exposes the Ethereum address of an account |
| Legacy balance and transaction polling services | [src/services/balancePolling.ts](src/services/balancePolling.ts), [src/services/transactionPolling.ts](src/services/transactionPolling.ts) | Nothing: they are replaced by the SDK deploy watcher plus 30-second RTK Query polling. They are kept disabled until that replacement is validated in production, then deleted |
| App-level transaction status polling | [src/App.tsx](src/App.tsx) | The same validation. Deploy status is now tracked per deploy in [src/store/WalletsStore/thunks.ts](src/store/WalletsStore/thunks.ts): `sendTransaction` and `deployContract` subscribe through the `subscribe` callback returned by the SDK `transfer` and `deploy` calls, while `bridgeLock`, which signs and submits its deploy itself, calls `SdkWalletService.watchDeploy` directly |

### Removed and Relocated Functionality

- The standalone **IDE page is gone**. Its functionality is **Pro mode on the Deploy page**: the mode selector switches between Lite mode (a single contract editor) and Pro mode ([DeployProModeWidget](src/components/DeployProModeWidget)), which provides the Monaco editor, the file explorer, tabs, workspace import and export and the console. There is no `/ide` route.
- **Settings is now Network Settings only.** The page adds, edits and deletes custom networks. The former auto-lock timer entry is gone, replaced by the SDK auto-lock described above; theme switching lives in the header.
- **Wallet keys no longer live in the legacy vault.** Wallets, accounts and custom networks are stored by the SDK in IndexedDB. The old storage layer is still initialized at startup (`SecureStorage.init()` in [src/index.tsx](src/index.tsx)) because the login rate limiter uses its adapter, but it no longer holds wallet keys.
- **Multisig, hardware wallet, two-factor authentication, biometric authentication, backup and recovery, and token swap** modules still exist under `src/services`, `src/components` and `src/pages`, but they were written against the pre-SDK vault and are not reachable from any route or UI control.
- The `/keys` route still serves the standalone key generator; it is not linked from the navigation.

## Known Limitations

### Transaction History Is Capped And Not Paginated

Transaction history is currently limited to a single window of 50 records, is not paginated, and can be incomplete or misordered at the edge of that window. The cause is upstream, in how the SDK assembles a history page from the indexer, not in the wallet UI. Tracked in [asi-chain-wallet-sdk#178](https://github.com/asi-alliance/asi-chain-wallet-sdk/issues/178).

**Root cause.** `SdkWalletService.getTransactionsHistory` is backed by `TRANSACTION_HISTORY_QUERY` in the SDK, which queries two independent root fields in a single GraphQL request: `transfers`, filtered by `from_address` or `to_address`, and `deployments`, filtered by `deployer`. Both are ordered by `block_number: desc` and both receive the same `$offset` and `$limit`. The SDK then merges the two lists into a map keyed by `deploy_id` and re-sorts the result by `timestamp` descending. A page of the merged timeline cannot be expressed as the same offset and limit applied to two separately ordered lists.

### Bridge page action

The Bridge page is implemented from the UI/UX and frontend logic perspective. Since the complete bridge transfer scenario has not yet been delivered to QA, the bridge confirmation action has been disabled for the release. A notice has also been added to the page indicating that the full bridge flow is still under development and QA.

**What this means in the app today:**

1. **Hard cap at 50 records.** `HISTORY_LIMIT` in `src/store/WalletsStore/api.ts` is 50 and the endpoint never sends an offset, so exactly one window is fetched. Anything older than the 50th record is unreachable and nothing in the UI signals that the list is truncated.
2. **Ordering mismatch at the window boundary.** The window is cut server side by `block_number` but sorted client side by `timestamp`. Deploy timestamps are supplied by the client rather than derived from the block, so the two orderings can disagree. When they do, a record that belongs in the visible window can be missing and the displayed order can be wrong on the first screen.
3. **Missing enrichment at the window boundary.** Deduplication is keyed on `deploy_id`. When a transfer falls inside the top 50 transfers but its matching deployment falls outside the top 50 deployments, the row is rendered without its `blockHash`.
4. **Unstable order inside a block.** Records sharing a `block_number` have no tiebreak, so their relative order can change between polling cycles.
5. **Filtering over a truncated window.** The Search, Type and Period filters operate on the already capped result set, so client side filtering cannot return a complete answer. They are disabled for that reason.

**Why pagination is not implemented.** This is deliberate. The wallet never sends an offset today, so it does not currently hit the upstream paging defect. Adding pagination or a load more control would surface it immediately: records would be dropped between pages and repeated across pages, with the skew growing per page and with any imbalance between the transfers and deployments collections. Correcting the window on the client would require unbounded overfetching, so the fix belongs in the indexer, as a single root field returning the combined ordered timeline under one offset and limit, and in the SDK method built on top of it.

**Affected code:** `src/store/WalletsStore/api.ts` (the `getTransactionHistory` endpoint, `HISTORY_LIMIT`, and the mapping of the Status filter onto the SDK `sources` option), `src/pages/History/History.tsx` (the history table, the disabled Search, Type and Period filters, the disabled CSV and JSON export), `src/pages/Dashboard/Dashboard.tsx` (it polls the same capped window to keep the cache warm).

**Blocked by:** DevNet migration to the Rust indexer, a single indexer root field returning the combined ordered timeline under one offset and limit, and an updated `getTransactionsHistory` in the SDK built on that root field.

**Once unblocked:** restore pagination or a load more control in the history page, re-enable the Search, Type and Period filters, re-enable CSV and JSON export, and update this section.

### Other Limitations

- **A page reload ends the session.** The authenticated state is not persisted, so the wallet must be opened with its password again after every reload.
- **The bridge is outbound only** (see [Bridge](#bridge)).
- **Configuration is baked in at build time.** All variables are read through `process.env` at build time; the runtime injection left in `docker-entrypoint.sh` is no longer read by the application. See [CONFIGURATION.md](CONFIGURATION.md).

## Quick Start

### Local Development

The wallet depends on the ASI Wallet SDK through a local path (`file:../asi-chain-wallet-sdk`), so both repositories must be checked out side by side and the SDK must be built first.

```bash
# 1. Clone both repositories into the same parent directory
git clone https://github.com/asi-alliance/asi-chain-wallet.git
git clone https://github.com/asi-alliance/asi-chain-wallet-sdk.git

# 2. Build the SDK
cd asi-chain-wallet-sdk
npm install
npm run build

# 3. Install the wallet
cd ../asi-chain-wallet
npm install --legacy-peer-deps

# 4. Configure the environment
cp .env.example .env
# fill in NETWORKS and the bridge variables before starting

# 5. Start the development server
npm start
```

> **Important**: use `npm install --legacy-peer-deps`; the dependency tree does not resolve with strict peer dependencies.

> **Important**: the application does not start with an empty `.env`. A missing or invalid `NETWORKS` renders a configuration error instead of the app, and a missing bridge variable throws while the bridge module is loaded. See [CONFIGURATION.md](CONFIGURATION.md).

The wallet will be available at [http://localhost:3000](http://localhost:3000).

### Using Docker

`docker-compose.yml` runs the published image `public.ecr.aws/f6y9h6x4/asi-chain/wallet:latest`; it does not build the working tree.

```bash
docker-compose up -d     # wallet at http://localhost:3000
docker-compose down
```

The `NETWORKS` variable in the compose file reaches the container but not the application: configuration is inlined when the bundle is built, so a published image always serves the networks it was built with. Running your own configuration means building your own image.

Building an image from this repository is not currently supported, because `package.json` resolves the SDK from a path outside the build context. See [DEVELOPMENT.md](DEVELOPMENT.md).

### Production Build

```bash
npm run build     # production build into build/
npm run serve     # serve the build locally
npm run deploy:gh # publish build/ to GitHub Pages
```

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                               Browser                                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌───────────────────┐  ┌────────────────────┐   │
│  │   React UI     │  │  Redux Toolkit    │  │  Browser storage   │   │
│  │  pages /       │  │  slices +         │  │  IndexedDB (SDK)   │   │
│  │  components    │  │  RTK Query cache  │  │  localStorage (UI) │   │
│  └───────┬────────┘  └─────────┬─────────┘  └──────────┬─────────┘   │
│          │                     │                       │             │
│  ┌───────▼─────────────────────▼───────────────────────▼──────────┐  │
│  │                 ASI Wallet SDK client (src/sdk)                │  │
│  │  keys and signers - accounts - balances - transfers - deploys  │  │
│  │  history - networks - session policy and auto-lock             │  │
│  └───────┬────────────────────────────────────────────────────────┘  │
│          │                                                           │
│  ┌───────▼────────────────────────────────────────────────────────┐  │
│  │  App layer: bridge flow (wagmi / CosmJS / Mesh), IDE storage,  │  │
│  │  captcha, feedback form                                        │  │
│  └───────┬────────────────────────────────────────────────────────┘  │
└──────────┼───────────────────────────────────────────────────────────┘
           │
   ┌───────┴───────────┬────────────────────┬─────────────────────┐
   │                   │                    │                     │
┌──▼───────┐   ┌───────▼─────┐   ┌──────────▼────────┐   ┌────────▼─────────┐
│ Validator│   │  Read-only  │   │  Indexer GraphQL  │   │  External chains │
│   node   │   │    node     │   │                   │   │ EVM/Cosmos/ADA   │
└──────────┘   └─────────────┘   └───────────────────┘   └──────────────────┘
                        ASI Chain
```

## Security Model

### Keys

- Key material is generated, encrypted and stored by the SDK in IndexedDB. The application layer holds account metadata and addresses, never a private key.
- The wallet password decrypts the signer. It is required to open a wallet, to derive an account, to export a keyfile, and to sign once the 15-second signing session has elapsed.
- The Secret Recovery Phrase is displayed only at creation. There is no recovery: losing the phrase, or the keyfile together with its password, means losing the wallet.

### Access Control

- Login is rate limited: 5 failed attempts within 15 minutes lock that wallet for 15 minutes. The counter is shared across tabs and stored with the storage adapter, and login attempts are written to an audit log.
- Concurrent login attempts are serialized with a cross-tab lock, and the rate limit is re-checked inside it.
- Only one wallet is open at a time; opening another one closes the previous.

### Network

- The wallet connects directly to the configured validator, read-only and indexer endpoints, and to the RPC endpoints of the bridge destination chains. There is no proxy and no backend of its own.
- Endpoints come from configuration, not from user-generated content; custom networks are validated before they are added.
- The production nginx image sets a Content Security Policy, `X-Frame-Options`, `X-Content-Type-Options` and a referrer policy.

## Project Structure

```
asi-chain-wallet/
├── src/
│   ├── components/   # UI components, modals and wallet forms
│   ├── pages/        # Dashboard, Send, Receive, Bridge, Accounts,
│   │                 # History, Deploy, Settings, Login, KeyGenerator
│   ├── sdk/          # SDK client, provider and SdkWalletService wrapper
│   ├── store/        # Redux: Auth, WalletsStore (+ RTK Query api), theme, ...
│   ├── hooks/        # useWalletSessionAction, useDeployContract, bridge hooks
│   ├── services/     # IDE storage, login rate limiting, legacy modules
│   ├── constants/    # networks, bridgeChains, gas, polling, token
│   ├── contracts/    # bridge ABIs and contract addresses
│   ├── utils/        # crypto, validation, formatting, env helpers
│   └── types/        # wallet, transactions, bridge session types
├── public/           # Static assets, manifest and service worker
├── tests-automation/ # WebdriverIO configuration and page objects
├── CONFIGURATION.md  # Environment variables, NETWORKS, storage
├── DEVELOPMENT.md    # Setup, scripts, Docker, CI/CD, troubleshooting
├── config-overrides.js   # CRA overrides: env loading, polyfills, chunks
└── buildspec.example.yml # AWS CodeBuild example
```

## Commands

```bash
# Development
npm start              # dev server on port 3000 (PORT=3001 npm start to change it)
npm run lint           # ESLint over src
npm run type-check     # tsc --noEmit

# Building
npm run build          # production build into build/
npm run serve          # serve build/ locally
npm run analyze        # bundle analysis of build/static/js

# Deployment
npm run deploy:gh      # publish build/ to GitHub Pages
```

`npm run type-check` currently reports errors from `node_modules/viem/node_modules/ox` because the TypeScript target is ES5 while that package ships ES2020 sources; the application sources are clean. Read only the lines that start with `src/`. See [DEVELOPMENT.md](DEVELOPMENT.md) for this and for the scripts that are not usable today (`test`, `deploy:ipfs`, `wdio`, `TA`, `test:lt:*`).

## E2E Testing

E2E tests use **WebdriverIO** with **LambdaTest** cloud execution. The repository currently contains the configuration and the page objects, but **no spec files**: both configs point at `./TestSuites/**/*.test.js` under `tests-automation/`, and that directory is not in the repository.

It also cannot be committed as it stands: the root `.gitignore` excludes `*.test.*` and `*-test.*`, so spec files matching the configured pattern stay untracked. Bringing specs back means either adding an exception such as `!tests-automation/**/*.test.js` to `.gitignore`, or renaming the spec pattern (for example `*.e2e.js`) and updating `specs` in both configs. See [DEVELOPMENT.md](DEVELOPMENT.md#e2e-tests).

```
tests-automation/
├── pages/              # AccountsPage, DashboardPage, DeployPage, HistoryPage,
│                       # NavbarPage, NetworkPage, ReceivePage, TransactionsPage, BasePage
├── wdio.web.conf.js    # Chrome, Firefox, Edge on LambdaTest
└── wdio.mobile.conf.js # mobile capabilities on LambdaTest
```

Both configs read credentials from the **repository root** `.env`:

```ini
LT_USER_NAME=your_username
LT_ACCESS_KEY=your_access_key
URL_TO_TEST=http://localhost:3000
```

Run them from `tests-automation/` once spec files exist:

```bash
cd tests-automation
npx wdio run wdio.web.conf.js
npx wdio run wdio.mobile.conf.js
```

Test results: [https://automation.lambdatest.com](https://automation.lambdatest.com)

## Documentation

- **[CONFIGURATION.md](CONFIGURATION.md)** - environment variables, `NETWORKS` parsing and validation, storage, Docker
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - setup with the local SDK, scripts, Docker, CI/CD, troubleshooting
- **[docs.asichain.io](https://docs.asichain.io)** - user-facing documentation

## Contributing

Known issues and bugs are tracked in the [Issues](https://github.com/asi-alliance/asi-chain-wallet/issues) section.
If you encounter a problem that is not listed, please open a new issue and provide as much detail as possible.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Quick Troubleshooting

- **Blank page, console says `Env variable with key REACT_APP_... not found`**: a bridge variable is missing from `.env`; the bridge module throws while loading and the app never mounts.
- **The app renders a configuration message instead of the UI**: `NETWORKS` is missing, is not valid JSON, or contains no fully configured network. The exact reason is in the message and in the `[NETWORKS env]` console output.
- **`Module not found: Can't resolve '@harmoniclabs/crypto'` during a build**: a transitive Cardano dependency is not installed by `--legacy-peer-deps`. See [DEVELOPMENT.md](DEVELOPMENT.md).
- **Dependencies will not install**: delete `node_modules` and `package-lock.json`, then retry with `npm install --legacy-peer-deps`.
- **`@asichain/asi-wallet-sdk` cannot be resolved**: the SDK is not checked out next to this repository or has not been built (`npm run build` in the SDK).
- **Memory error during a build**: `export NODE_OPTIONS=--max_old_space_size=4096`.
- **Port already in use**: free port 3000 or run `PORT=3001 npm start`.
- **The password is requested for almost every operation**: expected. The signing session lasts 15 seconds, see [Wallet Session and Auto-Lock](#wallet-session-and-auto-lock).

For more detail, see [CONFIGURATION.md](CONFIGURATION.md) and [DEVELOPMENT.md](DEVELOPMENT.md).

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

## Support

- **Documentation**: [CONFIGURATION.md](CONFIGURATION.md), [DEVELOPMENT.md](DEVELOPMENT.md) and [docs.asichain.io](https://docs.asichain.io)
- **Issues**: report bugs on GitHub Issues
- **Community**: ASI Alliance community channels

---

**Remember**: this is a self-custodial wallet with no backend. You control your keys and your data.
