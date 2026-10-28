import {
  type Grid,
  type GridRenderState,
  TextCellRenderer,
  GridUtils,
} from '@deephaven/grid';

/**
 * Splits the cost of drawing the grid's visible cells into model/text
 * processing and raw canvas drawing. Every variant works on the exact cells,
 * positions, and strings the grid currently has on screen.
 *
 * - full: The grid's complete drawCanvas
 * - cellText: The grid's cell text drawing, with a warm truncation cache
 * - cellTextColdCache: cellText with the truncation cache cleared first
 * - textLookup: The model and truncation cache work done for each cell, without drawing
 * - rawText: Per column clip and fillText of precomputed strings, the drawing floor
 * - rawTextWithContextState: rawText plus the per cell context work
 *   TextCellRenderer does (save/restore, textAlign, fillStyle, measureText)
 */
export const BREAKDOWN_VARIANTS = [
  'full',
  'cellText',
  'cellTextColdCache',
  'textLookup',
  'rawText',
  'rawTextWithContextState',
] as const;

export type BreakdownVariant = (typeof BREAKDOWN_VARIANTS)[number];

export interface TimingStats {
  mean: number;
  median: number;
  p95: number;
}

export interface VariantResult {
  /** Synchronous time spent in the draw call */
  cpuMs: TimingStats;
  /** Time between animation frames, including rasterization and compositing */
  frameMs: TimingStats;
}

export interface RenderBreakdownResult {
  canvasWidth: number;
  canvasHeight: number;
  devicePixelRatio: number;
  visibleColumns: number;
  visibleRows: number;
  visibleCells: number;
  results: Record<BreakdownVariant, VariantResult>;
}

export interface RenderBreakdownOptions {
  iterations?: number;
  warmup?: number;
}

declare global {
  interface Window {
    runRenderBreakdown?: (
      options?: RenderBreakdownOptions
    ) => Promise<RenderBreakdownResult>;
  }
}

interface RawCell {
  text: string;
  x: number;
  y: number;
  align: CanvasTextAlign;
  color: string;
}

interface RawColumn {
  x: number;
  width: number;
  cells: RawCell[];
}

function getStats(values: number[]): TimingStats {
  if (values.length === 0) return { mean: 0, median: 0, p95: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const at = (percentile: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentile))];
  return { mean, median: at(0.5), p95: at(0.95) };
}

/**
 * Draws once per animation frame so every draw is rasterized and presented,
 * the same way the grid draws while scrolling.
 */
function measure(
  draw: () => void,
  iterations: number,
  warmup: number
): Promise<VariantResult> {
  const cpu: number[] = [];
  const frames: number[] = [];

  return new Promise(resolve => {
    let index = 0;
    let lastTime = -1;

    const tick = (time: number) => {
      // The interval ending now covers the previous draw
      if (index > warmup && lastTime >= 0) {
        frames.push(time - lastTime);
      }
      lastTime = time;

      if (index >= warmup + iterations) {
        resolve({ cpuMs: getStats(cpu), frameMs: getStats(frames) });
        return;
      }

      const start = performance.now();
      draw();
      const end = performance.now();
      if (index >= warmup) {
        cpu.push(end - start);
      }

      index += 1;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

/**
 * The grid renderer keeps its text renderer protected, but the benchmark needs
 * to swap it for a fresh instance to start from an empty truncation cache
 */
function getTextCellRendererHost(grid: Grid): {
  textCellRenderer: TextCellRenderer;
} {
  return grid.renderer as unknown as { textCellRenderer: TextCellRenderer };
}

function getRawColumns(
  state: GridRenderState,
  textCellRenderer: TextCellRenderer
): RawColumn[] {
  const { context, metrics, model, theme } = state;
  const {
    allColumnXs,
    allColumnWidths,
    allRowHeights,
    columnsForRender,
    fontWidthsLower,
    fontWidthsUpper,
    modelColumns,
    modelRows,
    visibleRows,
  } = metrics;

  return columnsForRender.map(column => {
    const cells: RawCell[] = [];
    const modelColumn = modelColumns.get(column) ?? column;

    visibleRows.forEach(row => {
      const modelRow = modelRows.get(row) ?? row;
      const text = model.textForCell(modelColumn, modelRow);
      if (!text || (allRowHeights.get(row) ?? 0) <= 0) return;

      const { width, x, y } = GridUtils.getTextRenderMetrics(
        state,
        column,
        row
      );
      cells.push({
        text: textCellRenderer.getCachedTruncatedString(
          context,
          text,
          width,
          fontWidthsLower.get(context.font),
          fontWidthsUpper.get(context.font),
          model.truncationCharForCell(modelColumn, modelRow)
        ),
        x,
        y,
        align: model.textAlignForCell(modelColumn, modelRow) || 'left',
        color: model.colorForCell(modelColumn, modelRow, theme) as string,
      });
    });

    return {
      x: allColumnXs.get(column) ?? 0,
      width: allColumnWidths.get(column) ?? 0,
      cells,
    };
  });
}

export async function runRenderBreakdown(
  grid: Grid,
  { iterations = 60, warmup = 10 }: RenderBreakdownOptions = {}
): Promise<RenderBreakdownResult> {
  const { canvas, renderer } = grid;
  const state = grid.updateRenderState();
  const { context, metrics, model, theme } = state;
  if (canvas == null) throw new Error('Grid canvas not set');

  const textCellRendererHost = getTextCellRendererHost(grid);
  const { textCellRenderer } = textCellRendererHost;
  const {
    allRowHeights,
    columnsForRender,
    fontWidthsLower,
    fontWidthsUpper,
    gridX,
    gridY,
    height,
    modelColumns,
    modelRows,
    visibleRows,
    width,
  } = metrics;

  const beginCellDraw = () => {
    context.save();
    context.fillStyle = theme.backgroundColor;
    context.fillRect(0, 0, width, height);
    renderer.configureContext(context, state);
    context.translate(gridX, gridY);
  };

  const drawCellText = () => {
    beginCellDraw();
    renderer.drawCellContents(context, state);
    context.restore();
  };

  const rawColumns = getRawColumns(state, textCellRenderer);

  const drawRawText = (withContextState: boolean) => {
    beginCellDraw();
    for (let c = 0; c < rawColumns.length; c += 1) {
      const { x, width: columnWidth, cells } = rawColumns[c];
      context.save();
      context.beginPath();
      context.rect(x, 0, columnWidth, height);
      context.clip();
      for (let r = 0; r < cells.length; r += 1) {
        const cell = cells[r];
        if (withContextState) {
          context.textAlign = cell.align;
          context.fillStyle = cell.color;
          context.save();
          context.measureText(cell.text);
          context.measureText(cell.text);
          context.fillText(cell.text, cell.x, cell.y);
          context.restore();
        } else {
          context.textAlign = cell.align;
          context.fillStyle = cell.color;
          context.fillText(cell.text, cell.x, cell.y);
        }
      }
      context.restore();
    }
    context.restore();
  };

  const draws: Record<BreakdownVariant, () => void> = {
    full: () => {
      context.save();
      renderer.drawCanvas(state);
      context.restore();
    },
    cellText: drawCellText,
    cellTextColdCache: () => {
      // A new renderer has an empty cache whichever memoizer it uses
      textCellRendererHost.textCellRenderer = new TextCellRenderer();
      drawCellText();
    },
    textLookup: () => {
      for (let c = 0; c < columnsForRender.length; c += 1) {
        const column = columnsForRender[c];
        const modelColumn = modelColumns.get(column) ?? column;
        for (let r = 0; r < visibleRows.length; r += 1) {
          const row = visibleRows[r];
          const modelRow = modelRows.get(row) ?? row;
          const text = model.textForCell(modelColumn, modelRow);
          const truncationChar = model.truncationCharForCell(
            modelColumn,
            modelRow
          );
          if (text && (allRowHeights.get(row) ?? 0) > 0) {
            model.textAlignForCell(modelColumn, modelRow);
            model.colorForCell(modelColumn, modelRow, theme);
            const { width: textWidth } = GridUtils.getTextRenderMetrics(
              state,
              column,
              row
            );
            const truncatedText = textCellRenderer.getCachedTruncatedString(
              context,
              text,
              textWidth,
              fontWidthsLower.get(context.font),
              fontWidthsUpper.get(context.font),
              truncationChar
            );
            model.tokensForCell(modelColumn, modelRow, truncatedText.length);
          }
        }
      }
    },
    rawText: () => drawRawText(false),
    rawTextWithContextState: () => drawRawText(true),
  };

  const results = {} as Record<BreakdownVariant, VariantResult>;
  for (let i = 0; i < BREAKDOWN_VARIANTS.length; i += 1) {
    const variant = BREAKDOWN_VARIANTS[i];
    // Every variant starts from the same warm cache
    getRawColumns(state, textCellRenderer);
    // eslint-disable-next-line no-await-in-loop -- variants must not overlap
    results[variant] = await measure(draws[variant], iterations, warmup);
    textCellRendererHost.textCellRenderer = textCellRenderer;
  }

  grid.updateCanvas();

  const visibleCells = rawColumns.reduce(
    (sum, column) => sum + column.cells.length,
    0
  );

  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    devicePixelRatio: window.devicePixelRatio,
    visibleColumns: columnsForRender.length,
    visibleRows: visibleRows.length,
    visibleCells,
    results,
  };
}
