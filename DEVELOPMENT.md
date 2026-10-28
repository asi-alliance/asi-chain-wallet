# Development Guide

← [Back to README](README.md)

This guide covers setup, the SDK dependency, the available scripts, Docker, CI/CD and troubleshooting.

For configuration details, see the [Configuration Guide](CONFIGURATION.md).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Working With The SDK](#working-with-the-sdk)
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
- **Docker** (optional): only needed to run the published image

## Installation

### 1. Clone The Repository

```bash
git clone https://github.com/asi-alliance/asi-chain-wallet.git
cd asi-chain-wallet
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required: the dependency tree does not resolve with strict peer dependencies. The SDK is installed from the npm registry together with the other dependencies, see [Working With The SDK](#working-with-the-sdk).

### 3. Configure The Environment

```bash
cp .env.example .env
```

This step is **not optional**. With an empty `.env` the application does not start:

- a missing or invalid `NETWORKS` renders a configuration error instead of the UI;
- a missing bridge variable throws while the bridge module is loaded, before React mounts.

See [CONFIGURATION.md](CONFIGURATION.md) for every variable and for what each one does.

### 4. Start The Development Server

```bash
npm start
```

The wallet is served at `http://localhost:3000` with hot reload. Use `PORT=3001 npm start` to change the port. The startup log includes `[config-overrides]` lines reporting the parsed `NETWORKS`, and `[NETWORKS env]` warnings for any entry that was skipped or degraded. An invalid `NETWORKS`, including duplicate networks, stops the dev server before it starts.

## Working With The SDK

- `package.json` declares `"@asichain/asi-wallet-sdk": "^2.1.0"`, installed from the npm registry; `package-lock.json` pins the exact version that is installed.
- To try unreleased SDK changes, build the SDK in a local checkout of [asi-chain-wallet-sdk](https://github.com/asi-alliance/asi-chain-wallet-sdk) (`npm run build`) and point the wallet at it temporarily, for example with `npm link`. Restart the dev server after every SDK rebuild, and do not commit a `package.json` or `package-lock.json` that references a local path.
- The SDK statically imports `node-persist` for its Node storage backend. In the browser it uses IndexedDB, so [config-overrides.js](config-overrides.js) aliases `node-persist` to `false`. Keep that alias when touching the webpack configuration.
- The SDK is the source of truth for wallet behaviour: session policy, auto-lock, key storage, reservations and history. Before adding an application-side workaround, check whether the SDK already exposes the capability.
- The wallet relies on SDK defaults where it does not configure them, notably the signing session auto-lock (see [The password is requested again after a while](#the-password-is-requested-again-after-a-while)). When upgrading the SDK, update `package.json` and `package-lock.json` and check those defaults against the session notes in the README and in this guide.

## Available Scripts

Working scripts:

| Script | Command | Notes |
| --- | --- | --- |
| `npm start` | `react-app-rewired start` | Dev server with hot reload |
| `npm run build` | `react-app-rewired build` | Production build into `build/` |
| `npm run lint` | `eslint src --ext .ts,.tsx` | Currently reports warnings only |
| `npm run type-check` | `tsc --noEmit` | Passes without errors (`target` is `es2020`) |
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

`tsc --noEmit` exits cleanly. `tsconfig.json` targets `es2020`, which also covers the BigInt literals and iteration in the TypeScript sources that `viem` pulls in through `ox`; under the former ES5 target those sources produced errors in `node_modules`. `__mocks__`, `__tests__`, `*.test.ts(x)` and `src/setupTests.ts` are excluded from the check.

The production build does not depend on it: [config-overrides.js](config-overrides.js) relaxes the checker for production builds so that type errors do not fail the build. Run `npm run type-check` before pushing.

## Build Configuration

[config-overrides.js](config-overrides.js) (react-app-rewired) is where the non-default build behaviour lives:

- parses `.env.local` or `.env` and inlines `NETWORKS`, `NODE_ENV`, `REACT_APP_EXPLORER_URL` and `REACT_APP_FAUCET_URL` through `DefinePlugin`
- validates `NETWORKS` with [src/config/networksEnv.ts](src/config/networksEnv.ts), loaded through `ts-node`, and throws on any error (for example duplicate networks), which aborts `npm start` and `npm run build`
- excludes `__mocks__`, `__tests__`, `*.test.*`, `*.spec.*` and `setupTests.ts` from the compiled bundle
- provides browser polyfills for `crypto`, `stream`, `assert`, `buffer` and `process`, and disables Node-only modules
- aliases `node-persist` to `false` for the SDK
- enables `asyncWebAssembly` and `topLevelAwait` for the Cardano libraries, which ship WebAssembly
- splits Monaco, ethers, WalletConnect, Ledger, Trezor, React, Redux and crypto libraries into separate chunks in production
- in production, relaxes the TypeScript checker so that type errors do not fail the build

### Build-Time Modules In `src/config`

[src/config/](src/config) holds TypeScript modules that `config-overrides.js` loads through `ts-node` before webpack starts, and that the application imports as well (as `config/<module>`). They run in plain Node, without webpack or the `baseUrl: src` alias resolution, so every module in this folder:

- imports other application code through relative paths only (`../utils/guards`, `../sdk/SdkWalletService`), never through aliases such as `utils/guards`
- imports types with `import type`, so that `ts-node` in `transpileOnly` mode drops those imports
- does not touch `window`, `localStorage` or other browser APIs, and has no side effects on import, such as logging
- imports only modules that also load in plain Node, including everything they import at runtime. `@asichain/asi-wallet-sdk` is fine, because Node loads its CommonJS build. [src/sdk/SdkWalletService.ts](src/sdk/SdkWalletService.ts) is fine too: its only alias import, `types/wallet`, brings in types alone and is dropped during transpilation. Check this before adding a new import

## Docker

### Running The Published Image

```bash
docker-compose up -d           # pulls public.ecr.aws/f6y9h6x4/asi-chain/wallet:latest
docker-compose logs -f asi-chain-wallet
docker-compose down
```

The service is named `asi-chain-wallet` and is published on `http://localhost:3000`.

### Building An Image From This Repository

```bash
docker build -t asi-chain-wallet .
docker run -d -p 3000:80 asi-chain-wallet    # wallet at http://localhost:3000
```

The build stage runs `npm install --legacy-peer-deps` and `npm run build`, then nginx serves `build/` on port 80. The bundle is built with the `.env` from the build context, or with `.env.example` when there is none, so fill in `.env` before building.

`start-wallet.sh` is outdated: it builds and looks for an `asi-wallet-v2` image and container, while `docker-compose.yml` now runs the published image under a different name, and its messages still mention decommissioned endpoints.

### docker-entrypoint.sh

The entrypoint writes a `window._env_` block and runs `envsubst` over the nginx template. Neither reaches the application any more; see [CONFIGURATION.md](CONFIGURATION.md#docker-entrypointsh).

## Testing

### Unit Tests

There are none in the repository. `.gitignore` excludes `*.test.*` and `*-test.*`, so any test written locally stays untracked until that rule is changed or a different naming convention is agreed (see [E2E Tests](#e2e-tests)). The integration tests that were briefly kept under `__tests__` directories during the UI redesign have been removed, together with the `@testing-library/dom` dependency. The Jest setup that Create React App would use is still present (`src/setupTests.ts`, `src/__mocks__/crypto-js.ts`, `src/services/__mocks__/secureStorage.ts`).

### E2E Tests

WebdriverIO against LambdaTest, under `tests-automation/`:

- `wdio.web.conf.js` - Chrome, Firefox and Edge on Windows 11, Safari, Chrome and Firefox on macOS Sonoma
- `wdio.mobile.conf.js` - mobile capabilities
- `pages/` - page objects: `AccountsPage`, `BasePage`, `DashboardPage`, `DeployPage`, `HistoryPage`, `NavbarPage`, `NetworkPage`, `ReceivePage`, `TransactionsPage`

Both configs resolve specs from `./TestSuites/**/*.test.js`, and that directory is not in the repository, so a run currently finds no specs.

Adding specs under that pattern is not enough, because the root `.gitignore` excludes `*.test.*` and `*-test.*`: the files would work locally and stay untracked. Pick one of these before writing them:

- add an exception to `.gitignore`, for example `!tests-automation/**/*.test.js` after the existing rules;
- or rename the spec pattern, for example `tests-automation/TestSuites/**/*.e2e.js`, and update `specs` in `wdio.web.conf.js` and `wdio.mobile.conf.js` accordingly.

The same `.gitignore` rules are why no unit tests are tracked either, so whichever convention is chosen should cover both.

Credentials are loaded from the **repository root** `.env`. `tests-automation/.env.example` lists the same variables plus a few more (`PROJECT_NAME`, `LT_API_URL`, `PRIVATE_KEY`), but neither config reads a `.env` inside `tests-automation/`:

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

The actual build and the S3 and CloudFront deployment happen in CodeBuild. `buildspec.example.yml` is an example only and is behind the current tree: it pins Node 16, runs `npm install` without `--legacy-peer-deps`, and writes a `.env` that contains `NETWORKS` alone (no bridge variables, no `nodeApiProfile`). Use it as a shape, not as a working spec.

## Building For Production

```bash
npm run build     # output in build/
npm run serve     # check the build locally
```

The build is code split, minified and tree shaken, generates the PWA service worker, and emits `build/` ready for any static host. Remember that the environment is baked in: a build carries the `.env` it was built with.

## Troubleshooting

### `Cannot find module '@asichain/asi-wallet-sdk'` or stale SDK behaviour

The dependencies are not installed or the install failed. Run `npm install --legacy-peer-deps` again and restart the dev server. When the wallet is temporarily linked to a local SDK checkout (see [Working With The SDK](#working-with-the-sdk)), check that its `dist/` is built and up to date; a running dev server sometimes keeps the old SDK bundle cached, and restarting it is the reliable fix.

### Peer dependency conflicts during install

```bash
npm install --legacy-peer-deps
```

If the tree is already broken, remove `node_modules` and `package-lock.json` and install again with the same flag.

### `Module not found: Can't resolve '@harmoniclabs/crypto'`

Raised by `@harmoniclabs/uplc`, a transitive dependency of the Cardano libraries, during `npm run build`. The package does not get that dependency installed in a `--legacy-peer-deps` tree, and the copy that npm does install ends up nested under `@harmoniclabs/plutus-data`, where `uplc` cannot resolve it. Adding `@harmoniclabs/crypto` explicitly, or aliasing it in `config-overrides.js`, resolves it; both change the dependency set, so agree on the approach before applying it.

### Blank page and `Env variable with key REACT_APP_... not found` in the console

A bridge variable is missing from `.env`. The bridge constants are evaluated at module load, so the throw happens before React mounts and no error screen is rendered. Fill the variable in and restart.

### `npm start` or `npm run build` fails with `Invalid NETWORKS env config`

`config-overrides.js` validates `NETWORKS` before webpack starts and throws on any error: the variable is missing or not valid JSON, no entry has a valid `ValidatorURL`, `ReadOnlyURL` and `IndexerURL`, or two entries share the same endpoints and `nodeApiProfile` or the same name (ignoring case). The error lines prefixed with `[config-overrides]` name the problem and the conflicting network ids. See [CONFIGURATION.md](CONFIGURATION.md#validation-rules).

### The app shows a configuration message instead of the UI

The bundle was built without the build-time check, and `NETWORKS` fails the same validation at startup. The message states the reason. Startup warnings prefixed with `[NETWORKS env]` list the entries that were skipped or degraded.

### The password is requested again after a while

Expected. The SDK signing session auto-locks 15 minutes after the wallet is unlocked, and it is not extended by activity. The wallet does not pass `security.autoLockMs` to `Client.create` in [src/sdk/SdkClientProvider.tsx](src/sdk/SdkClientProvider.tsx), so the SDK default `DEFAULT_AUTO_LOCK_MS` (900000 ms) applies. To change it, pass `security.autoLockMs` there; treat it as a security decision, not a convenience setting.

### Logged out after a page reload

Expected. The authenticated state is held in Redux memory and the SDK reopens with every wallet closed, so the wallet must be opened with its password again.

### Balance or history does not update

Both are refreshed every 30 seconds through RTK Query and invalidated after a deploy. Check that the selected network has an `IndexerURL` (history is unavailable without it), that the observer endpoint answers `/api/status` (the header shows the connection state), and look for SDK errors in the console.

### Docker container will not start

```bash
docker-compose logs asi-chain-wallet
```

A common cause is port 3000 already being in use.

### PWA not installing

Serve over HTTPS, verify that the service worker is registered in DevTools (it is registered only in production builds), check that `manifest.json` is reachable and clear the cache.

---

For configuration details, see the [Configuration Guide](CONFIGURATION.md).

For general information, see the [README](README.md).
