<div align="center">

# ASI Chain Wallet

[![Status](https://img.shields.io/badge/Status-BETA-FFA500?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet)
[![Version](https://img.shields.io/badge/Version-0.1.0-A8E6A3?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet/releases)
[![License](https://img.shields.io/badge/License-Apache%202.0-1A1A1A?style=for-the-badge)](LICENSE)
[![Docs](https://img.shields.io/badge/Docs-Available-C4F0C1?style=for-the-badge)](https://docs.asichain.io)

<h3>A modern wallet for the F1R3FLY network</h3>

Part of the [**Artificial Superintelligence Alliance**](https://superintelligence.io) ecosystem

*Uniting Fetch.ai, SingularityNET, and CUDOS*

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Documentation](#documentation)
6. [License](#license)

---

## Overview

ASI Chain Wallet is a comprehensive web-based cryptocurrency wallet built with React and TypeScript. It provides a secure and user-friendly interface for managing digital assets on the F1R3FLY blockchain network.

The wallet includes a built-in Rholang IDE powered by Monaco Editor, allowing developers to write, test, and deploy smart contracts directly from the wallet interface.

## Key Features

- **Built-in Rholang IDE** - Write and deploy smart contracts with Monaco Editor integration
- **Progressive Web App** - Installable PWA with offline capabilities and service worker support
- **Transaction History** - Track all transactions with detailed history and status updates
- **Multiple Networks** - Support for mainnet, testnet, and local development networks
- **Dark/Light Theme** - Customizable interface with theme switching
- **Auto-lock Timer** - Automatic session timeout for improved security
- **Account Management** - Create and manage multiple accounts with secure key storage
- **QR Code Support** - Generate and scan QR codes for easy address sharing

## Quick Start

### Using Docker

```bash
# Clone the repository
git clone https://github.com/asi-alliance/asi-chain-wallet.git
cd asi-chain-wallet

# Start with Docker Compose
docker-compose up -d

# Access wallet at http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Open http://localhost:3000
```

## Project Structure

```
asi-chain-wallet/
├── src/
│   ├── components/          # React components
│   │   ├── AccountSwitcher/ # Account management
│   │   ├── PasswordModal/   # Password authentication
│   │   ├── QRScanner/       # QR code scanner
│   │   ├── Layout/          # App layout
│   │   └── ...
│   ├── pages/               # Main application pages
│   │   ├── Dashboard/       # Wallet overview
│   │   ├── Send/            # Send transactions
│   │   ├── Receive/         # Receive & QR codes
│   │   ├── History/         # Transaction history
│   │   ├── Deploy/          # Contract deployment
│   │   ├── IDE/             # Rholang IDE
│   │   ├── Accounts/        # Account management
│   │   ├── Settings/        # Wallet settings
│   │   └── KeyGenerator/    # Key generation
│   ├── services/            # Core services
│   │   ├── rchain.ts            # RChain API client
│   │   ├── transactionPolling.ts # Transaction status polling
│   │   ├── secureStorage.ts     # Encrypted storage
│   │   ├── transactionHistory.ts # Transaction tracking
│   │   ├── balancePolling.ts    # Balance updates
│   │   └── ...
│   ├── store/               # Redux store
│   │   ├── walletSlice.ts
│   │   ├── authSlice.ts
│   │   └── themeSlice.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useIdleTimer.ts      # Auto-lock timer
│   │   └── useDeepLink.ts       # Deep link handler
│   └── utils/               # Utility functions
├── public/
│   ├── service-worker.js    # PWA service worker
│   └── manifest.json        # PWA manifest
├── tests-automation/        # WebdriverIO tests
│   ├── pages/               # Page objects
│   └── wdio.*.conf.js       # Test configurations
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Docker composition
├── Dockerfile               # Multi-stage build
└── package.json             # Project dependencies
```

## Documentation

For detailed information, see:
- [Configuration Guide](CONFIGURATION.md) - Environment variables and network settings
- [Development Guide](DEVELOPMENT.md) - Setup, testing, deployment, and CI/CD

---

## License

Copyright 2025 Artificial Superintelligence Alliance

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

ASI Alliance founding members: Fetch.ai, SingularityNET, and CUDOS
