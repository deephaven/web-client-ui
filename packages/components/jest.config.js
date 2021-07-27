const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  setupFilesAfterEnv: ['./jest.setup.js'],
};
