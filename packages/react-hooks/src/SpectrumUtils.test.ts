import { KeyedItem, TestUtils } from '@deephaven/utils';
import {
  createValidationProps,
  extractSpectrumHTMLElement,
  extractSpectrumLastChildHTMLElement,
  findSpectrumComboBoxScrollArea,
  findSpectrumPickerScrollArea,
  findSpectrumPopoverScrollArea,
  getPositionOfSelectedItem,
  identityExtractHTMLElement,
  ReactSpectrumComponent,
} from './SpectrumUtils';

const { asMock, createMockProxy } = TestUtils;

describe('createValidationProps', () => {
  const errorMessage = 'mock.errorMessage';

  it('should return empty props if isValid is true', () => {
    expect(createValidationProps(true, errorMessage)).toEqual({});
  });

  it('should return invalid props if isValid is false', () => {
    expect(createValidationProps(false, errorMessage)).toEqual({
      errorMessage,
      validationState: 'invalid',
    });
  });
});

describe('extractSpectrumHTMLElement', () => {
  const mock = {
    element: createMockProxy<HTMLDivElement>(),
    ref: createMockProxy<ReactSpectrumComponent>(),
  };

  beforeEach(() => {
    asMock(mock.ref.UNSAFE_getDOMNode).mockReturnValue(mock.element);
  });

  it('should return null if ref is null', () => {
    expect(extractSpectrumHTMLElement(null)).toBeNull();
  });

  it('should extract the DOM node associated with a React Spectrum component ref', () => {
    expect(extractSpectrumHTMLElement(mock.ref)).toEqual(mock.element);
  });
});

describe('extractSpectrumLastChildHTMLElement', () => {
  const mock = {
    ref: createMockProxy<ReactSpectrumComponent>(),
  };

  it('should return null if ref is null', () => {
    expect(extractSpectrumLastChildHTMLElement(null)).toBeNull();
  });

  it.each([null, createMockProxy<Element>()])(
    'should return null if ref is not an HTMLElement',
    lastElementChild => {
      asMock(mock.ref.UNSAFE_getDOMNode).mockReturnValue(
        createMockProxy<HTMLDivElement>({
          lastElementChild,
        })
      );

      expect(extractSpectrumLastChildHTMLElement(mock.ref)).toBeNull();
    }
  );

  it('should extract the lastElementChild of the DOM node associated with a React Spectrum component ref', () => {
    const lastElementChild = document.createElement('div');

    asMock(mock.ref.UNSAFE_getDOMNode).mockReturnValue(
      createMockProxy<HTMLDivElement>({
        lastElementChild,
      })
    );

    expect(extractSpectrumLastChildHTMLElement(mock.ref)).toEqual(
      lastElementChild
    );
  });
});

describe.each([
  // General popover function
  ['i', findSpectrumPopoverScrollArea],
  ['span', findSpectrumPopoverScrollArea],
  // Specific consumer functions
  ['input', findSpectrumComboBoxScrollArea],
  ['button', findSpectrumPickerScrollArea],
] as const)(
  'findSpectrumPopoverScrollArea: %s, %s',
  (triggerElementType, findPopoverScrollArea) => {
    let el: {
      component: HTMLDivElement;
      trigger: HTMLElement;
      popup: HTMLDivElement;
    };

    beforeEach(() => {
      el = {
        component: document.createElement('div'),
        trigger: document.createElement(triggerElementType),
        popup: document.createElement('div'),
      };

      el.popup.id = 'popup.id';
      el.trigger.setAttribute('aria-controls', el.popup.id);
    });

    afterEach(() => {
      document.body.replaceChildren();
    });

    it.each([
      [0, 0, 0, false],
      [0, 0, 1, false],
      [0, 1, 0, false],
      [0, 1, 1, false],
      [1, 0, 0, false],
      [1, 0, 1, false],
      [1, 1, 0, false],
      [1, 1, 1, true],
    ])(
      'should find `aria-controls` element of trigger element',
      (hasRef, hasTrigger, hasPopup, shouldFind) => {
        const ref = hasRef
          ? createMockProxy<ReactSpectrumComponent>({
              UNSAFE_getDOMNode: () => el.component,
            })
          : null;

        if (hasTrigger) {
          el.component.appendChild(el.trigger);
        }

        if (hasPopup) {
          document.body.appendChild(el.popup);
        }

        const actual = findPopoverScrollArea(ref, triggerElementType);

        if (shouldFind) {
          expect(actual).toBe(el.popup);
        } else {
          expect(actual).toBeNull();
        }
      }
    );
  }
);

describe('getPositionOfSelectedItem', () => {
  const keyedItems: KeyedItem<{ key?: string; content: string }, string>[] = [
    { key: 'top-level-key-1', item: { key: 'key-1', content: '1' } },
    { key: 'top-level-key-2', item: { key: 'key-2', content: '2' } },
    { key: 'top-level-key-3', item: { key: 'key-3', content: '3' } },
    { key: 'top-level-key-4', item: { content: '4' } },
  ];

  const itemHeight = 8;
  const topOffset = 2;

  it.each([
    ['top-level-key-2', 0],
    ['key-2', 1],
    ['key-3', 2],
    ['key-4', 0],
    ['top-level-key-4', 3],
  ])(
    'should find the position of the selected item: %s, %s',
    async (selectedKey, expectedIndex) => {
      const actual = await getPositionOfSelectedItem({
        keyedItems,
        itemHeight,
        selectedKey,
        topOffset,
      });

      const expected = itemHeight * expectedIndex + topOffset;

      expect(actual).toBe(expected);
    }
  );
});

describe('identityExtractHTMLElement', () => {
  it.each([null, createMockProxy<Element>()])(
    'should return null if given object is not an HTMLElement',
    notHTMLElement => {
      expect(identityExtractHTMLElement(notHTMLElement)).toBeNull();
    }
  );

  it('should return given object if it is an HTMLElement', () => {
    const element = document.createElement('div');
    expect(identityExtractHTMLElement(element)).toBe(element);
  });
});
