import {
  type EventHandlerResult,
  type Grid,
  type GridPoint,
  isLinkToken,
  GridTokenMouseHandler,
  type GridRangeIndex,
} from '@deephaven/grid';
import deepEqual from 'fast-deep-equal';
import type IrisGrid from '../IrisGrid';

// Handler also helps with other tooltips
class IrisGridTokenMouseHandler extends GridTokenMouseHandler {
  private irisGrid: IrisGrid;

  private lastColumn: GridRangeIndex;

  private lastRow: GridRangeIndex;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.lastColumn = null;
    this.lastRow = null;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ hoverTooltipProps: null });
  }

  protected setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.isHoveringLink(gridPoint, grid)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }
    this.cursor = null;
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const isUserHoveringLink = this.isHoveringLink(gridPoint, grid);
    const tooltip = model.tooltipForCell(gridPoint.column, gridPoint.row);

    if (
      isUserHoveringLink &&
      this.currentLinkBox != null &&
      isLinkToken(this.currentLinkBox.token)
    ) {
      const { hoverTooltipProps } = this.irisGrid.state;
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      const { href } = this.currentLinkBox.token;
      const width = right - left;
      const height = bottom - top;
      const newProps = { left, top: top + 1, width, height };

      if (!deepEqual(hoverTooltipProps, newProps)) {
        this.irisGrid.setState({
          hoverTooltipProps: newProps,
          hoverDisplayValue: (
            <>
              {href} - Click once to follow.
              <br />
              Click and hold to select this cell.
            </>
          ),
        });
      }
    } else if (tooltip !== null) {
      const { hoverTooltipProps } = this.irisGrid.state;
      const newProps = {
        left: gridPoint.x,
        top: gridPoint.y + 1,
        width: 1,
        height: 1,
      };
      if (!deepEqual(hoverTooltipProps, newProps)) {
        if (hoverTooltipProps == null) {
          this.irisGrid.setState({
            hoverTooltipProps: newProps,
            hoverDisplayValue: tooltip,
          });
        } else if (
          this.lastColumn !== gridPoint.column ||
          this.lastRow !== gridPoint.row
        ) {
          this.irisGrid.setState(
            {
              hoverTooltipProps: null,
            },
            () =>
              this.irisGrid.setState({
                hoverTooltipProps: newProps,
                hoverDisplayValue: tooltip,
              })
          );
        }
      }
    } else {
      this.destroyTooltip();
    }

    this.lastColumn = gridPoint.column;
    this.lastRow = gridPoint.row;

    return this.setCursor(gridPoint, grid);
  }

  onDown(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onContextMenu(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onWheel(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onLeave(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }
}

export default IrisGridTokenMouseHandler;
