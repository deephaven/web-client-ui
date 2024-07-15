import { BoxCoordinates, Coordinate } from '@deephaven/grid';
import { getIcon } from './IrisGridIcons';
import { IrisGridRenderState } from './IrisGridRenderer';

class IrisGridCellRendererUtils {
  static drawTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnX: Coordinate,
    rowY: Coordinate,
    treeBox: BoxCoordinates,
    color: string,
    isExpanded: boolean
  ): void {
    context.save();
    const { theme } = state;
    const { iconSize } = theme;
    const { x1, x2, y1, y2 } = treeBox;
    const markerIcon = isExpanded
      ? getIcon('caretDown', iconSize)
      : getIcon('caretRight', iconSize);

    const iconX = columnX + (x1 + x2) / 2 - iconSize / 2; // Midpoint of the tree box minus half the icon width
    const iconY = rowY + (y2 - y1 - iconSize) / 2; // y2 - y1 is effectively rowHeight

    context.fillStyle = color;
    context.textAlign = 'center';
    context.translate(iconX, iconY);
    context.fill(markerIcon);
    context.restore();
  }
}

export default IrisGridCellRendererUtils;
