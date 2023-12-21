import themeLightPalette from './theme-light-palette.css?raw';
import themeLightSemantic from './theme-light-semantic.css?raw';
import themeLightSemanticChart from './theme-light-semantic-chart.css?raw';
import themeLightSemanticEditor from './theme-light-semantic-editor.css?raw';
import themeLightSemanticGrid from './theme-light-semantic-grid.css?raw';
import themeLightComponents from './theme-light-components.css?raw';

/**

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
 * }
 *
 * e.g.
 *
 * :root {
 *   --dh-color-from-light-palette: #fff;
 *   --dh-color-from-light-palette2: #ccc;
 * }
 * :root {
 *   --dh-color-from-light-semantic: #000;
 * }
 * :root {
 *   --dh-color-from-light-semantic-editor: #000;
 * }
 * :root {
 *   --dh-color-from-light-semantic-grid: #000;
 * }
 * :root {
 *   --dh-color-from-light-components: #000;
 * }
 */
export const themeLight = [
  themeLightPalette,
  themeLightSemantic,
  themeLightSemanticChart,
  themeLightSemanticEditor,
  themeLightSemanticGrid,
  themeLightComponents,
].join('\n');

export default themeLight;
