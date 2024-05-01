import React, { Key } from 'react';
import { Item } from '@adobe/react-spectrum';
import { renderHook } from '@testing-library/react-hooks';
import { isElementOfType } from '@deephaven/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { ItemContent } from '../ItemContent';
import { useRenderNormalizedItem } from './useRenderNormalizedItem';
import { getItemKey, NormalizedItem } from './itemUtils';
import { wrapIcon, wrapPrimitiveWithText } from './itemWrapperUtils';
import { ListActionGroup } from '../ListActionGroup';
import { ActionGroup } from '../ActionGroup';

jest.mock('./itemWrapperUtils');

const { asMock } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const onAction = jest.fn();
const onChange = jest.fn();

const listActionGroup = (
  <ListActionGroup onAction={onAction} onChange={onChange}>
    <Item>Item 1</Item>
  </ListActionGroup>
);

describe.each([
  [true, true, null, undefined],
  [true, true, { placement: 'top' }, undefined],
  [true, false, null, undefined],
  [true, false, { placement: 'top' }, undefined],
  [false, true, null, undefined],
  [false, true, { placement: 'top' }, undefined],
  [false, false, null, undefined],
  [false, false, { placement: 'top' }, undefined],
  // ListActionGroup
  [true, true, null, listActionGroup],
  [true, true, { placement: 'top' }, listActionGroup],
  [true, false, null, listActionGroup],
  [true, false, { placement: 'top' }, listActionGroup],
  [false, true, null, listActionGroup],
  [false, true, { placement: 'top' }, listActionGroup],
  [false, false, null, listActionGroup],
  [false, false, { placement: 'top' }, listActionGroup],
] as const)(
  'useRenderNormalizedItem: %s, %s, %s',
  (showItemIcons, showItemDescriptions, tooltipOptions, actions) => {
    beforeEach(() => {
      asMock(onAction).mockName('onAction');
      asMock(onChange).mockName('onChange');
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
      'should return a render function that can be used to render a normalized item in collection components: %s, %s, %s, %s, %s',
      (normalizedItem, textValue, icon, content, description) => {
        const { result } = renderHook(() =>
          useRenderNormalizedItem({
            itemIconSlot: 'illustration',
            showItemDescriptions,
            showItemIcons,
            tooltipOptions,
            actions,
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

        const itemKey = getItemKey(normalizedItem) as Key;

        expect(actual).toEqual(
          <Item key={itemKey} textValue={textValue}>
            <ItemContent tooltipOptions={tooltipOptions}>
              {showItemIcons ? icon : null}
              {content}
              {showItemDescriptions ? description : null}
              {actions === listActionGroup ? (
                <ActionGroup
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...listActionGroup.props}
                  onAction={expect.any(Function)}
                  onChange={expect.any(Function)}
                />
              ) : null}
            </ItemContent>
          </Item>
        );

        if (actions === listActionGroup) {
          const actionGroup = actual.props.children.props.children[3];
          expect(isElementOfType(actionGroup, ActionGroup)).toBe(true);

          const actionKey = 'actionKey';
          actionGroup.props.onAction(actionKey);
          expect(onAction).toHaveBeenCalledWith(actionKey, itemKey);

          const actionKeys = ['actionKey1', 'actionKey2'];
          actionGroup.props.onChange(actionKeys);
          expect(onChange).toHaveBeenCalledWith(actionKeys, itemKey);
        }
      }
    );
  }
);
