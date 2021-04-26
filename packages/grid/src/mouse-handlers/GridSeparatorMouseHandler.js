/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import GridMouseHandler from '../GridMouseHandler';

const OVERRIDE_STRING = 'NEED_TO_OVERRIDE_PROPERTY';

/**
 * Abstract class that should be extended for column/row behaviour
 * Override the necessary functions/properties
 */
class GridSeparatorMouseHandler extends GridMouseHandler {
  // The index where dragging the column separator started
  draggingIndex = null;

  // The columns in the order they're being resized
  resizingItems = [];

  // Columns that were hidden under the separator when starting a drag
  hiddenItems = [];

  // The target width of the columns being resized
  targetSizes = new Map();

  dragOffset = 0;

  // Override/Implement these properties/functions
  cursor = OVERRIDE_STRING;

  hiddenCursor = OVERRIDE_STRING;

  defaultCursor = OVERRIDE_STRING;

  pointProperty = OVERRIDE_STRING;

  userSizesProperty = OVERRIDE_STRING;

  visibleOffsetProperty = OVERRIDE_STRING;

  visibleSizesProperty = OVERRIDE_STRING;

  marginProperty = OVERRIDE_STRING;

  calculatedSizesProperty = OVERRIDE_STRING;

  modelIndexesProperty = OVERRIDE_STRING;

  firstIndexProperty = OVERRIDE_STRING;

  treePaddingProperty = OVERRIDE_STRING;

  getHiddenItems(itemIndex, metrics) {
    throw new Error('Need to override getHiddenItems');
  }

  getNextShownItem(itemIndex, metrics) {
    throw new Error('Need to override getNextShownItem');
  }

  // eslint-disable-next-line no-unused-vars
  setSize(metricCalculator, modelIndex, size) {
    throw new Error('Need to override setSize');
  }

  // eslint-disable-next-line no-unused-vars
  resetSize(metricCalculator, modelIndex) {
    throw new Error('Need to override resetSize');
  }

  // eslint-disable-next-line no-unused-vars
  updateSeparator(grid, separatorIndex) {
    throw new Error('Need to override updateSeparator');
  }

  // eslint-disable-next-line no-unused-vars
  getSeparatorIndex(gridPoint, grid, checkAllowResize = true) {
    throw new Error('Need to override getSeparatorIndex');
  }
  // End of overrides

  onDown(gridPoint, grid) {
    const separatorIndex = this.getSeparatorIndex(gridPoint, grid);
    if (separatorIndex != null) {
      const { metrics } = grid;

      this.dragOffset = 0;
      this.draggingIndex = separatorIndex;
      this.resizingItems = [separatorIndex];
      this.hiddenItems = this.getHiddenItems(separatorIndex, metrics).reverse();
      this.targetSizes.clear();

      this.addTargetSize(metrics, separatorIndex);

      this.updateCursor(metrics, separatorIndex);

      this.updateSeparator(grid, separatorIndex);

      return true;
    }
    return false;
  }

  onMove(gridPoint, grid) {
    const separatorIndex = this.getSeparatorIndex(gridPoint, grid);
    if (separatorIndex != null) {
      const { metrics } = grid;
      this.updateCursor(metrics, separatorIndex);
      return true;
    }
    return false;
  }

  onDrag(gridPoint, grid) {
    if (this.draggingIndex == null) {
      return false;
    }

    const point = gridPoint[this.pointProperty];
    const { metricCalculator, metrics } = grid;
    const theme = grid.getTheme();

    const visibleOffsets = metrics[this.visibleOffsetProperty];
    const margin = metrics[this.marginProperty];
    const calculatedSizes = metrics[this.calculatedSizesProperty];
    const modelIndexes = metrics[this.modelIndexesProperty];
    const firstIndex = metrics[this.firstIndexProperty];
    const treePadding = metrics[this.treePaddingProperty];

    // New sizes are batched and applied after the loop to avoid updating state while calculating next step
    const newSizes = new Map();

    // Use a loop as we may need to resize multiple items if they drag quickly
    let resizeIndex = this.resizingItems[this.resizingItems.length - 1];
    while (resizeIndex != null) {
      const itemOffset = visibleOffsets.get(resizeIndex);
      const itemSize = point - margin - itemOffset - this.dragOffset;
      const modelIndex = modelIndexes.get(resizeIndex);
      const targetSize = this.targetSizes.get(modelIndex);
      const isResizingMultiple = this.resizingItems.length > 1;
      const hiddenIndex = this.hiddenItems.indexOf(resizeIndex);
      let calculatedSize = calculatedSizes.get(modelIndex);
      if (resizeIndex === firstIndex) {
        calculatedSize += treePadding;
      }
      let newSize = itemSize;
      if (
        Math.abs(itemSize - calculatedSize) <= theme.headerResizeSnapThreshold
      ) {
        // Snapping behaviour to "natural" width
        newSize = null;
      } else if (
        itemSize > targetSize &&
        ((isResizingMultiple && hiddenIndex !== 0) || hiddenIndex > 0)
      ) {
        newSize = targetSize;
      } else if (itemSize <= theme.headerResizeHiddenSnapThreshold) {
        // Snapping to hidden item
        newSize = 0;
      }

      if (newSize !== calculatedSize) {
        newSizes.set(modelIndex, newSize);
      } else {
        newSizes.set(modelIndex, null);
      }

      if (itemSize < -theme.headerResizeSnapThreshold && newSize === 0) {
        if (hiddenIndex >= 0 && isResizingMultiple) {
          this.resizingItems.pop();
          this.removeTargetSize(metrics, resizeIndex);
          resizeIndex = this.resizingItems[this.resizingItems.length - 1];
          this.dragOffset -= this.targetSizes.get(
            modelIndexes.get(resizeIndex)
          );
        } else {
          resizeIndex = this.getNextShownItem(resizeIndex, metrics);
          if (resizeIndex != null) {
            this.resizingItems.push(resizeIndex);
            this.addTargetSize(metrics, resizeIndex);
          }
        }
      } else if (
        itemSize > targetSize + theme.headerResizeSnapThreshold &&
        newSize === targetSize
      ) {
        if (hiddenIndex > 0) {
          this.dragOffset += newSize;
          resizeIndex = this.hiddenItems[hiddenIndex - 1];
          this.resizingItems.push(resizeIndex);
          this.addTargetSize(metrics, resizeIndex);
        } else if (isResizingMultiple) {
          this.resizingItems.pop();
          this.removeTargetSize(metrics, resizeIndex);
          resizeIndex = this.resizingItems[this.resizingItems.length - 1];
        } else {
          resizeIndex = null;
        }
      } else {
        resizeIndex = null;
      }
    }

    newSizes.forEach((newSize, modelIndex) => {
      this.setSize(metricCalculator, modelIndex, newSize);
    });

    this.updateCursor(metrics, this.draggingIndex);

    return true;
  }

  onUp(_, grid) {
    if (this.draggingIndex != null) {
      this.draggingIndex = null;
      this.resizingItems = [];
      this.hiddenItems = [];
      this.targetSizes.clear();

      this.updateSeparator(grid, null);
    }

    return false;
  }

  onDoubleClick(gridPoint, grid) {
    const separatorIndex = this.getSeparatorIndex(gridPoint, grid);

    if (separatorIndex != null) {
      const { metricCalculator, metrics } = grid;
      const modelIndexes = metrics[this.modelIndexesProperty];
      const modelIndex = modelIndexes.get(separatorIndex);

      this.resetSize(metricCalculator, modelIndex);

      grid.forceUpdate();

      return true;
    }
    return false;
  }

  updateCursor(metrics, itemIndex) {
    const visibleSizes = metrics[this.visibleSizesProperty];
    const itemSize = visibleSizes.get(itemIndex);
    if (itemSize === 0) {
      this.cursor = this.hiddenCursor;
    } else {
      this.cursor = this.defaultCursor;
    }
  }

  addTargetSize(metrics, itemIndex) {
    const modelIndexes = metrics[this.modelIndexesProperty];
    const userSizes = metrics[this.userSizesProperty];
    const calculatedSizes = metrics[this.calculatedSizesProperty];
    const treePadding = itemIndex === 0 ? metrics[this.treePaddingProperty] : 0;

    const modelIndex = modelIndexes.get(itemIndex);
    let targetSize = userSizes.get(modelIndex);
    if (targetSize == null || targetSize === 0) {
      targetSize = calculatedSizes.get(modelIndex) + treePadding;
    }
    this.targetSizes.set(modelIndex, targetSize);
  }

  removeTargetSize(metrics, itemIndex) {
    const modelIndexes = metrics[this.modelIndexesProperty];
    const modelIndex = modelIndexes.get(itemIndex);
    this.targetSizes.delete(modelIndex);
  }
}

export default GridSeparatorMouseHandler;
