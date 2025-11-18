import { renderHook } from '@testing-library/react';
import { Item, Section } from '../shared';
import { type ItemElement } from './itemUtils';
import { useStaticItemInitialScrollPosition } from './useStaticItemInitialScrollPosition';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  expect.hasAssertions();
});

const mockSelectedKey = 'selected.key';

describe('useStaticItemInitialScrollPosition: selectedKey: %s', () => {
  const itemHeight = 32;
  const topOffset = 20;

  const items = {
    empty: [],
    mixed: [<Item key="">Item</Item>, <Section key="">Test</Section>],
    only: [
      <Item key="a">Item</Item>,
      <Item key="b">Item</Item>,
      <Item key="c">Item</Item>,
      <Item key={mockSelectedKey}>Item</Item>,
      <Item key="e">Item</Item>,
    ],
  } satisfies Record<string, ItemElement<unknown>[]>;

  it.each([
    [items.empty, undefined, topOffset],
    [items.mixed, undefined, topOffset],
    [items.only, undefined, topOffset],
    [items.empty, mockSelectedKey, topOffset],
    [items.mixed, mockSelectedKey, topOffset],
    [items.only, mockSelectedKey, topOffset + 3 * itemHeight],
  ])(
    'should return a function that returns the initial scroll position for item only collections: %s, %s',
    async (givenItems, selectedKey, expected) => {
      const { result } = renderHook(() =>
        useStaticItemInitialScrollPosition({
          itemHeight,
          selectedKey,
          topOffset,
          items: givenItems,
        })
      );

      const actual = await result.current();

      expect(actual).toEqual(expected);
    }
  );
});
