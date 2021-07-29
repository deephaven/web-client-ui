const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  resetMocks: false,
  displayName: packageJson.name,
  setupFilesAfterEnv: ['./jest.setup.js'],
};
