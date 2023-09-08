/**
 * Derive the `@deephaven` package name from the given path.
 * Note that this assumes that the package folder name uses the same naming
 * convention as the package.json `name` field.
 */
function deriveDeephavenPackageNameFromPath(path) {
  // In the off chance that there is a packages folder higher up in the path,
  // find the deepest one.
  const packageFolderNameI = path.lastIndexOf('packages');

  if (packageFolderNameI === -1) {
    return null;
  }

  // Find the path token immediately after the `packages` folder.
  const [packageFolderName] = path
    .substring(packageFolderNameI + 'packages'.length + 1)
    .split('/');

  if (packageFolderName === '') {
    return null;
  }

  return `@deephaven/${packageFolderName}`;
}

/**
 * Custom eslint rule that forbids importing from the same `@deephaven` package
 * that owns the module. Note that this rule is only useful within the `@deephaven`
 * web-client-ui monorepo.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid importing from the same `@deephaven` package that owns this module.',
    },
  },
  create: function create(context) {
    const filePath = context.getFilename();

    const packageName = deriveDeephavenPackageNameFromPath(filePath);
    if (packageName == null) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value.includes(packageName)) {
          context.report({
            node,
            message:
              'Forbid importing from the same `@deephaven` package that owns this module.',
          });
        }
      },
    };
  },
};
