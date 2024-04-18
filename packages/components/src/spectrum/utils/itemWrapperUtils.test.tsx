import React from 'react';
import { ItemContent } from '../ItemContent';
import { Item } from '../shared';
import { ITEM_EMPTY_STRING_TEXT_VALUE } from './itemUtils';
import { wrapItemChildren } from './itemWrapperUtils';

describe.each([null, { placement: 'top' }] as const)(
  'wrapItemChildren: %s',
  tooltipOptions => {
    it('should wrap primitives with Item elements', () => {
      const given = [
        'Item 1',
        2,
        'Item 3',
        '',
        // eslint-disable-next-line react/jsx-key
        <Item textValue="Item 4">Item 4</Item>,
        <Item key="Item 5" textValue="Item 5">
          Item 5
        </Item>,
        <Item key="Item 6" textValue="Item 6">
          <ItemContent tooltipOptions={tooltipOptions}>Item 6</ItemContent>
        </Item>,
      ];

      const expected = [
        <Item key="Item 1" textValue="Item 1">
          <ItemContent tooltipOptions={tooltipOptions}>Item 1</ItemContent>
        </Item>,
        <Item key="2" textValue="2">
          <ItemContent tooltipOptions={tooltipOptions}>2</ItemContent>
        </Item>,
        <Item key="Item 3" textValue="Item 3">
          <ItemContent tooltipOptions={tooltipOptions}>Item 3</ItemContent>
        </Item>,
        <Item key="" textValue={ITEM_EMPTY_STRING_TEXT_VALUE}>
          <ItemContent tooltipOptions={tooltipOptions}>
            {/* eslint-disable react/jsx-curly-brace-presence */}
            {''}
          </ItemContent>
        </Item>,
        <Item key="Item 4" textValue="Item 4">
          <ItemContent tooltipOptions={tooltipOptions}>Item 4</ItemContent>
        </Item>,
        <Item key="Item 5" textValue="Item 5">
          <ItemContent tooltipOptions={tooltipOptions}>Item 5</ItemContent>
        </Item>,
        <Item key="Item 6" textValue="Item 6">
          <ItemContent tooltipOptions={tooltipOptions}>Item 6</ItemContent>
        </Item>,
      ];

      const actual = wrapItemChildren(given, tooltipOptions);

      expect(actual).toEqual(expected);
    });
  }
);
