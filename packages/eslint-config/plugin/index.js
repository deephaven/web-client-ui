const noSelfPackageImportRule = require('./no-self-package-import');

const plugin = {
  rules: { 'no-self-package-import': noSelfPackageImportRule },
};

module.exports = plugin;
