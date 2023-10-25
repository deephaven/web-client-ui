import themeDarkPalette from './theme-dark-palette.css?inline';
import themeDarkSemantic from './theme-dark-semantic.css?inline';
import themeDarkSemanticEditor from './theme-dark-semantic-editor.css?inline';
import themeDarkSemanticGrid from './theme-dark-semantic-grid.css?inline';
import themeDarkComponents from './theme-dark-components.css?inline';

/**
 * DH theme variables are imported via Vite `?inline` query which provides the
 * text content of the variable files as a string. The exported theme is just a
 * concatenation of the contents of all of these imports.
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
