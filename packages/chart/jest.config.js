import baseConfig from '../../jest.config.base.js';
import * as packageJson from './package.json';

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
};
