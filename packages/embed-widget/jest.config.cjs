const baseConfig = require('../../jest.config.base.cjs');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  resetMocks: false,
};
