import { useMemo } from 'react';
import { Grid, MockGridModel } from '@deephaven/grid';

/**
 * Grid Performance Test App
 *
 * Use query params to configure the grid:
 * - rows: Number of rows (default: 1000000)
 * - cols: Number of columns (default: 100)
 *
 * Examples:
 *   http://localhost:4020/
 *   http://localhost:4020/?rows=10000&cols=50
 *   http://localhost:4020/?rows=100000&cols=200
 */
function App(): JSX.Element {
  const params = new URLSearchParams(window.location.search);

  const rowCount = parseInt(params.get('rows') ?? '1000000', 10);
  const columnCount = parseInt(params.get('cols') ?? '100', 10);

  const model = useMemo(
    () => new MockGridModel({ rowCount, columnCount }),
    [rowCount, columnCount]
  );

  const configInfo = `Rows: ${rowCount.toLocaleString()}, Cols: ${columnCount.toLocaleString()}`;

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
      <Grid model={model} />
    </div>
  );
}

export default App;
