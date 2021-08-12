const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  resetMocks: false,
  transform: {
    // Using ts-jest (even with its babelConfig option set) causes
    // problems with some code-studio tests
    '.(ts|tsx|js|jsx)': 'babel-jest',
  },
};
