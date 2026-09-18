# Development Guide

← [Back to README](README.md)

This guide covers setup, the local SDK dependency, the available scripts, Docker, CI/CD and troubleshooting.

For configuration details, see the [Configuration Guide](CONFIGURATION.md).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Working With The Local SDK](#working-with-the-local-sdk)
4. [Available Scripts](#available-scripts)
5. [Build Configuration](#build-configuration)
6. [Docker](#docker)
7. [Testing](#testing)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Building For Production](#building-for-production)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: 18.x (the Docker image builds on `node:18-alpine`, and the toolchain is pinned around `@types/node` 18)
- **npm**: 8.x or higher
- **Git**
- **[asi-chain-wallet-sdk](https://github.com/asi-alliance/asi-chain-wallet-sdk)**: checked out next to this repository and built, see below
- **Docker** (optional): only needed to run the published image

## Installation

### 1. Clone Both Repositories Side By Side

`package.json` declares `"@asichain/asi-wallet-sdk": "file:../asi-chain-wallet-sdk"`, so the SDK must sit next to the wallet:

```
<parent>/
├── asi-chain-wallet/
└── asi-chain-wallet-sdk/
```

```bash
git clone https://github.com/asi-alliance/asi-chain-wallet.git
git clone https://github.com/asi-alliance/asi-chain-wallet-sdk.git
```

### 2. Build The SDK First

`npm install` in the wallet links the SDK directory as it is; it does not build it. Without `dist/` the wallet cannot resolve the package.

```bash
cd asi-chain-wallet-sdk
npm install
npm run build      # tsc -p tsconfig.build.json && rollup -c
```

### 3. Install The Wallet

```bash
cd ../asi-chain-wallet
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required: the dependency tree does not resolve with strict peer dependencies.

### 4. Configure The Environment

```bash
cp .env.example .env
```

This step is **not optional**. With an empty `.env` the application does not start:

- a missing or invalid `NETWORKS` renders a configuration error instead of the UI;
- a missing bridge variable throws while the bridge module is loaded, before React mounts.

See [CONFIGURATION.md](CONFIGURATION.md) for every variable and for what each one does.

### 5. Start The Development Server

```bash
npm start
```

The wallet is served at `http://localhost:3000` with hot reload. Use `PORT=3001 npm start` to change the port. The startup log includes `[config-overrides]` lines reporting the parsed `NETWORKS`, and `[NETWORKS env]` warnings for any entry that was skipped or degraded.

## Working With The Local SDK

- The wallet consumes the **built output** of the SDK. After changing SDK sources, rebuild it (`npm run build`) or keep `npm run dev` running there for a rollup watch build, then restart or let the dev server pick up the new files.
- The SDK statically imports `node-persist` for its Node storage backend. In the browser it uses IndexedDB, so [config-overrides.js](config-overrides.js) aliases `node-persist` to `false`. Keep that alias when touching the webpack configuration.
- The SDK is the source of truth for wallet behaviour: session policy, auto-lock, key storage, reservations and history. Before adding an application-side workaround, check whether the SDK already exposes the capability.
- Changing the SDK version or moving it to a registry package means updating `package.json`, this guide and the Docker notes below.

## Available Scripts

Working scripts:

| Script | Command | Notes |
| --- | --- | --- |
| `npm start` | `react-app-rewired start` | Dev server with hot reload |
| `npm run build` | `react-app-rewired build` | Production build into `build/` |
| `npm run lint` | `eslint src --ext .ts,.tsx` | Currently reports warnings only |
| `npm run type-check` | `tsc --noEmit` | See the note below |
| `npm run serve` | `npx serve -s build` | Serves an existing build |
| `npm run analyze` | `source-map-explorer 'build/static/js/*.js'` | Requires a build with source maps |
| `npm run deploy:gh` | `gh-pages -d build` | Publishes `build/` to GitHub Pages |

Scripts that do not work in the current tree:

| Script | Why |
| --- | --- |
| `npm test` | `react-scripts test` runs, but there are no unit tests: `*.test.*` is listed in `.gitignore`, so none are committed. Only `src/setupTests.ts` and the mocks under `src/__mocks__` and `src/services/__mocks__` remain |
| `npm run deploy:ipfs` | Points at `scripts/deploy-ipfs.js`; there is no `scripts/` directory |
| `npm run wdio`, `npm run TA`, `npm run TA-lambda` | Point at `wdio.conf.js`, `index.js` and `wdio.lambdatest.conf.js` in the repository root; none of them exist |
| `npm run test:lt:web`, `test:lt:web:homePage`, `test:lt:android`, `test:lt:ios` | The referenced configs are either missing (`wdio.android.conf.js`, `wdio.ios.conf.js`) or live in `tests-automation/` and must be run from there. The `homePageTests` suite is not defined in any config |
| `npm run eject` | Not usable: the build runs through `react-app-rewired` |

### About `npm run type-check`

`tsc --noEmit` currently exits with errors, all of them inside `node_modules/viem/node_modules/ox/**`. That package ships TypeScript sources that use BigInt literals and iteration, while `tsconfig.json` targets ES5, and `skipLibCheck` does not cover `.ts` sources pulled in through package exports. **No errors come from `src/`.**

When reading the output, filter for application code:

```bash
npx tsc --noEmit | grep "^src/"
```

The dev server and the production build are unaffected, because Create React App restricts type reporting to `src/**` and [config-overrides.js](config-overrides.js) relaxes the checker further for production builds.

## Build Configuration

[config-overrides.js](config-overrides.js) (react-app-rewired) is where the non-default build behaviour lives:

- parses `.env.local` or `.env` and inlines `NETWORKS`, `NODE_ENV`, `REACT_APP_EXPLORER_URL` and `REACT_APP_FAUCET_URL` through `DefinePlugin`
- excludes `__mocks__`, `__tests__`, `*.test.*`, `*.spec.*` and `setupTests.ts` from the compiled bundle
- provides browser polyfills for `crypto`, `stream`, `assert`, `buffer` and `process`, and disables Node-only modules
- aliases `node-persist` to `false` for the SDK
- enables `asyncWebAssembly` and `topLevelAwait` for the Cardano libraries, which ship WebAssembly
- splits Monaco, ethers, WalletConnect, Ledger, Trezor, React, Redux and crypto libraries into separate chunks in production
- in production, relaxes the TypeScript checker so that type errors do not fail the build

## Docker

### Running The Published Image

```bash
docker-compose up -d           # pulls public.ecr.aws/f6y9h6x4/asi-chain/wallet:latest
docker-compose logs -f asi-chain-wallet
docker-compose down
```

The service is named `asi-chain-wallet` and is published on `http://localhost:3000`.

### Building An Image From This Repository

Not supported as it stands. `Dockerfile` copies `package*.json` into `/app` and runs `npm install`, which tries to resolve `file:../asi-chain-wallet-sdk` outside the build context and fails. Building locally requires either vendoring the built SDK into the build context and pointing `package.json` at it, or publishing the SDK to a registry.

`start-wallet.sh` predates this: it builds and looks for an `asi-wallet-v2` image and container, while `docker-compose.yml` now runs the published image under a different name, and its messages still mention decommissioned endpoints.

### docker-entrypoint.sh

The entrypoint writes a `window._env_` block and runs `envsubst` over the nginx template. Neither reaches the application any more; see [CONFIGURATION.md](CONFIGURATION.md#docker-entrypointsh).

## Testing

### Unit Tests

There are none in the repository. `.gitignore` excludes `*.test.*`, so any test written locally stays untracked. The Jest setup that Create React App would use is still present (`src/setupTests.ts`, `src/__mocks__/crypto-js.ts`, `src/services/__mocks__/secureStorage.ts`).

### E2E Tests

WebdriverIO against LambdaTest, under `tests-automation/`:

- `wdio.web.conf.js` - Chrome, Firefox and Edge on Windows 11
- `wdio.mobile.conf.js` - mobile capabilities
- `pages/` - page objects: `AccountsPage`, `BasePage`, `DashboardPage`, `DeployPage`, `HistoryPage`, `NavbarPage`, `NetworkPage`, `ReceivePage`, `TransactionsPage`

Both configs resolve specs from `./TestSuites/**/*.test.js`, and that directory is not in the repository, so a run currently finds no specs. Credentials are loaded from the **repository root** `.env`:

```ini
LT_USER_NAME=your_username
LT_ACCESS_KEY=your_access_key
URL_TO_TEST=http://localhost:3000
```

Run them from the `tests-automation/` directory:

```bash
cd tests-automation
npx wdio run wdio.web.conf.js
npx wdio run wdio.mobile.conf.js
```

The page objects address elements through the `id` attributes set in the application (`#create-account-button`, `#send-transaction-button`, `#deploy-contract-button`, `#sidebar-menu-button` and so on). Keep those ids when reworking a screen, and expect some of them to have drifted already: `#history-refresh-button`, for example, no longer exists in the application.

## CI/CD Pipeline

Workflows live in `.github/workflows/`.

### Development Deployment

**File**: `deploy-wallet-frontend-dev.yml`, **trigger**: push to `dev`.

Checks out the repository, assumes an AWS role through OIDC in `us-east-1` and starts the CodeBuild project `asi-chain-wallet-frontend`.

### Production Deployment

**File**: `deploy-wallet-frontend-prod.yml`, **trigger**: manual (`workflow_dispatch`).

Same steps against the CodeBuild project `asi-chain-wallet-prod-frontend`. The push trigger is commented out, so production deployments are always started by hand.

### Code Quality

**File**: `sonar.yml`, **trigger**: push to `main` or `dev` and pull requests. Runs the SonarQube scan with `SONAR_TOKEN` and `SONAR_HOST_URL`; settings are in `sonar-project.properties`.

### AWS CodeBuild

The actual build and the S3 and CloudFront deployment happen in CodeBuild. `buildspec.example.yml` is an example only and is behind the current tree: it pins Node 16, runs `npm install` without `--legacy-peer-deps`, writes a `.env` that contains `NETWORKS` alone (no bridge variables, no `nodeApiProfile`) and assumes the SDK resolves from the registry. Use it as a shape, not as a working spec.

## Building For Production

```bash
npm run build     # output in build/
npm run serve     # check the build locally
```

The build is code split, minified and tree shaken, generates the PWA service worker, and emits `build/` ready for any static host. Remember that the environment is baked in: a build carries the `.env` it was built with.

## Troubleshooting

### `Cannot find module '@asichain/asi-wallet-sdk'` or stale SDK behaviour

The SDK is not checked out next to the wallet, or `dist/` is missing or outdated. Run `npm run build` in `asi-chain-wallet-sdk`, then restart the dev server. After a rebuild of the SDK, a running dev server sometimes keeps the old bundle cached; restarting it is the reliable fix.

### Peer dependency conflicts during install

```bash
npm install --legacy-peer-deps
```

If the tree is already broken, remove `node_modules` and `package-lock.json` and install again with the same flag.

### `Module not found: Can't resolve '@harmoniclabs/crypto'`

Raised by `@harmoniclabs/uplc`, a transitive dependency of the Cardano libraries, during `npm run build`. The package does not get that dependency installed in a `--legacy-peer-deps` tree, and the copy that npm does install ends up nested under `@harmoniclabs/plutus-data`, where `uplc` cannot resolve it. Adding `@harmoniclabs/crypto` explicitly, or aliasing it in `config-overrides.js`, resolves it; both change the dependency set, so agree on the approach before applying it.

### Blank page and `Env variable with key REACT_APP_... not found` in the console

A bridge variable is missing from `.env`. The bridge constants are evaluated at module load, so the throw happens before React mounts and no error screen is rendered. Fill the variable in and restart.

### The app shows a configuration message instead of the UI

`NETWORKS` is missing, is not valid JSON, or contains no entry with a valid `ValidatorURL`, `ReadOnlyURL` and `IndexerURL`. The message states which. Startup warnings prefixed with `[NETWORKS env]` list the entries that were skipped or degraded.

### Type errors from `node_modules` in `npm run type-check`

Expected; see [About `npm run type-check`](#about-npm-run-type-check).

### The password is requested for almost every operation

Expected. The SDK signing session is configured with a 15-second auto-lock, and it is not extended by activity. To change it locally, adjust `security.autoLockMs` in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx); treat it as a security decision, not a convenience setting.

### Logged out after a page reload

Expected. The authenticated state is held in Redux memory and the SDK reopens with every wallet closed, so the wallet must be opened with its password again.

### Balance or history does not update

Both are refreshed every 30 seconds through RTK Query and invalidated after a deploy. Check that the selected network has an `IndexerURL` (history is unavailable without it), that the observer endpoint answers `/api/status` (the header shows the connection state), and look for SDK errors in the console.

### Docker container will not start

```bash
docker-compose logs asi-chain-wallet
```

Common causes: port 3000 already in use, or an attempt to build the image from this repository (see [Docker](#docker)).

### PWA not installing

Serve over HTTPS, verify that the service worker is registered in DevTools (it is registered only in production builds), check that `manifest.json` is reachable and clear the cache.

---

For configuration details, see the [Configuration Guide](CONFIGURATION.md).

For general information, see the [README](README.md).
