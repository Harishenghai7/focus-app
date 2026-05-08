const { override, addWebpackAlias } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = override(
  (config) => {
    // ── Node.js polyfills (required for Supabase + crypto) ─────────────
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
      fs: false,
      net: false,
      tls: false,
    };

    // ── .mjs support ────────────────────────────────────────────────────
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: { fullySpecified: false },
    });

    // ── Aliases ─────────────────────────────────────────────────────────
    config.resolve.alias = {
      ...config.resolve.alias,
      'process/browser': require.resolve('process/browser.js'),
      '@': path.resolve(__dirname, 'src'),
    };

    // ── Suppress noisy warnings ──────────────────────────────────────────
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
      /Cannot statically analyse/,
      /Critical dependency: the request of a dependency is an expression/,
      { module: /nsfwjs/ },
      { module: /@tensorflow/ },
      { module: /@xenova[\\/]transformers/ },
      { module: /onnxruntime/ },
    ];

    // ── Exclude heavy nsfwjs model bundles from parsing ──────────────────
    config.module.rules.push({
      test: /nsfwjs[\\/].*\.min\.js$/,
      parser: { requireEnsure: false, amd: false },
    });
    config.module.noParse = [
      ...(config.module.noParse ? (Array.isArray(config.module.noParse) ? config.module.noParse : [config.module.noParse]) : []),
      /nsfwjs[\\/]dist[\\/]models[\\/]/,
    ];

    return config;
  },

  addWebpackAlias({ '@': path.resolve(__dirname, 'src') }),

  (config) => {
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.browser': true,
      })
    );
    return config;
  }
);
