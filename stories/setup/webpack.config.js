const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = ({ config, mode }) => {
  config.devtool = false;

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve('babel-loader'),
    options: {
      presets: [['react-app', { flow: false, typescript: true }]],
    },
  });
  config.resolve.extensions.push('.ts', '.tsx');

  // See https://github.com/storybookjs/storybook/issues/9777
  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  );

  return config;
};
