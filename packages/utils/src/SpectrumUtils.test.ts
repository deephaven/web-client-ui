import {
  createValidationProps,
  extractSpectrumHTMLElement,
  extractSpectrumLastChildHTMLElement,
  identityExtractHTMLElement,
  ReactSpectrumComponent,
} from './SpectrumUtils';
import TestUtils from './TestUtils';

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
