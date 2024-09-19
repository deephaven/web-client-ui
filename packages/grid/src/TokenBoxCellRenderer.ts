import type CellRenderer from './CellRenderer';
import { type VisibleIndex } from './GridMetrics';
import { type GridRenderState } from './GridRendererTypes';
import { type TokenBox } from './GridUtils';

export function isTokenBoxCellRenderer(
  cellRenderer: CellRenderer
): cellRenderer is TokenBoxCellRenderer {
  return (
    (cellRenderer as TokenBoxCellRenderer)?.getTokenBoxesForVisibleCell !==
    undefined
  );
}

interface TokenBoxCellRenderer extends CellRenderer {
  getTokenBoxesForVisibleCell: (
    column: VisibleIndex,
    row: VisibleIndex,
    state: GridRenderState
  ) => TokenBox[];
}

export default TokenBoxCellRenderer;
