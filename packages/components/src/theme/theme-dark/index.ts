import themeDarkPalette from './theme-dark-palette.css?raw';
import themeDarkSemantic from './theme-dark-semantic.css?raw';
import themeDarkSemanticEditor from './theme-dark-semantic-editor.css?raw';
import themeDarkSemanticGrid from './theme-dark-semantic-grid.css?raw';
import themeDarkComponents from './theme-dark-components.css?raw';

/**
 * DH theme variables are imported via Vite `?raw` query which provides the
 * text content of the variable files as a string. The exported theme is just a
 * concatenation of the contents of all of these imports.
 *
 * Note that ?raw / ?inline imports are natively supported by Vite, but consumers
 * of @deephaven/components using Webpack will need to add a rule to their module
 * config.
 * e.g.
 * module: {
 *  rules: [
 *    {
 *      resourceQuery: /inline/,
 *      type: 'asset/source',
 *    },
 *  ],
 * },
 *
 * e.g.
 *
 * :root {
 *   --dh-color-from-dark-palette: #fff;
 *   --dh-color-from-dark-palette2: #ccc;
 * }
 * :root {
 *   --dh-color-from-dark-semantic: #000;
 * }
 * :root {
 *   --dh-color-from-dark-semantic-editor: #000;
 * }
 * :root {
 *   --dh-color-from-dark-semantic-grid: #000;
 * }
 * :root {
 *   --dh-color-from-dark-components: #000;
 * }
 */
export const themeDark = [
  themeDarkPalette,
  themeDarkSemantic,
  themeDarkSemanticEditor,
  themeDarkSemanticGrid,
  themeDarkComponents,
].join('\n');

export default themeDark;
