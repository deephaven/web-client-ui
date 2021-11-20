// Import the react customizable bundle for building, only pull in the modules we need
// This reduces the build size. Plotly has a lot of modules we don't need/use.
// https://github.com/plotly/react-plotly.js#customizing-the-plotlyjs-bundle
import createPlotlyComponent from 'react-plotly.js/factory.js';
import Plotly from './Plotly';

// Webpack 4 (used in CRA) handles this import such that createPlotlyComponent is a function
// Webpack 5 (used in docusaurus) gives an object w/ a default key
// This is probably something on react-plotly.js's side
export default typeof createPlotlyComponent === 'function'
  ? createPlotlyComponent(Plotly)
  : createPlotlyComponent.default(Plotly);
