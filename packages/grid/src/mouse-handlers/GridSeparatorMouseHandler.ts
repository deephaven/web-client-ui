import { getOrThrow } from '@deephaven/utils';
import type Grid from '../Grid';
import type { GridMetricCalculator } from '../GridMetricCalculator';
import type GridModel from '../GridModel';
import { EventHandlerResult } from '../EventHandlerResult';
import GridMouseHandler from '../GridMouseHandler';
import {
  GridTheme,
  PointProperty,
  UserSizeProperty,
  VisibleOffsetProperty,
  VisibleSizeProperty,
  MarginProperty,
  CalculatedSizeProperty,
  InitialSizeProperty,
  ModelIndexesProperty,
  FirstIndexProperty,
  TreePaddingProperty,
  GridSeparator,
  GridMetrics,
  ModelIndex,
  VisibleIndex,
  GridPoint,
} from '../GridTypes';

/**
 * Abstract class that should be extended for column/row behaviour
 * Override the necessary functions/properties
 */
abstract class GridSeparatorMouseHandler extends GridMouseHandler {
  // The index where dragging the column separator started
  protected draggingIndex?: VisibleIndex;

  // The columns in the order they're being resized
  protected resizingItems: VisibleIndex[] = [];

  // Columns that were hidden under the separator when starting a drag
  protected hiddenItems: VisibleIndex[] = [];

  // The target width of the columns being resized
  protected targetSizes: Map<ModelIndex, number> = new Map();

  protected dragOffset = 0;

  // Override/Implement these properties/functions
  abstract hiddenCursor: string;

  abstract defaultCursor: string;

  abstract pointProperty: PointProperty;

  abstract userSizesProperty: UserSizeProperty;

  abstract visibleOffsetProperty: VisibleOffsetProperty;

  abstract visibleSizesProperty: VisibleSizeProperty;

  abstract marginProperty: MarginProperty;

  abstract calculatedSizesProperty: CalculatedSizeProperty;

  abstract initialSizesProperty: InitialSizeProperty;

  abstract modelIndexesProperty: ModelIndexesProperty;

  abstract firstIndexProperty: FirstIndexProperty;

  abstract treePaddingProperty: TreePaddingProperty;

  abstract getHiddenItems(
    itemIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex[];

  abstract getNextShownItem(
    itemIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex | null;

  abstract setSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex,
    size: number
  ): void;

  abstract resetSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex
  ): void;

  abstract updateSeparator(grid: Grid, separator: GridSeparator | null): void;

  abstract getSeparator(
    gridPoint: GridPoint,
    metrics: GridMetrics,
    model: GridModel,
    theme: GridTheme
  ): GridSeparator | null;
  // End of overrides

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics } = grid;
    const { model } = grid.props;
    const theme = grid.getTheme();
    if (!metrics) throw new Error('metrics not set');

    const separator = this.getSeparator(gridPoint, metrics, model, theme);
    if (separator != null) {
      const separatorIndex = separator.index;

      this.dragOffset = 0;
      this.draggingIndex = separatorIndex;
      this.resizingItems = [separatorIndex];
      this.hiddenItems = this.getHiddenItems(separatorIndex, metrics).reverse();
      this.targetSizes.clear();

      this.addTargetSize(metrics, separatorIndex);

      this.updateCursor(metrics, separatorIndex);

      this.updateSeparator(grid, separator);

      return true;
    }
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics } = grid;
    const { model } = grid.props;
    const theme = grid.getTheme();
    if (!metrics) throw new Error('metrics not set');

    const separator = this.getSeparator(gridPoint, metrics, model, theme);

    if (separator != null) {
      this.updateCursor(metrics, separator.index);
      return true;
    }
    return false;
  }

  onDrag(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.draggingIndex == null) {
      return false;
    }

    const point = gridPoint[this.pointProperty];
    const { metricCalculator, metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const theme = grid.getTheme();

    const visibleOffsets = metrics[this.visibleOffsetProperty];
    const margin = metrics[this.marginProperty];
    const calculatedSizes = metrics[this.calculatedSizesProperty];
    const modelIndexes = metrics[this.modelIndexesProperty];
    const firstIndex = metrics[this.firstIndexProperty];
    const treePadding = metrics[this.treePaddingProperty];

    // New sizes are batched and applied after the loop to avoid updating state while calculating next step
    const newSizes: Map<ModelIndex, number> = new Map();

    // Use a loop as we may need to resize multiple items if they drag quickly
    let resizeIndex: number | null = this.resizingItems[
      this.resizingItems.length - 1
    ];
    while (resizeIndex != null) {
      const itemOffset = getOrThrow(visibleOffsets, resizeIndex);
      const itemSize = point - margin - itemOffset - this.dragOffset;
      const modelIndex = getOrThrow(modelIndexes, resizeIndex);
      const targetSize = this.targetSizes.get(modelIndex);
      const isResizingMultiple = this.resizingItems.length > 1;
      const hiddenIndex = this.hiddenItems.indexOf(resizeIndex);
      let calculatedSize = getOrThrow(calculatedSizes, modelIndex);
      if (resizeIndex === firstIndex) {
        calculatedSize += treePadding;
      }
      let newSize = itemSize;
      if (
        Math.abs(itemSize - calculatedSize) <= theme.headerResizeSnapThreshold
      ) {
        // Snapping behaviour to "natural" width
        newSize = calculatedSize;
      } else if (
        targetSize !== undefined &&
        itemSize > targetSize &&
        ((isResizingMultiple && hiddenIndex !== 0) || hiddenIndex > 0)
      ) {
        newSize = targetSize;
      } else if (itemSize <= theme.headerResizeHiddenSnapThreshold) {
        // Snapping to hidden item
        newSize = 0;
      }

      newSizes.set(modelIndex, newSize);

      if (itemSize < -theme.headerResizeSnapThreshold && newSize === 0) {
        if (hiddenIndex >= 0 && isResizingMultiple) {
          this.resizingItems.pop();
          this.removeTargetSize(metrics, resizeIndex);
          resizeIndex = this.resizingItems[this.resizingItems.length - 1];
          this.dragOffset -=
            this.targetSizes.get(getOrThrow(modelIndexes, resizeIndex)) ?? 0;
        } else {
          resizeIndex = this.getNextShownItem(resizeIndex, metrics);
          if (resizeIndex !== null) {
            this.resizingItems.push(resizeIndex);
            this.addTargetSize(metrics, resizeIndex);
          }
        }
      } else if (
        targetSize !== undefined &&
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
      const defaultSize =
        metricCalculator[this.initialSizesProperty].get(modelIndex) ??
        calculatedSizes.get(modelIndex);

      if (newSize === defaultSize) {
        this.resetSize(metricCalculator, modelIndex);
      } else {
        this.setSize(metricCalculator, modelIndex, newSize);
      }
    });

    this.updateCursor(metrics, this.draggingIndex);

    return true;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.draggingIndex != null) {
      this.draggingIndex = undefined;
      this.resizingItems = [];
      this.hiddenItems = [];
      this.targetSizes.clear();

      this.updateSeparator(grid, null);
    }

    return false;
  }

  onDoubleClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics, metricCalculator } = grid;
    const { model } = grid.props;
    const theme = grid.getTheme();
    if (!metrics) throw new Error('metrics not set');

    const separator = this.getSeparator(gridPoint, metrics, model, theme);

    if (separator != null) {
      const modelIndexes = metrics[this.modelIndexesProperty];
      const modelIndex = getOrThrow(modelIndexes, separator.index);

      const calculatedSize = getOrThrow(
        metrics[this.calculatedSizesProperty],
        modelIndex
      );
      const defaultSize = metricCalculator[this.initialSizesProperty].get(
        modelIndex
      );

      if (calculatedSize === defaultSize) {
        this.resetSize(metricCalculator, modelIndex);
      } else {
        this.setSize(metricCalculator, modelIndex, calculatedSize);
      }

      grid.forceUpdate();

      return true;
    }
    return false;
  }

  updateCursor(metrics: GridMetrics, itemIndex: VisibleIndex): void {
    const visibleSizes = metrics[this.visibleSizesProperty];
    const itemSize = getOrThrow(visibleSizes, itemIndex);
    if (itemSize === 0) {
      this.cursor = this.hiddenCursor;
    } else {
      this.cursor = this.defaultCursor;
    }
  }

  addTargetSize(metrics: GridMetrics, itemIndex: VisibleIndex): void {
    const modelIndexes = metrics[this.modelIndexesProperty];
    const userSizes = metrics[this.userSizesProperty];
    const calculatedSizes = metrics[this.calculatedSizesProperty];
    const treePadding = itemIndex === 0 ? metrics[this.treePaddingProperty] : 0;

    const modelIndex = getOrThrow(modelIndexes, itemIndex);
    let targetSize = userSizes.get(modelIndex);
    if (targetSize == null || targetSize === 0) {
      targetSize = getOrThrow(calculatedSizes, modelIndex) + treePadding;
    }
    this.targetSizes.set(modelIndex, targetSize);
  }

  removeTargetSize(metrics: GridMetrics, itemIndex: VisibleIndex): void {
    const modelIndexes = metrics[this.modelIndexesProperty];
    const modelIndex = getOrThrow(modelIndexes, itemIndex);
    this.targetSizes.delete(modelIndex);
  }
}

export default GridSeparatorMouseHandler;
