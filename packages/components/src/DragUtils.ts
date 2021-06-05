import flatten from 'lodash.flatten';

type Range = [number, number];

class DragUtils {
  /**
   * Re-orders the provided item lists in place based on the selectedRanges and destinationIndex provided
   * @param sourceList Array of the source items
   * @param selectedRanges Array of the selected ranges in the source list
   * @param destinationList Destination items. If dragging within the same list, set it to sourceItems
   * @param destinationIndex The index items are being dropped in the destinationList, adjusted for the removed items
   * @returns The items that were dragged
   */
  static reorder<T>(
    sourceList: T[],
    selectedRanges: Range[],
    destinationList: T[],
    destinationIndex: number
  ): T[] {
    const insertIndex =
      sourceList === destinationList
        ? DragUtils.adjustDestinationIndex(destinationIndex, selectedRanges)
        : destinationIndex;
    const draggedItems = DragUtils.removeItems(sourceList, selectedRanges);
    destinationList.splice(insertIndex, 0, ...draggedItems);
    return draggedItems;
  }

  /**
   * Removes the provided ranges from the list in place
   * @param list Array of items to remove the ranges.
   * @param ranges Array of the ranges to remove.
   * @returns The removed items, in the order of the ranges removed.
   */
  static removeItems<T>(list: T[], ranges: Range[]): T[] {
    const items = [];

    // Sort them in reverse, so we don't screw up the range indexes
    const sortedRanges = ranges
      .map((range, index) => ({ range, index }))
      .sort((a, b) => b.range[0] - a.range[0]);
    for (let i = 0; i < sortedRanges.length; i += 1) {
      const { range, index } = sortedRanges[i];
      const [start, end] = range;
      items[index] = list.splice(start, end - start + 1);
    }

    return flatten(items);
  }

  /**
   * Adjusts the destination index for when dropping into the same list you're dragging from.
   * @param destinationIndex The original destination index
   * @param ranges The ranges that are moving
   * @returns Index where item should be inserted after all ranges are removed
   */
  static adjustDestinationIndex(
    destinationIndex: number,
    ranges: Range[]
  ): number {
    let adjustedIndex = destinationIndex;
    for (let i = 0; i < ranges.length; i += 1) {
      const [start, end] = ranges[i];
      if (start > destinationIndex) {
        break;
      }

      adjustedIndex -= Math.min(end, destinationIndex - 1) - start + 1;
    }
    return adjustedIndex;
  }

  static startDragging(): void {
    document.documentElement.classList.add('drag-pointer-events-none');
  }

  static stopDragging(): void {
    document.documentElement.classList.remove('drag-pointer-events-none');
  }
}

export default DragUtils;
