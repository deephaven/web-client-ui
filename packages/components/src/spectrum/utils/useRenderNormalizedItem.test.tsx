import React, { Key } from 'react';
import { Item } from '@adobe/react-spectrum';
import { renderHook } from '@testing-library/react-hooks';
import ItemContent from '../ItemContent';
import { useRenderNormalizedItem } from './useRenderNormalizedItem';
import { getItemKey } from './itemUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe.each([null, { placement: 'top' }] as const)(
  'useRenderNormalizedItem: %s',
  tooltipOptions => {
    it.each([
      [{}, 'Empty', ''],
      [{ item: { content: 'mock.content' } }, 'Empty', 'mock.content'],
      [
        { item: { textValue: 'mock.textValue', content: 'mock.content' } },
        'mock.textValue',
        'mock.content',
      ],
    ])(
      'should return a render function that can be used to render a normalized item in collection components.',
      (normalizedItem, textValue, content) => {
        const { result } = renderHook(() =>
          useRenderNormalizedItem(tooltipOptions)
        );

        const actual = result.current(normalizedItem);

        expect(actual).toEqual(
          <Item key={getItemKey(normalizedItem) as Key} textValue={textValue}>
            <ItemContent tooltipOptions={tooltipOptions}>{content}</ItemContent>
          </Item>
        );
      }
    );
  }
);
