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
import { ListActionMenu } from '../ListActionMenu';
import ActionMenu from '../ActionMenu';

jest.mock('./itemWrapperUtils');

const { asMock } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const onAction = jest.fn();
const onChange = jest.fn();
const onOpenChange = jest.fn();

const listActionGroup = (
  <ListActionGroup onAction={onAction} onChange={onChange}>
    <Item>Item 1</Item>
  </ListActionGroup>
);

const listActionMenu = (
  <ListActionMenu onAction={onAction} onOpenChange={onOpenChange}>
    <Item>Item 1</Item>
  </ListActionMenu>
);

const expectedActions = new Map([
  [undefined, null],
  [
    listActionGroup,
    // eslint-disable-next-line react/jsx-key
    <ActionGroup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...listActionGroup.props}
      onAction={expect.any(Function)}
      onChange={expect.any(Function)}
    />,
  ],
  [
    listActionMenu,
    // eslint-disable-next-line react/jsx-key
    <ActionMenu
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...listActionMenu.props}
      onAction={expect.any(Function)}
      onOpenChange={expect.any(Function)}
    />,
  ],
]);

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
  // ListActionMenu
  [true, true, null, listActionMenu],
  [true, true, { placement: 'top' }, listActionMenu],
  [true, false, null, listActionMenu],
  [true, false, { placement: 'top' }, listActionMenu],
  [false, true, null, listActionMenu],
  [false, true, { placement: 'top' }, listActionMenu],
  [false, false, null, listActionMenu],
  [false, false, { placement: 'top' }, listActionMenu],
] as const)(
  'useRenderNormalizedItem: %s, %s, %s',
  (showItemIcons, showItemDescriptions, tooltipOptions, actions) => {
    beforeEach(() => {
      asMock(onAction).mockName('onAction');
      asMock(onChange).mockName('onChange');
      asMock(onOpenChange).mockName('onOpenChange');

      asMock(wrapIcon).mockImplementation((a, b) => `wrapIcon(${a}, ${b})`);
      asMock(wrapPrimitiveWithText).mockImplementation(
        (a, b) => `wrapPrimitiveWithText(${a}, ${b})`
      );
    });

    it.each([
      [
        { key: 'mock.key', textValue: undefined },
        'mock.key',
        'wrapIcon(undefined, illustration)',
        'wrapPrimitiveWithText(undefined, undefined)',
        'wrapPrimitiveWithText(undefined, description)',
      ],
      [
        {
          key: 'mock.key',
          item: { content: 'mock.content', textValue: undefined },
        },
        'mock.key',
        'wrapIcon(undefined, illustration)',
        'wrapPrimitiveWithText(mock.content, undefined)',
        'wrapPrimitiveWithText(undefined, description)',
      ],
      [
        {
          key: 'mock.key',
          item: { content: 'mock.content', textValue: '' },
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
          key: '',
          item: {
            textValue: undefined,
            icon: 'mock.icon',
            content: 'mock.content',
            description: 'mock.description',
          },
        },
        'Empty',
        'wrapIcon(mock.icon, illustration)',
        'wrapPrimitiveWithText(mock.content, undefined)',
        'wrapPrimitiveWithText(mock.description, description)',
      ],
      [
        {
          key: undefined,
          item: {
            textValue: undefined,
            icon: 'mock.icon',
            content: 'mock.content',
            description: 'mock.description',
          },
        },
        undefined,
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
              {expectedActions.get(actions)}
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
        } else if (actions === listActionMenu) {
          const actionMenu = actual.props.children.props.children[3];
          expect(isElementOfType(actionMenu, ActionMenu)).toBe(true);

          const actionKey = 'actionKey';
          actionMenu.props.onAction(actionKey);
          expect(onAction).toHaveBeenCalledWith(actionKey, itemKey);

          const isOpen = true;
          actionMenu.props.onOpenChange(isOpen);
          expect(onOpenChange).toHaveBeenCalledWith(isOpen, itemKey);
        }
      }
    );
  }
);
