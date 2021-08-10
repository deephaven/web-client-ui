const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  resetMocks: false,
  transform: {
    '.(ts|tsx|js|jsx)': '<rootDir>/jestBabelTransform.js',
  },
};
