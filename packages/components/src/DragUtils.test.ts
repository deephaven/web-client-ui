import DragUtils from './DragUtils';

function makeItems(count = 5) {
  const items: number[] = [];

  for (let i = 0; i < count; i += 1) {
    items.push(i);
  }

  return items;
}

describe('single item in single list', () => {
  it('handles dragging item to the next index', () => {
    const items = makeItems();
    DragUtils.reorder(items, [[0, 0]], items, 2);
    expect(items).toEqual([1, 0, 2, 3, 4]);
    DragUtils.reorder(items, [[1, 1]], items, 3);
    expect(items).toEqual([1, 2, 0, 3, 4]);
    DragUtils.reorder(items, [[2, 2]], items, 4);
    expect(items).toEqual([1, 2, 3, 0, 4]);
    DragUtils.reorder(items, [[3, 3]], items, 5);
    expect(items).toEqual([1, 2, 3, 4, 0]);
    DragUtils.reorder(items, [[4, 4]], items, 3);
    expect(items).toEqual([1, 2, 3, 0, 4]);
    DragUtils.reorder(items, [[3, 3]], items, 2);
    expect(items).toEqual([1, 2, 0, 3, 4]);
    DragUtils.reorder(items, [[2, 2]], items, 1);
    expect(items).toEqual([1, 0, 2, 3, 4]);
    DragUtils.reorder(items, [[1, 1]], items, 0);
    expect(items).toEqual([0, 1, 2, 3, 4]);
  });

  it('handles dragging top item to the end', () => {
    const items = makeItems();
    DragUtils.reorder(items, [[0, 0]], items, 5);
    expect(items).toEqual([1, 2, 3, 4, 0]);
  });

  it('handles dragging bottom item to the top', () => {
    const items = makeItems();
    DragUtils.reorder(items, [[4, 4]], items, 0);
    expect(items).toEqual([4, 0, 1, 2, 3]);
  });
});

describe('multi drag in single list', () => {
  it('handles dragging pair to the next index', () => {
    const items = makeItems();
    DragUtils.reorder(items, [[0, 1]], items, 3);
    expect(items).toEqual([2, 0, 1, 3, 4]);
    DragUtils.reorder(items, [[1, 2]], items, 4);
    expect(items).toEqual([2, 3, 0, 1, 4]);
    DragUtils.reorder(items, [[2, 3]], items, 5);
    expect(items).toEqual([2, 3, 4, 0, 1]);
  });

  it('handles dragging non-contiguous ranges', () => {
    const items = makeItems();
    DragUtils.reorder(
      items,
      [
        [0, 0],
        [2, 2],
        [4, 4],
      ],
      items,
      2
    );
    expect(items).toEqual([1, 0, 2, 4, 3]);
  });
});

describe('remove items in list', () => {
  it('handles removing the top item', () => {
    const items = makeItems();
    const removedItems = DragUtils.removeItems(items, [[0, 0]]);
    expect(items).toEqual([1, 2, 3, 4]);
    expect(removedItems).toEqual([0]);
  });

  it('handles removing the bottom item', () => {
    const items = makeItems();
    const removedItems = DragUtils.removeItems(items, [[4, 4]]);
    expect(items).toEqual([0, 1, 2, 3]);
    expect(removedItems).toEqual([4]);
  });

  it('handles removing non-contiguous ranges of items', () => {
    const items = makeItems();
    const removedItems = DragUtils.removeItems(items, [
      [0, 0],
      [2, 3],
    ]);
    expect(items).toEqual([1, 4]);
    expect(removedItems).toEqual([0, 2, 3]);
  });

  it('handles removing all items', () => {
    const items = makeItems();
    const removedItems = DragUtils.removeItems(items, [[0, 4]]);
    expect(items).toEqual([]);
    expect(removedItems).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('adjusting destination index', () => {
  it('does not adjust when all ranges are below', () => {
    expect(DragUtils.adjustDestinationIndex(0, [[1, 1]])).toBe(0);
    expect(
      DragUtils.adjustDestinationIndex(0, [
        [1, 1],
        [3, 3],
      ])
    ).toBe(0);
    expect(DragUtils.adjustDestinationIndex(0, [[1, 5]])).toBe(0);
    expect(DragUtils.adjustDestinationIndex(3, [[5, 5]])).toBe(3);
  });

  it('adjusts up for ranges selected above', () => {
    expect(DragUtils.adjustDestinationIndex(4, [[0, 0]])).toBe(3);
    expect(DragUtils.adjustDestinationIndex(4, [[3, 3]])).toBe(3);
    expect(
      DragUtils.adjustDestinationIndex(4, [
        [0, 0],
        [2, 2],
      ])
    ).toBe(2);
    expect(DragUtils.adjustDestinationIndex(4, [[0, 3]])).toBe(0);
  });

  it('adjusts when ranges are above and below', () => {
    expect(
      DragUtils.adjustDestinationIndex(3, [
        [0, 0],
        [5, 5],
      ])
    ).toBe(2);
    expect(
      DragUtils.adjustDestinationIndex(5, [
        [0, 3],
        [15, 25],
      ])
    ).toBe(1);
  });

  it('adjusts when ranges contain the destination index', () => {
    expect(DragUtils.adjustDestinationIndex(0, [[0, 0]])).toBe(0);
    expect(DragUtils.adjustDestinationIndex(3, [[0, 5]])).toBe(0);
    expect(
      DragUtils.adjustDestinationIndex(5, [
        [0, 0],
        [4, 6],
      ])
    ).toBe(3);
  });
});
