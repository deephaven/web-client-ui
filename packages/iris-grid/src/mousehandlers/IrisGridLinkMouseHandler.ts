import {
  EventHandlerResult,
  Grid,
  GridLinkMouseHandler,
  GridMouseHandler,
  GridPoint,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import IrisGrid from '../IrisGrid';

class IrisGridLinkMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ linkHoverTooltipProps: null });
  }

  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridLinkMouseHandler.getHoveringLinkInfo(gridPoint, grid) != null) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }
    this.cursor = null;
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const linkInformation = GridLinkMouseHandler.getHoveringLinkInfo(
      gridPoint,
      grid
    );
    if (linkInformation != null) {
      const { linkHoverTooltipProps } = this.irisGrid.state;
      const { left, top, width, height, href } = linkInformation;
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

export default IrisGridLinkMouseHandler;
