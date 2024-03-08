import { createElement } from 'react';
import { Text } from '@adobe/react-spectrum';
import { isElementOfType } from './ElementUtils';

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
});
