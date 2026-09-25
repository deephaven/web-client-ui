const fs = require('fs');
const path = require('path');

const localConfigPath = path.join(__dirname, 'jest.config.local.cjs');

/**
 * Merge an optional, gitignored `jest.config.local.cjs` on top of a root Jest
 * config so developers can override settings (e.g. `maxWorkers`) locally.
 * @param {object} config Root Jest config to extend
 * @returns {object} The config with any local overrides applied
 */
function withLocalConfig(config) {
  if (!fs.existsSync(localConfigPath)) {
    return config;
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  return { ...config, ...require(localConfigPath) };
}

module.exports = withLocalConfig;
