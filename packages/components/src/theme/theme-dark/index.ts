import themeDarkPalette from './theme-dark-palette.css?inline';
import themeDarkSemantic from './theme-dark-semantic.css?inline';
import themeDarkSemanticEditor from './theme-dark-semantic-editor.css?inline';
import themeDarkSemanticGrid from './theme-dark-semantic-grid.css?inline';
import themeDarkComponents from './theme-dark-components.css?inline';

/**
 * Theme is exported as a string containing css variable definitions.
 */
export const themeDark = [
  themeDarkPalette,
  themeDarkSemantic,
  themeDarkSemanticEditor,
  themeDarkSemanticGrid,
  themeDarkComponents,
].join('\n');

export default themeDark;
