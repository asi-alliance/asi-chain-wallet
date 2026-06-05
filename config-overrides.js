const webpack = require('webpack');

try {
  const fs = require('fs');
  const path = require('path');
  const envLocalPath = path.resolve(__dirname, '.env.local');
  const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      if (line.includes('<<EOF')) {
        continue;
      }
      
      let match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) {
        if (i > 0 && lines[i-1].endsWith('\\')) {
          continue;
        }
        continue;
      }
      
      const key = match[1].trim();
      let value = match[2].trim();
      
      if (value === 'EOF' || value.endsWith(' EOF')) {
        continue;
      }
      

      if (key === 'NETWORKS') {
        let networksValue = value;
        if (networksValue.startsWith('"') && networksValue.endsWith('"')) {
          networksValue = networksValue.slice(1, -1);
        }
        
        networksValue = networksValue.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
        
        try {
          const parsed = JSON.parse(networksValue);
          process.env[key] = networksValue;
          console.log('[config-overrides] ✅ Loaded NETWORKS from .env');
          console.log('[config-overrides] NETWORKS length:', networksValue.length);
          console.log('[config-overrides] Networks found:', Object.keys(parsed).join(', '));
        } catch (e) {
          console.error('[config-overrides] ❌ NETWORKS parsing failed:', e.message);
          console.error('[config-overrides] Raw value (first 200 chars):', networksValue.substring(0, 200));
          process.env[key] = networksValue;
          console.warn('[config-overrides] ⚠️ Using NETWORKS as-is despite parse error');
        }
        continue;
      }
      
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
        value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
        value = value.replace(/\\'/g, "'").replace(/\\n/g, '\n');
      }
      
      process.env[key] = value;
    }
    console.log('[config-overrides] Loaded .env file');
  } else {
    console.log('[config-overrides] .env file not found at:', envPath);
  }
} catch (error) {
  console.warn('[config-overrides] Failed to load .env file:', error.message);
}

module.exports = function override(config, env) {
  const networksValue = process.env.NETWORKS || '{}';
  console.log('[config-overrides] NETWORKS available for DefinePlugin:', !!process.env.NETWORKS);
  console.log('[config-overrides] NETWORKS length:', networksValue.length);
  if (process.env.NETWORKS) {
    try {
      const parsed = JSON.parse(process.env.NETWORKS);
      const networkNames = Object.keys(parsed);
      console.log('[config-overrides] Networks found:', networkNames.join(', '));
    } catch (e) {
      console.warn('[config-overrides] Failed to parse NETWORKS:', e.message);
    }
  }
  
  // Exclude mock files from the build
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(loader => {
        if (loader.test && loader.test.toString().includes('tsx?')) {
          loader.exclude = [
            /node_modules/,
            /__mocks__/,
            /__tests__/,
            /\.test\.(ts|tsx)$/,
            /\.spec\.(ts|tsx)$/,
            /setupTests\.ts$/
          ];
        }
      });
    }
  });

  // Existing polyfills for crypto and streams
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
    'process/browser': require.resolve('process/browser'),
    path: false,
    fs: false,
    os: false,
    util: false,
    url: false,
    zlib: false,
    http: false,
    https: false,
  };
  
  // Fix module resolution for axios in Ledger packages
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser'),
  };
  
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NETWORKS': JSON.stringify(process.env.NETWORKS || '{}'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || env),
      'process.env.REACT_APP_EXPLORER_URL': JSON.stringify(process.env.REACT_APP_EXPLORER_URL || env),
      'process.env.REACT_APP_FAUCET_URL': JSON.stringify(process.env.REACT_APP_FAUCET_URL || env),
    }),
  ];
  
  if (env === 'production') {
    config.output.publicPath = './';
    
    config.performance = {
      ...config.performance,
      maxAssetSize: 1000000,
      maxEntrypointSize: 1000000,
      hints: 'warning',
      assetFilter: function(assetFilename) {
        return !assetFilename.endsWith('.map');
      }
    };
    
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 500000,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        monaco: {
          test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
          name: 'monaco-editor',
          priority: 30,
          enforce: true
        },
        ethers: {
          test: /[\\/]node_modules[\\/]ethers[\\/]/,
          name: 'ethers',
          priority: 25,
          enforce: true
        },
        walletconnect: {
          test: /[\\/]node_modules[\\/]@walletconnect[\\/]/,
          name: 'walletconnect',
          priority: 25,
          enforce: true
        },
        ledger: {
          test: /[\\/]node_modules[\\/]@ledgerhq[\\/]/,
          name: 'ledger',
          priority: 25,
          enforce: true
        },
        trezor: {
          test: /[\\/]node_modules[\\/]@trezor[\\/]/,
          name: 'trezor',
          priority: 25,
          enforce: true
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux)[\\/]/,
          name: 'react',
          priority: 20,
          enforce: true
        },
        redux: {
          test: /[\\/]node_modules[\\/]@reduxjs[\\/]/,
          name: 'redux',
          priority: 20,
          enforce: true
        },
        crypto: {
          test: /[\\/]node_modules[\\/](crypto-js|elliptic|ethereumjs-util|blakejs|blake2b|js-sha3)[\\/]/,
          name: 'crypto',
          priority: 20,
          enforce: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          minChunks: 2
        }
      }
    };
  }

  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency: the request of a dependency is an expression/,
  ];
  
  // Treat TypeScript errors as warnings in production build
  if (env === 'production') {
    // Find the TypeScript loader and configure it to not fail on errors
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.forEach(loader => {
          if (loader.test && loader.test.toString().includes('tsx?')) {
            if (loader.use && Array.isArray(loader.use)) {
              loader.use.forEach(use => {
                if (use.loader && use.loader.includes('ts-loader')) {
                  use.options = {
                    ...use.options,
                    transpileOnly: true,
                    compilerOptions: {
                      noEmit: false
                    }
                  };
                }
              });
            }
          }
        });
      }
    });
    
    // Additionally configure webpack to not fail on TypeScript errors
    const ForkTsCheckerWebpackPlugin = config.plugins.find(
      plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
    );
    
    if (ForkTsCheckerWebpackPlugin) {
      ForkTsCheckerWebpackPlugin.options = {
        ...ForkTsCheckerWebpackPlugin.options,
        async: true,
        typescript: {
          ...ForkTsCheckerWebpackPlugin.options.typescript,
          configOverwrite: {
            compilerOptions: {
              skipLibCheck: true,
              noEmitOnError: false
            }
          }
        }
      };
    }
  }
  
  return config;
};