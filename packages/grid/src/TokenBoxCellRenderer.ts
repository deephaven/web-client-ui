import CellRenderer from './CellRenderer';
import { VisibleIndex } from './GridMetrics';
import { GridRenderState } from './GridRendererTypes';
import { TokenBox } from './GridUtils';

export function isTokenBoxCellRenderer(
  cellRenderer: CellRenderer
): cellRenderer is TokenBoxCellRenderer {
  return (
    (cellRenderer as TokenBoxCellRenderer)?.getTokenBoxesForVisibleCell !==
    undefined
  );
}

interface TokenBoxCellRenderer extends CellRenderer {
  getTokenBoxesForVisibleCell(
    column: VisibleIndex,
    row: VisibleIndex,
    state: GridRenderState
  ): TokenBox[];
}

export default TokenBoxCellRenderer;
