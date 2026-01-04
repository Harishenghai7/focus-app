const { override, addWebpackAlias, addWebpackPlugin, addWebpackModuleRule } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = override(
  // Add fallbacks for Node.js core modules
  (config) => {
    // Only add fallbacks if they don't exist to prevent overriding
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser.js'),
      url: require.resolve('url'),
      fs: false, // fs is not available in the browser
      net: false, // net is not available in the browser
      tls: false, // tls is not available in the browser
    };

    // Add support for .mjs files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Fix for process/browser resolution and add @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      'process/browser': require.resolve('process/browser.js'),
      '@': path.resolve(__dirname, 'src')
    };

    // Ignore source map warnings from node_modules (fixes nsfwjs warnings)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
    ];

    return config;
  },

  // Add path aliases
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  }),

  // Add process and Buffer polyfills
  (config) => {
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer']
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.browser': true,
      })
    );

    return config;
  }
);
