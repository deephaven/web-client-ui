const CSS_INLINE_IMPORT_REGEX = /\.s?css\?(inline|raw)$/;
const CSS_MODULE_IMPORT_REGEX = /([^/]+)\.module\.s?css/;

/**
 * Babel transform plugin to mock CSS imports for unit testing purposes. This
 * can be passed to `babel-jest` transform as a plugin.
 *
 * e.g.
 *
 * transform: {
 *   '.(ts|tsx|js|jsx)': [
 *     'babel-jest',
 *     {
 *       rootMode: 'upward',
 *       plugins: [
 *         '@deephaven/babel-preset/mockCssImportPlugin',
 *       ],
 *     },
 *   ],
 * },
 */
module.exports = function cssTransformerPlugin({ types: t }) {
  return {
    name: 'transform-mock-css-import',
    visitor: {
      /** Match import declarations */
      ImportDeclaration(path) {
        const { node } = path;

        const [, moduleName] =
          CSS_MODULE_IMPORT_REGEX.exec(node.source.value) || [];

        // Replace CSS module import with a const object declaration. Object
        // will have single key / value derived from the module name.
        // e.g.
        // import saturn from './saturn.module.css';
        // becomes
        // const styles = { 'saturn': 'saturn' };
        if (moduleName) {
          const { name } = node.specifiers[0].local;

          path.replaceWith(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(name),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier(`'${moduleName}'`),
                    t.stringLiteral(moduleName)
                  ),
                ])
              ),
            ])
          );
        }
        // Replace (s)css imports that have ?inline or ?raw query strings with a
        // const variable declaration.
        // e.g.
        // import './saturn.css?inline';
        // becomes
        // const saturn = './saturn.css?inline';
        else if (CSS_INLINE_IMPORT_REGEX.test(node.source.value)) {
          const { name } = node.specifiers[0].local;
          const { value } = node.source;

          path.replaceWith(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(name), t.stringLiteral(value)),
            ])
          );
        }
      },
    },
  };
};
