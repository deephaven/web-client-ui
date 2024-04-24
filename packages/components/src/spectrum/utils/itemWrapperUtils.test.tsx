import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dh as dhIcons } from '@deephaven/icons';
import { NON_BREAKING_SPACE } from '@deephaven/utils';
import { Icon } from '../icons';
import { ItemContent } from '../ItemContent';
import { Item, Section } from '../shared';
import { Text } from '../Text';
import { ITEM_EMPTY_STRING_TEXT_VALUE } from './itemUtils';
import {
  wrapIcon,
  wrapItemChildren,
  wrapPrimitiveWithText,
} from './itemWrapperUtils';

describe('wrapIcon', () => {
  it.each([
    ['vsAccount', dhIcons.vsAccount],
    ['nonExisting', dhIcons.vsBlank],
    [null, dhIcons.vsBlank],
    [undefined, dhIcons.vsBlank],
  ])('should wrap icon key with Icon: %s', (iconKey, expectedIcon) => {
    const slot = 'illustration';

    const actual = wrapIcon(iconKey, slot);

    expect(actual).toEqual(
      <Icon slot={slot}>
        <FontAwesomeIcon icon={expectedIcon} />
      </Icon>
    );
  });

  it('should return given content if not a string', () => {
    const content = <div>Not a string</div>;
    const slot = 'illustration';

    const actual = wrapIcon(content, slot);

    expect(actual).toBe(content);
  });
});

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
        <Item textValue="">Empty textValue</Item>,
        // eslint-disable-next-line react/jsx-key
        <Item textValue="Item 4">Item 4</Item>,
        <Item key="Item 5" textValue="Item 5">
          Item 5
        </Item>,
        <Item key="Item 6" textValue="Item 6">
          <ItemContent tooltipOptions={tooltipOptions}>Item 6</ItemContent>
        </Item>,
        /* eslint-disable react/jsx-curly-brace-presence */
        <Section key="Section 1">
          {'Section 1 - Item 1'}
          {'Section 1 - Item 2'}
        </Section>,
        /* eslint-enable react/jsx-curly-brace-presence */
        // eslint-disable-next-line react/jsx-key
        <Section title="Section 2">Section 2 - Item 1</Section>,
        // eslint-disable-next-line react/jsx-key
        <Section title={<span>Section 3</span>}>Section 3 - Item 1</Section>,
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
        <Item key="" textValue={ITEM_EMPTY_STRING_TEXT_VALUE}>
          <ItemContent tooltipOptions={tooltipOptions}>
            Empty textValue
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
        <Section key="Section 1">
          <Item key="Section 1 - Item 1" textValue="Section 1 - Item 1">
            <ItemContent tooltipOptions={tooltipOptions}>
              Section 1 - Item 1
            </ItemContent>
          </Item>
          <Item key="Section 1 - Item 2" textValue="Section 1 - Item 2">
            <ItemContent tooltipOptions={tooltipOptions}>
              Section 1 - Item 2
            </ItemContent>
          </Item>
        </Section>,
        <Section key="Section 2" title="Section 2">
          <Item key="Section 2 - Item 1" textValue="Section 2 - Item 1">
            <ItemContent tooltipOptions={tooltipOptions}>
              Section 2 - Item 1
            </ItemContent>
          </Item>
        </Section>,
        // eslint-disable-next-line react/jsx-key
        <Section title={<span>Section 3</span>}>
          <Item key="Section 3 - Item 1" textValue="Section 3 - Item 1">
            <ItemContent tooltipOptions={tooltipOptions}>
              Section 3 - Item 1
            </ItemContent>
          </Item>
        </Section>,
      ];
      const actual = wrapItemChildren(given, tooltipOptions);

      expect(actual).toEqual(expected);

      const actualSingle = wrapItemChildren(given[0], tooltipOptions);
      expect(actualSingle).toEqual(expected[0]);
    });
  }
);

describe('wrapPrimitiveWithText', () => {
  it('should wrap primitive with Text element', () => {
    const content = 'Text content';
    const slot = 'slot';

    const actual = wrapPrimitiveWithText(content, slot);

    expect(actual).toEqual(<Text slot={slot}>{content}</Text>);
  });

  it('should return content if it is not a primitive type', () => {
    const content = <div>Not a primitive</div>;
    const slot = 'slot';

    const actual = wrapPrimitiveWithText(content, slot);

    expect(actual).toEqual(content);
  });
  it.each([null, undefined, ''])(
    'should wrap &nbsp; if given empty content: %s',
    content => {
      const slot = 'slot';

      const actual = wrapPrimitiveWithText(content, slot);

      expect(actual).toEqual(<Text slot={slot}>{NON_BREAKING_SPACE}</Text>);
    }
  );
});
