/**
 * plotly.js only declares types for its main entry point, and `moduleResolution:
 * "node"` cannot read react-plotly.js's `exports` map, so declare the subpath
 * modules our partial bundle imports.
 */

declare module 'plotly.js/lib/core.js' {
  import type Plotly from 'plotly.js';

  const core: typeof Plotly;
  export default core;
}

declare module 'plotly.js/lib/bar.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'plotly.js/lib/histogram.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'plotly.js/lib/pie.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'plotly.js/lib/ohlc.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'plotly.js/lib/scattergl.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'plotly.js/lib/treemap.js' {
  import type { PlotlyModule } from 'plotly.js';

  const trace: PlotlyModule;
  export default trace;
}

declare module 'react-plotly.js/factory' {
  import type React from 'react';
  import type { PlotParams } from 'react-plotly.js';

  const createPlotlyComponent: (
    plotly: unknown
  ) => React.ForwardRefExoticComponent<
    PlotParams & React.RefAttributes<HTMLDivElement>
  >;
  export default createPlotlyComponent;
}
