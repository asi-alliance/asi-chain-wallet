# Development Guide

← [Back to README](README.md)

This guide covers setup, development workflow, testing, and deployment for ASI Chain Wallet.

For configuration details, see [Configuration Guide](CONFIGURATION.md)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Workflow](#development-workflow)
4. [Docker Development](#docker-development)
5. [Testing](#testing)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Building for Production](#building-for-production)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Docker** (optional): For containerized development
- **Git**: For version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/asi-alliance/asi-chain-wallet.git
cd asi-chain-wallet
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts in some packages.

### 3. Configure Environment (Optional)

```bash
cp .env.example .env
```

The wallet works with default configuration. Edit `.env` only if you need to customize network endpoints.

## Development Workflow

### Available Scripts

From `package.json`:

#### Start Development Server

```bash
npm start
```

Starts the development server at `http://localhost:3000` with hot reload.

#### Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` directory.

#### Run Tests

```bash
npm test
```

Launches the test runner in interactive watch mode using Jest and React Testing Library.

#### Type Checking

```bash
npm run type-check
```

Runs TypeScript compiler in no-emit mode to check for type errors.

#### Linting

```bash
npm run lint
```

Runs ESLint on TypeScript/TSX files in `src/` directory.

#### Serve Production Build

```bash
npm run serve
```

Serves the production build locally at `http://localhost:3000` using `serve` package.

#### Bundle Analysis

```bash
npm run analyze
```

Analyzes bundle size using `source-map-explorer`.

## Docker Development

### Using Docker Compose

The easiest way to run the wallet in a containerized environment:

```bash
# Start the wallet
docker-compose up -d

# View logs
docker-compose logs -f asi-wallet

# Stop the wallet
docker-compose down
```

Access the wallet at `http://localhost:3000`

### Building Docker Image

```bash
# Build the image
docker build -t asi-wallet:latest .

# Run the container
docker run -p 3000:80 asi-wallet:latest
```

### Docker Build Process

The `Dockerfile` uses a multi-stage build:

1. **Builder Stage** (node:18-alpine)
   - Installs system dependencies (python3, make, g++, cairo, USB support)
   - Installs npm dependencies
   - Copies source code
   - Builds the React application

2. **Production Stage** (nginx:alpine)
   - Copies built files from builder
   - Configures nginx
   - Sets up environment variable injection via `docker-entrypoint.sh`

### Environment Variable Injection

The `docker-entrypoint.sh` script injects environment variables into the built application at runtime:

```bash
#!/bin/sh
set -e

# Replace environment variables in static files
envsubst < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp
mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html

# Start nginx
exec "$@"
```

This allows changing configuration without rebuilding the image.

## Testing

The project includes automated tests using WebdriverIO and React Testing Library.

### WebdriverIO Tests

Located in `tests-automation/` directory.

#### Test Configuration Files

- `wdio.web.conf.js` - Web browser tests
- `wdio.mobile.conf.js` - Mobile tests
- `wdio.local.conf.js` - Local testing configuration

#### Run WebdriverIO Tests

```bash
# Run all tests
npm run wdio

# Run web tests on LambdaTest
npm run test:lt:web

# Run specific test suite (example: home page)
npm run test:lt:web:homePage

# Run Android tests
npm run test:lt:android

# Run iOS tests
npm run test:lt:ios
```

#### Test Page Objects

Test page objects are located in `tests-automation/pages/`:
- `DashboardPage.js` - Dashboard page interactions
- `NetworkPage.js` - Network configuration
- `ReceivePage.js` - Receive functionality
- `TransactionsPage.js` - Transaction management
- `HistoryPage.js` - Transaction history
- `AccountsPage.js` - Account management
- `DeployPage.js` - Contract deployment
- `NavbarPage.js` - Navigation
- `BasePage.js` - Base page class

### Unit Tests

```bash
npm test
```

Runs Jest tests with React Testing Library.

**Test Configuration**:
- `setupTests.ts` - Test setup and global mocks
- `jest.config.js` - Jest configuration (via Create React App)

**Mock Services**:
- `src/services/__mocks__/secureStorage.ts`
- `src/__mocks__/crypto-js.ts`

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

### Workflows

Located in `.github/workflows/`:

#### 1. Development Deployment

**File**: `deploy-wallet-frontend-dev.yml`

**Trigger**: Push to `dev` branch

**Process**:
1. Checkout repository
2. Configure AWS credentials via OIDC
3. Trigger AWS CodeBuild project: `asi-chain-wallet-frontend`

```yaml
on:
  push:
    branches:
      - dev

permissions:
  id-token: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::533793137436:role/asi-chain-wallet-codebuild-service-role
          aws-region: us-east-1
      - uses: aws-actions/aws-codebuild-run-build@v1
        with:
          project-name: asi-chain-wallet-frontend
```

#### 2. Production Deployment

**File**: `deploy-wallet-frontend-prod.yml`

**Trigger**: Manual (`workflow_dispatch`)

**Process**:
1. Checkout repository
2. Configure AWS credentials via OIDC
3. Trigger AWS CodeBuild project: `asi-chain-wallet-prod-frontend`

Production deployments require manual approval and are not triggered automatically.

#### 3. Code Quality Analysis

**File**: `sonar.yml`

**Trigger**: 
- Push to `main` or `dev` branches
- Pull requests

**Process**:
1. Checkout repository with full history
2. Run SonarQube analysis

```yaml
on:
  push:
    branches:
      - main
      - dev
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: SonarSource/sonarqube-scan-action@v6.0.0
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

**Configuration**: `sonar-project.properties`

### AWS CodeBuild

The actual build and deployment is handled by AWS CodeBuild. The project includes an example buildspec:

**File**: `buildspec.example.yml` - Example build specification for AWS CodeBuild

## Building for Production

### Local Production Build

```bash
# Create production build
npm run build

# The build output will be in the build/ directory
# Serve it locally to test
npm run serve
```

### Docker Production Build

```bash
# Build and tag
docker build -t asi-wallet:production .

# Push to registry (if needed)
docker tag asi-wallet:production your-registry/asi-wallet:production
docker push your-registry/asi-wallet:production
```

### Build Optimization

The production build is optimized automatically:
- Code splitting
- Minification
- Tree shaking
- Asset optimization
- Service worker generation (PWA)

**Build Configuration**: `config-overrides.js` (for react-app-rewired)

## Troubleshooting

### Common Issues

#### 1. Peer Dependency Conflicts

**Issue**: npm install fails with peer dependency errors

**Solution**: Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

#### 2. Build Fails with TypeScript Errors

**Issue**: Type errors during build

**Solution**: Run type check separately to see detailed errors
```bash
npm run type-check
```

#### 3. Docker Container Won't Start

**Issue**: Container exits immediately

**Solution**: Check logs for errors
```bash
docker-compose logs asi-wallet
```

Common causes:
- Port 3000 already in use
- Insufficient resources
- Invalid Docker configuration

#### 4. Transaction Not Updating

**Issue**: Transaction status not updating in UI

**Solution**: 
- Verify network connectivity to F1R3FLY nodes
- Check polling intervals in environment variables
- Ensure node endpoints are accessible
- Review browser console for errors

#### 5. PWA Not Installing

**Issue**: "Install App" option not appearing

**Solution**:
- Serve over HTTPS (required for PWA)
- Check service worker registration in DevTools
- Verify `manifest.json` is accessible
- Clear browser cache and reload

### Getting Help

- Check existing issues on GitHub
- Verify network connectivity to F1R3FLY nodes
- Check browser console for detailed error messages
- Review CI/CD logs for deployment issues

---

For configuration details, see [Configuration Guide](CONFIGURATION.md)

For general information, see [README](README.md)
