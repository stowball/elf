const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  // Enable minification and tree-shaking
  mode: 'production',
  optimization: {
    minimizer: [
      new OptimizeCssAssetsPlugin({}),
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
});
