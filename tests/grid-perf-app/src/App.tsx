import { useMemo } from 'react';
import { Grid, MockGridModel } from '@deephaven/grid';

/**
 * Grid Performance Test App
 *
 * Use query params to configure the grid:
 * - rows: Number of rows (default: 1000000)
 * - cols: Number of columns (default: 100)
 * - a11y: Enable accessibility layer (default: true, set to "false" to disable)
 *
 * Examples:
 *   http://localhost:4020/
 *   http://localhost:4020/?rows=10000&cols=50
 *   http://localhost:4020/?a11y=false
 *   http://localhost:4020/?rows=100000&cols=200&a11y=false
 */
function App(): JSX.Element {
  const params = new URLSearchParams(window.location.search);

  const rowCount = parseInt(params.get('rows') ?? '1000000', 10);
  const columnCount = parseInt(params.get('cols') ?? '100', 10);
  const enableAccessibilityLayer = params.get('a11y') !== 'false';

  const model = useMemo(
    () => new MockGridModel({ rowCount, columnCount }),
    [rowCount, columnCount]
  );

  const configInfo = `Rows: ${rowCount.toLocaleString()}, Cols: ${columnCount.toLocaleString()}, A11y Layer: ${enableAccessibilityLayer}`;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        display: 'flex',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {configInfo}
      </div>
      <Grid model={model} enableAccessibilityLayer={enableAccessibilityLayer} />
    </div>
  );
}

export default App;
