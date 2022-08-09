/**
 * A very simple babel transform that replaces import.meta.env with process.env
 * Jest does not handle ESM well, but Vite uses import.meta.env for many variables
 * As a result, Jest complains about these instances
 * Inspired by https://github.com/javiertury/babel-plugin-transform-import-meta/blob/master/src/index.ts
 */

module.exports = () => ({
  name: 'transform-import-meta-env',
  visitor: {
    MemberExpression(path) {
      const { node } = path;
      if (
        node.object.type === 'MetaProperty' &&
        node.object.meta.name === 'import' &&
        node.object.property.name === 'meta' &&
        node.property.type === 'Identifier' &&
        node.property.name === 'env'
      ) {
        path.replaceWithSourceString('process.env');
      }
    },
  },
});
