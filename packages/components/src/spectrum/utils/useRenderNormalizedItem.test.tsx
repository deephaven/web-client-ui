import React, { Key } from 'react';
import { Item } from '@adobe/react-spectrum';
import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { ItemContent } from '../ItemContent';
import { useRenderNormalizedItem } from './useRenderNormalizedItem';
import { getItemKey, NormalizedItem } from './itemUtils';
import { wrapIcon, wrapPrimitiveWithText } from './itemWrapperUtils';

jest.mock('./itemWrapperUtils');

const { asMock } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe.each([
  [true, true, null],
  [true, true, { placement: 'top' }],
  [true, false, null],
  [true, false, { placement: 'top' }],
  [false, true, null],
  [false, true, { placement: 'top' }],
  [false, false, null],
  [false, false, { placement: 'top' }],
] as const)(
  'useRenderNormalizedItem: %s, %s, %s',
  (showItemIcons, showItemDescriptions, tooltipOptions) => {
    beforeEach(() => {
      asMock(wrapIcon).mockImplementation((a, b) => `wrapIcon(${a}, ${b})`);
      asMock(wrapPrimitiveWithText).mockImplementation(
        (a, b) => `wrapPrimitiveWithText(${a}, ${b})`
      );
    });

    it.each([
      [
        { key: 'mock.key', textValue: undefined },
        'Empty',
        'wrapIcon(undefined, illustration)',
        'wrapPrimitiveWithText(undefined, undefined)',
        'wrapPrimitiveWithText(undefined, description)',
      ],
      [
        {
          key: 'mock.key',
          item: { content: 'mock.content', textValue: undefined },
        },
        'Empty',
        'wrapIcon(undefined, illustration)',
        'wrapPrimitiveWithText(mock.content, undefined)',
        'wrapPrimitiveWithText(undefined, description)',
      ],
      [
        {
          key: 'mock.key',
          item: { textValue: 'mock.textValue', content: 'mock.content' },
        },
        'mock.textValue',
        'wrapIcon(undefined, illustration)',
        'wrapPrimitiveWithText(mock.content, undefined)',
        'wrapPrimitiveWithText(undefined, description)',
      ],
      [
        {
          key: 'mock.key',
          item: {
            textValue: 'mock.textValue',
            icon: 'mock.icon',
            content: 'mock.content',
            description: 'mock.description',
          },
        },
        'mock.textValue',
        'wrapIcon(mock.icon, illustration)',
        'wrapPrimitiveWithText(mock.content, undefined)',
        'wrapPrimitiveWithText(mock.description, description)',
      ],
    ] as [NormalizedItem, string, string, string, string][])(
      'should return a render function that can be used to render a normalized item in collection components.',
      (normalizedItem, textValue, icon, content, description) => {
        const { result } = renderHook(() =>
          useRenderNormalizedItem({
            itemIconSlot: 'illustration',
            showItemDescriptions,
            showItemIcons,
            tooltipOptions,
          })
        );

        const actual = result.current(normalizedItem);

        if (showItemIcons) {
          expect(wrapIcon).toHaveBeenCalledWith(
            normalizedItem.item?.icon,
            'illustration'
          );
        }

        if (showItemDescriptions) {
          expect(wrapPrimitiveWithText).toHaveBeenCalledWith(
            normalizedItem.item?.description,
            'description'
          );
        }

        expect(actual).toEqual(
          <Item key={getItemKey(normalizedItem) as Key} textValue={textValue}>
            <ItemContent tooltipOptions={tooltipOptions}>
              {showItemIcons ? icon : null}
              {content}
              {showItemDescriptions ? description : null}
            </ItemContent>
          </Item>
        );
      }
    );
  }
);
