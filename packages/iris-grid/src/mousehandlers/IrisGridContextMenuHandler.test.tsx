import { GridRange } from '@deephaven/grid';
import IrisGridContextMenuHandler from './IrisGridContextMenuHandler';

describe('getLatestSelection', () => {
  it('should return the original selection if the clicked cell is within the original selection', () => {
    const originalSelection = [new GridRange(1, 1, 2, 2)];
    const result = IrisGridContextMenuHandler.getLatestSelection(
      originalSelection,
      1,
      1
    );

    expect(result).toBe(originalSelection);
  });

  it('should return a new selection with the clicked cell if it is outside the original selection', () => {
    const originalSelection = [new GridRange(1, 1, 2, 2)];
    const columnIndex = 3;
    const rowIndex = 3;

    const result = IrisGridContextMenuHandler.getLatestSelection(
      originalSelection,
      columnIndex,
      rowIndex
    );

    expect(result).toEqual([GridRange.makeCell(columnIndex, rowIndex)]);
  });

  it('should return the original selection if columnIndex is null', () => {
    const originalSelection = [new GridRange(1, 1, 2, 2)];

    const result = IrisGridContextMenuHandler.getLatestSelection(
      originalSelection,
      null,
      1
    );

    expect(result).toBe(originalSelection);
  });

  it('should return the original selection if rowIndex is null', () => {
    const originalSelection = [new GridRange(1, 1, 2, 2)];

    const result = IrisGridContextMenuHandler.getLatestSelection(
      originalSelection,
      null,
      1
    );

    expect(result).toBe(originalSelection);
  });
});
