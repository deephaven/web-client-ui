import { createElement } from 'react';
import { ItemElement, Item, Text } from '@deephaven/components';
import { isElementOfType } from './ElementUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('isElementOfType', () => {
  function MockComponent() {
    return null;
  }

  it.each([
    [createElement('div'), 'div', true],
    [createElement('span'), 'div', false],
    ['some string', 'div', false],
    [createElement(Text), Text, true],
    [createElement(Text), 'div', false],
    [createElement(Text), MockComponent, false],
    [createElement(MockComponent), MockComponent, true],
  ])(
    'should return true for a Section element: %s, %s, %s',
    (element, type, expected) => {
      expect(isElementOfType(element, type)).toBe(expected);
    }
  );

  it('should derive the `type` prop', () => {
    const element: ItemElement = createElement(Item);

    if (isElementOfType(element, Item)) {
      // This is a type check that verifies the type guard narrows this to the
      // `Item` function instead of `string | JSXElementConstructor<any>`. This
      // proves that #2094 is working as expected. Namely, the compiler will
      // complain if it thinks `type` could be a string.
      expect(element.type.name).toEqual(Item.name);
    }
  });
});
