<div align="center">

# ASI Chain Wallet

[![Status](https://img.shields.io/badge/Status-BETA-FFA500?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet)
[![Version](https://img.shields.io/badge/Version-0.1.0-A8E6A3?style=for-the-badge)](https://github.com/asi-alliance/asi-chain-wallet/releases)
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
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Documentation](#documentation)
6. [Contributing](#contributing)
7. [License](#license)

---

## Overview

ASI Chain Wallet is a comprehensive web-based cryptocurrency wallet built with React and TypeScript. It provides a secure and user-friendly interface for managing digital assets on ASI Chain.

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
```

> **Important**: Use `npm install --legacy-peer-deps` to handle peer dependency conflicts

The wallet will be available at [http://localhost:3000](http://localhost:3000).

> **Note**: You may see ESLint warnings about unused variables and React Hook dependencies during startup. These are code quality warnings and don't affect the wallet's functionality.

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run serve

# Deploy to GitHub Pages
npm run deploy:gh

# Deploy to IPFS (requires IPFS node)
npm run deploy:ipfs
```

The production build will be in the `build/` directory, ready for deployment to any static hosting service.

## Known Issues & Notes

### Development Environment
1. **npm vulnerabilities**: You may see security warnings during `npm install`. These are common in JavaScript projects and generally safe for development. Run `npm audit` for details.
2. **ESLint warnings**: The development server shows warnings about React Hooks and unused variables. These don't prevent the wallet from functioning.
3. **Deprecation warnings**: Some packages show deprecation notices. This is normal in the JavaScript ecosystem.

### Production Considerations
- Address critical security vulnerabilities before deploying to production
- Test thoroughly with your specific RChain network configuration (see CONFIGURATION.md and NETWORKS env)

### Recent Updates (September 2025)
- **Deployed**: Production wallet on AWS Lightsail Singapore (http://13.251.66.61:3000)
- **Fixed**: Balance caching performance issue - eliminated excessive API calls
- **Added**: Global balance caching system with 15-second TTL
- **Improved**: RChain service efficiency with cross-instance caching
- **Enhanced**: Console logging for cache hit/miss monitoring
- **Updated**: Network configuration to use Singapore server endpoints (13.251.66.61)
- **Created**: Comprehensive AWS Lightsail deployment documentation
- **Improved**: Start script with health checking and current network info
- **Cleaned**: Workspace organization - moved non-essential files to archive

### Previous Updates (August 2025)
- **Fixed**: Webpack module resolution for `process/browser` polyfill
- **Fixed**: TypeScript theme typing with styled-components
- **Fixed**: QRCode import to use named export from react-qr-code
- **Added**: Missing SecureStorage static methods for storage operations
- **Added**: Type declarations for speakeasy and validator modules
- **Removed**: Unused backend code (rateLimiter.ts) from frontend
- **Updated**: Installation instructions to use `--legacy-peer-deps`

### Previous Updates (July 2025)
- **Fixed**: Network settings persistence issue (#12) - Custom networks now save correctly
- **Added**: Comprehensive test suite with 62.88% store coverage
- **Improved**: Build configuration to exclude test files from production
- **Documentation**: Added DEVELOPMENT_WORK_REPORT.md and FINAL_TEST_REPORT.md

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │   React UI      │  │ Redux Store  │  │ Local Storage │   │
│  │  Components     │  │    State     │  │  (Encrypted)  │   │
│  └────────┬────────┘  └──────┬───────┘  └───────┬───────┘   │
│           │                  │                  │           │
│  ┌────────▼───────────────────▼──────────────────▼───────┐  │
│  │              Service Layer (TypeScript)               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ • RChain Service  • Crypto Service  • SecureStorage   │  │
│  │ • IDE (Rholang)  • Transaction Polling  • Key Mgmt    │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                 │
└───────────────────────────┼────────────────────────────────-┘
                            │
                   Network Layer (HTTPS)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Validator│      │ Read-Only  │     │   Admin    │
   │   Node   │      │    Node    │     │   Node     │
   └──────────┘      └────────────┘     └────────────┘
                        RChain Network
```

## Security Features

### Encryption
- **Password-based encryption** (CryptoJS AES) for private keys stored in localStorage
- **User isolation**: Accounts tied to `userId` (derived from wallet name + password); different users on the same device cannot unlock each other's wallets
- **Memory cleanup**: Keys cleared from memory after use and on logout
- A phased plan for stronger encryption (Web Crypto API, PBKDF2, IndexedDB) is documented in the repo

### Access Control
- **Password Protection**: Required for all sensitive operations
- **Session Timeout**: Automatic lock after 15 minutes
- **No Recovery**: Lost passwords cannot be recovered
- **Local Only**: No cloud backup or recovery

### Network Security
- **HTTPS Only**: All connections encrypted
- **Direct Connection**: No proxy servers
- **Certificate Validation**: Verify node authenticity
- **CORS Protection**: Prevent cross-origin attacks

## Development

### Development Prerequisites
- Node.js 14+ (recommended: 18+)
- npm 6+ or yarn
- Git for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Tech Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **Styled Components**: Styling
- **Monaco Editor**: Rholang IDE
- **Axios**: RChain node and GraphQL requests

### Project Structure
```
asi-chain-wallet/
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components (Dashboard, Send, IDE, etc.)
│   ├── services/     # RChain, SecureStorage, transactionPolling, etc.
│   ├── store/        # Redux slices (auth, wallet, theme, …)
│   ├── utils/        # Crypto, encryption, validation
│   └── __mocks__/    # Test mocks
├── public/           # Static assets
├── tests-automation/ # WebdriverIO E2E tests
├── CONFIGURATION.md  # Env and networks
├── DEVELOPMENT.md    # Setup, CI/CD, troubleshooting
└── buildspec.example.yml  # AWS CodeBuild example
```

### Commands

```bash
# Development
npm start              # Start dev server (default port 3000)
PORT=3001 npm start   # Start on custom port
npm test              # Run tests in watch mode
npm test -- --coverage # Run tests with coverage report
npm run lint          # Lint code
npm run type-check    # TypeScript checking

# Building
npm run build         # Production build
npm run analyze       # Bundle analysis

# Docker Operations
./start-wallet.sh     # Start wallet with Docker (recommended)
docker-compose up -d  # Start Docker container manually
docker-compose down   # Stop Docker container
docker-compose build --no-cache  # Rebuild Docker image

# Testing
npm test -- --watchAll=false         # Run all tests once
npm test -- --coverage --watchAll=false  # Generate coverage report
npm test Dashboard    # Run specific test file

# Deployment
npm run deploy:gh     # Deploy to GitHub Pages
npm run deploy:ipfs   # Deploy to IPFS (requires IPFS node and scripts/deploy-ipfs.js)
```

## 📈 Recent Improvements

### Testing Framework (July 2025)
- **Comprehensive Test Suite**: Added Jest and React Testing Library
- **62.88% Store Coverage**: Exceeded 50% target for Redux store modules
- **Component Testing**: Full test coverage for Dashboard, Send, and Settings
- **Mock Infrastructure**: Created reusable mock modules for complex services

### Network Persistence Fix (Issue #12)
- **Persistent Settings**: Network configurations now survive page reloads
- **LocalStorage Integration**: Automatic synchronization with Redux store
- **Custom Networks**: Fixed "Add Custom Network" functionality
- **Seamless Experience**: Network changes are instantly saved

### Security & User Experience Enhancements
- **Authentication Security**: Fixed authentication bypass vulnerability
- **Transaction Confirmations**: Added confirmation dialogs for all operations
- **Account Switching**: Quick account switcher with dynamic balance updates
- **Seamless Deployment**: Removed redundant password prompts for authenticated users

### Enhanced Deployment Tracking
- Real-time block inclusion verification
- Accurate gas cost reporting
- Detailed deployment status messages
- Graceful error handling

### IDE Improvements
- Consistent example contracts
- Better error messages
- Deployment confirmation modals
- Enhanced console output

### Network Optimization
- Intelligent request routing
- Separate read/write operations
- Network-specific configurations
- Connection retry logic
- Global balance caching (15s TTL)
- Reduced API call frequency

## E2E Testing Guide

### Overview

E2E tests use **WebdriverIO (WDIO)** with **LambdaTest** cloud execution.

### Environment Setup

Create `.env` in `tests-automation/`:

```ini
URL_TO_TEST=http://localhost:3000
PROJECT_NAME=ASI Wallet Tests
LT_USER_NAME=your_username
LT_ACCESS_KEY=your_access_key
LT_API_URL=https://api.lambdatest.com/automation/api/v1
PRIVATE_KEY=your_test_private_key_here
```

### Running Tests

From the `tests-automation/` directory:

```bash
cd tests-automation
# Web/Desktop tests
npx wdio run wdio.web.conf.js
# Mobile tests
npx wdio run wdio.mobile.conf.js
```

### Test Structure

```
tests-automation/
├── pages/           # Page objects (AccountsPage, DashboardPage, etc.)
├── wdio.web.conf.js
├── wdio.mobile.conf.js
└── .env             # URL_TO_TEST, LambdaTest credentials, etc. (see .env.example)
```

### LambdaTest Dashboard

View test results: [https://automation.lambdatest.com](https://automation.lambdatest.com)

## Documentation

- **[CONFIGURATION.md](CONFIGURATION.md)** — Environment variables, NETWORKS, GraphQL and read-only URLs
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Setup, scripts, Docker, CI/CD, troubleshooting
- **[docs.asichain.io](https://docs.asichain.io)** — User-facing docs and wallet usage

## Contributing

Known issues and bugs are tracked in the [Issues](https://github.com/asi-alliance/asi-chain-wallet/issues) section.  
If you encounter a problem that is not listed, please feel free to open a new issue and provide as much detail as possible.

We welcome contributions. Open an issue or PR; for workflow see [DEVELOPMENT.md](DEVELOPMENT.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

## Quick Troubleshooting

### Installation Issues
- **Memory error during build**: `export NODE_OPTIONS=--max_old_space_size=4096`
- **Port already in use**: Kill the process using port 3000 or use `PORT=3001 npm start`
- **Dependencies won't install**: Delete `node_modules` and `package-lock.json`, then retry with `npm install --legacy-peer-deps`
- **Module resolution errors**: Ensure `config-overrides.js` has proper webpack polyfills
- **TypeScript errors**: Check `src/types/modules.d.ts` for missing type declarations

### Docker Issues  
- **Docker not running**: Ensure Docker Desktop is started before running `./start-wallet.sh`
- **Container won't start**: Try `docker-compose down` then `./start-wallet.sh` for a clean restart
- **Build fails**: Use `docker-compose build --no-cache` to force rebuild
- **Health check failing**: Wait 30-60 seconds after container start for full initialization

### Runtime Issues
- **Blank screen**: Check browser console for errors, ensure JavaScript is enabled
- **Network errors**: Verify RChain node is running and CORS is configured; check NETWORKS / GraphQL and read-only URLs in CONFIGURATION.md

For more details, see [CONFIGURATION.md](CONFIGURATION.md) and [DEVELOPMENT.md](DEVELOPMENT.md).

## Acknowledgments

- **RChain Community**: For the blockchain infrastructure
- **F1R3FLY Wallet**: For inspiration and reference implementation
- **Open Source Community**: All the libraries and tools that make this possible

## Support

- **Documentation**: [CONFIGURATION.md](CONFIGURATION.md), [DEVELOPMENT.md](DEVELOPMENT.md), and [docs.asichain.io](https://docs.asichain.io)
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join the RChain/ASI community channels

---

**Remember**: This is a decentralized wallet with no backend. You control your keys and data. With great power comes great responsibility! 🔐