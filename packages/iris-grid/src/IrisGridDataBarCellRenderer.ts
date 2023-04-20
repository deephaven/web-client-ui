import {
  BoxCoordinates,
  Coordinate,
  DataBarCellRenderer,
} from '@deephaven/grid';
import {
  vsTriangleDown,
  vsTriangleRight,
  IconDefinition,
} from '@deephaven/icons';
import { IrisGridRenderState } from './IrisGridRenderer';

const ICON_SIZE = 16;
const ICON_NAMES = Object.freeze({
  CARET_DOWN: 'caretDown',
  CARET_RIGHT: 'caretRight',
});

class IrisGridDataBarCellRenderer extends DataBarCellRenderer {
  icons: Record<string, Path2D>;

  constructor() {
    super();
    this.icons = {};

    this.initIcons();
  }

  initIcons(): void {
    this.setIcon(ICON_NAMES.CARET_DOWN, vsTriangleDown);
    this.setIcon(ICON_NAMES.CARET_RIGHT, vsTriangleRight);
  }

  // Scales the icon to be square and match the global ICON_SIZE
  setIcon(name: string, faIcon: IconDefinition): void {
    const path = Array.isArray(faIcon.icon[4])
      ? faIcon.icon[4][0]
      : faIcon.icon[4];
    const icon = new Path2D(path);
    const scaledIcon = new Path2D();
    const scaleMatrix = {
      a: ICON_SIZE / faIcon.icon[0],
      d: ICON_SIZE / faIcon.icon[1],
    };
    scaledIcon.addPath(icon, scaleMatrix);
    this.icons[name] = scaledIcon;
  }

  getIcon(name: string): Path2D {
    return this.icons[name];
  }

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
      ? this.getIcon(ICON_NAMES.CARET_DOWN)
      : this.getIcon(ICON_NAMES.CARET_RIGHT);
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
