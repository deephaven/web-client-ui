/* eslint-disable class-methods-use-this */
import {
  BoxCoordinates,
  Coordinate,
  DataBarCellRenderer,
} from '@deephaven/grid';
import { IrisGridRenderState } from './IrisGridRenderer';
import { getIcon } from './IrisGridIcons';

class IrisGridDataBarCellRenderer extends DataBarCellRenderer {
  drawTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnX: Coordinate,
    rowY: Coordinate,
    treeBox: BoxCoordinates,
    color: string,
    isExpanded: boolean
  ): void {
    context.save();
    const { x1, y1 } = treeBox;
    const markerIcon = isExpanded
      ? getIcon('caretDown')
      : getIcon('caretRight');
    const iconX = columnX + x1 - 2;
    const iconY = rowY + y1 + 2.5;

    context.fillStyle = color;
    context.textAlign = 'center';
    context.translate(iconX, iconY);
    context.fill(markerIcon);
    context.restore();
  }
}

export default IrisGridDataBarCellRenderer;
