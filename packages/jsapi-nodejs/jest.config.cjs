const baseConfig = require('../../jest.config.base.cjs');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // This package targets NodeNext, so its relative imports carry an explicit
    // `.js` extension that has to map back to the `.ts` source.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
