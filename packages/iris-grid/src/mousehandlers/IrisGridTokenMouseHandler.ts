import {
  EventHandlerResult,
  Grid,
  GridMouseHandler,
  GridPoint,
  isLinkToken,
  TokenBox,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import IrisGrid from '../IrisGrid';

class IrisGridTokenMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  private currentLinkBox?: TokenBox;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ linkHoverTooltipProps: null });
  }

  /**
   * A function that returns a boolean based on whether the user is hovering a link
   * @param gridPoint The mouse information
   * @param grid The grid
   * @returns True if the mouse is hovering a link, false otherwise
   */
  isHoveringLink(gridPoint: GridPoint, grid: Grid): boolean {
    const { column, row, x, y } = gridPoint;
    if (column == null || row == null) {
      this.currentLinkBox = undefined;
      return false;
    }

    if (this.currentLinkBox != null) {
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }

    const { renderer } = grid;
    const renderState = grid.updateRenderState();
    const linksInCell = renderer.getTokenBoxesForVisibleCell(
      column,
      row,
      renderState
    );

    if (linksInCell.length === 0) {
      this.currentLinkBox = undefined;
      return false;
    }

    for (let i = 0; i < linksInCell.length; i += 1) {
      const { x1: left, x2: right, y1: top, y2: bottom } = linksInCell[i];
      if (
        x >= left &&
        x <= right &&
        y >= top &&
        y <= bottom &&
        isLinkToken(linksInCell[i].token)
      ) {
        this.currentLinkBox = linksInCell[i];
        return true;
      }
    }

    this.currentLinkBox = undefined;
    return false;
  }

  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.isHoveringLink(gridPoint, grid)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }
    this.cursor = null;
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const isUserHoveringLink = this.isHoveringLink(gridPoint, grid);
    if (isUserHoveringLink) {
      const { linkHoverTooltipProps } = this.irisGrid.state;
      if (this.currentLinkBox == null) {
        return false;
      }
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      const { href } = this.currentLinkBox.token;
      const width = right - left;
      const height = bottom - top;
      const newProps = { left, top, width, height };
      if (!deepEqual(linkHoverTooltipProps, newProps)) {
        this.irisGrid.setState({
          linkHoverTooltipProps: newProps,
          linkHoverDisplayValue: href,
        });
      }
    } else {
      this.destroyTooltip();
    }

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
