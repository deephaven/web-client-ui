import { MockGridModel, type ModelIndex } from '@deephaven/grid';

// Matches the default Deephaven decimal format `###,##0.0000`
const DECIMAL_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/**
 * Model where every cell is a double that changes on every tick, mirroring a
 * server table like:
 *
 * ```python
 * empty_table(N_ROWS)
 *   .update("Row = i")
 *   .natural_join(tick, on=[], joins=["Tick"])
 *   .update([f"C{i} = Math.sin(Tick * 0.001 + Row * 0.1 + {i}) * 1000.0" ...])
 * ```
 *
 * Values are computed and formatted when the grid asks for them, like
 * IrisGridTableModel formatting raw viewport values in `textForCell`.
 */
class TickingGridModel extends MockGridModel {
  private tickValue = Date.now();

  setTick(tick: number): void {
    this.tickValue = tick;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): number {
    return Math.sin(this.tickValue * 0.001 + row * 0.1 + column + 1) * 1000.0;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return DECIMAL_FORMAT.format(this.valueForCell(column, row));
  }

  textAlignForCell(): CanvasTextAlign {
    return 'right';
  }

  textForColumnHeader(column: ModelIndex): string {
    return `C${column + 1}`;
  }
}

export default TickingGridModel;
