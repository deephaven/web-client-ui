import { useEffect, useMemo, useRef } from 'react';
import { Grid, MockGridModel, type ModelIndex } from '@deephaven/grid';
import { runRenderBreakdown } from './renderBreakdown';
import TickingGridModel from './TickingGridModel';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';

/** Every cell is unique and wider than any column, so each one is truncated */
class LongTextGridModel extends MockGridModel {
  textForCell(column: ModelIndex, row: ModelIndex): string {
    return `${column},${row} ${LOREM}${LOREM}`;
  }
}

/**
 * Grid Performance Test App
 *
 * Use query params to configure the grid:
 * - rows: Number of rows (default: 1000000)
 * - cols: Number of columns (default: 100)
 * - text: `short` cell text, or `long` text that is truncated in every cell (default: short)
 * - tick: Update interval in ms. When set, every cell is a double that changes
 *   on every tick (see TickingGridModel) and `text` is ignored (default: off)
 *
 * Examples:
 *   http://localhost:4020/
 *   http://localhost:4020/?rows=10000&cols=50
 *   http://localhost:4020/?rows=100000&cols=200&text=long
 *   http://localhost:4020/?rows=2000&cols=40&tick=100
 *
 * Exposes `window.runRenderBreakdown()`, which times the grid's draw against
 * raw canvas drawing of the same cells. See renderBreakdown.ts.
 */
function App(): JSX.Element {
  const params = new URLSearchParams(window.location.search);

  const rowCount = parseInt(params.get('rows') ?? '1000000', 10);
  const columnCount = parseInt(params.get('cols') ?? '100', 10);
  const isLongText = params.get('text') === 'long';
  const tickMs = parseInt(params.get('tick') ?? '0', 10);
  const isTicking = tickMs > 0;

  const gridRef = useRef<Grid>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  const model = useMemo(() => {
    if (isTicking) {
      return new TickingGridModel({ rowCount, columnCount });
    }
    return isLongText
      ? new LongTextGridModel({ rowCount, columnCount })
      : new MockGridModel({ rowCount, columnCount });
  }, [rowCount, columnCount, isLongText, isTicking]);

  useEffect(() => {
    if (!(model instanceof TickingGridModel)) return undefined;

    // Same path as IrisGrid.handleUpdate when the model emits an update
    const interval = window.setInterval(() => {
      model.setTick(Date.now());
      gridRef.current?.forceUpdate();
    }, tickMs);
    return () => window.clearInterval(interval);
  }, [model, tickMs]);

  useEffect(() => {
    if (!isTicking) return undefined;

    // Live FPS readout, written to the DOM directly to avoid re-rendering
    let frame: number;
    let frameCount = 0;
    let start = performance.now();
    const measure = (now: number) => {
      frameCount += 1;
      if (now - start >= 1000) {
        if (fpsRef.current != null) {
          fpsRef.current.textContent = `, FPS: ${Math.round(
            (frameCount * 1000) / (now - start)
          )}`;
        }
        frameCount = 0;
        start = now;
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [isTicking]);

  useEffect(() => {
    window.runRenderBreakdown = options => {
      if (gridRef.current == null) throw new Error('Grid not mounted');
      return runRenderBreakdown(gridRef.current, options);
    };
    return () => {
      delete window.runRenderBreakdown;
    };
  }, []);

  const configInfo = `Rows: ${rowCount.toLocaleString()}, Cols: ${columnCount.toLocaleString()}${
    isTicking ? `, Tick: ${tickMs}ms` : ''
  }${!isTicking && isLongText ? ', Long text' : ''}`;

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
        <span ref={fpsRef} />
      </div>
      <Grid ref={gridRef} model={model} />
    </div>
  );
}

export default App;
