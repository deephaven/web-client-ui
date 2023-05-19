// Import the react customizable bundle for building, only pull in the modules we need
// This reduces the build size. Plotly has a lot of modules we don't need/use.
// https://github.com/plotly/react-plotly.js#customizing-the-plotlyjs-bundle
import createPlotlyComponent from 'react-plotly.js/factory.js';
import Plotly from './Plotly';

// Webpack 5 (used in docusaurus) gives an object w/ a default key
// This is probably something on react-plotly.js's side
// Or because we lazy load this and Docusaurus ends up w/ some complications between ESM and CJS
export default typeof createPlotlyComponent === 'function'
  ? createPlotlyComponent(Plotly)
  : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (createPlotlyComponent.default(Plotly) as ReturnType<
      typeof createPlotlyComponent
    >);
