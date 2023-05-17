// Import the react customizable bundle for building, only pull in the modules we need
// This reduces the build size. Plotly has a lot of modules we don't need/use.
// https://github.com/plotly/react-plotly.js#customizing-the-plotlyjs-bundle
import createPlotlyComponent from 'react-plotly.js/factory.js';
import Plotly from './Plotly';

export default createPlotlyComponent(Plotly);
