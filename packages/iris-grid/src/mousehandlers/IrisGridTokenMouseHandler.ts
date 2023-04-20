import {
  EventHandlerResult,
  getOrThrow,
  Grid,
  GridMouseHandler,
  GridPoint,
  GridUtils,
  isLinkToken,
  TokenBox,
  isTokenBoxCellRenderer,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import IrisGrid from '../IrisGrid';

class IrisGridTokenMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  // Stores the current hovered token box if it exists with translated coordinates
  private currentLinkBox?: TokenBox;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ linkHoverTooltipProps: null });
  }

  isHoveringLink(gridPoint: GridPoint, grid: Grid): boolean {
    const { column, row, x, y } = gridPoint;
    const { renderer, metrics, props } = grid;
    const { model } = props;

    if (column == null || row == null || metrics == null) {
      this.currentLinkBox = undefined;
      return false;
    }

    const { modelRows, modelColumns } = metrics;
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);

    const renderType = model.renderTypeForCell(modelColumn, modelRow);
    const cellRenderer = renderer.getCellRenderer(renderType);
    if (!isTokenBoxCellRenderer(cellRenderer)) {
      return false;
    }

    if (this.currentLinkBox != null) {
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }

    const renderState = grid.updateRenderState();
    const tokensInCell = cellRenderer.getTokenBoxesForVisibleCell(
      column,
      row,
      renderState
    );

    // Loop through each link and check if cursor is in bounds
    for (let i = 0; i < tokensInCell.length; i += 1) {
      if (isLinkToken(tokensInCell[i].token)) {
        const translatedTokenBox = GridUtils.translateTokenBox(
          tokensInCell[i],
          metrics
        );
        const { x1: left, x2: right, y1: top, y2: bottom } = translatedTokenBox;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          this.currentLinkBox = translatedTokenBox;
          return true;
        }
      }
    }

    // If this point is reached, that means the cursor was not hovering any of the links or there are no links
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
    if (
      isUserHoveringLink &&
      this.currentLinkBox != null &&
      isLinkToken(this.currentLinkBox.token)
    ) {
      const { linkHoverTooltipProps } = this.irisGrid.state;
      if (this.currentLinkBox == null) {
        return false;
      }
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      const { href } = this.currentLinkBox.token;
      const width = right - left;
      const height = bottom - top;
      const newProps = { left, top: top + 1, width, height };
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
