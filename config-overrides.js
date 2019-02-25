/* eslint-disable amo/only-tsx-files, @typescript-eslint/no-var-requires */
const rewireReactHotLoader = require('react-app-rewire-hot-loader');

// This overrides the Create React App config.
// See https://github.com/cdharris/react-app-rewire-hot-loader
module.exports = function override(config, env) {
  const newConfig = rewireReactHotLoader(config, env);
  return newConfig;
};
