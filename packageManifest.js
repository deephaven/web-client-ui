const fs = require('fs');
const path = require('path');

/**
 * Build a package manifest for the @deephaven packages.
 * @returns {{
 *  packageNames: string[],              // The package names.
 *  packageManifest: Map<string, string> // Map of package names to directory names.
 * }}
 */
function buildPackageManifest() {
  const packageDirNames = fs
    .readdirSync(path.join(__dirname, 'packages'), { withFileTypes: true })
    .filter(ent => ent.isDirectory())
    .map(({ name }) => name);

  // Map of package name to directory name
  const packageManifest = new Map();

  packageDirNames.forEach(dirName => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const packageName = require(path.join(
      __dirname,
      'packages',
      dirName,
      'package.json'
    )).name;

    packageManifest.set(packageName, dirName);
  });

  return {
    packageNames: [...packageManifest.keys()],
    packageManifest,
  };
}

module.exports = buildPackageManifest;
