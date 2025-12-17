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
    }),
  ];
  
  if (env === 'production') {
    // Set relative paths for static hosting
    config.output.publicPath = './';
    
    // Note: SubresourceIntegrityPlugin can be added later if needed
    
    // Optimize chunk splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        monaco: {
          test: /[\\/]node_modules[\\/]monaco-editor/,
          name: 'monaco-editor',
          priority: 20
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