import { renderHook } from '@testing-library/react-hooks';
import { HTMLAttributes } from 'react';
import { TestUtils } from '@deephaven/utils';
import useSetAttributesCallback from './useSetAttributesCallback';

beforeEach(() => {
  jest.clearAllMocks();
});

const { asMock, createMockProxy } = TestUtils;

describe('useSetAttributesCallback', () => {
  const divEl = createMockProxy<HTMLDivElement>();
  const selectorEls = [
    createMockProxy<HTMLDivElement>(),
    createMockProxy<HTMLDivElement>(),
  ];

  beforeEach(() => {
    asMock(divEl.querySelectorAll).mockReturnValue(
      selectorEls as unknown as NodeListOf<HTMLDivElement>
    );
  });

  const attributes: HTMLAttributes<HTMLDivElement> = {
    id: 'mock.id',
    title: 'mock.title',
  };

  it.each([null, undefined])(
    'should create a callback that handles null or undefined root element',
    nullOrUndefined => {
      const { result } = renderHook(() => useSetAttributesCallback(attributes));
      result.current(nullOrUndefined);
    }
  );

  it('should create a callback that sets attributes on rootEl if no selectors given', () => {
    const { result } = renderHook(() => useSetAttributesCallback(attributes));

    result.current(divEl);

    Object.entries(attributes).forEach(([key, value]) => {
      expect(divEl.setAttribute).toHaveBeenCalledWith(key, value);
    });
  });

  it('should create a callback that sets attributes on query selector elements', () => {
    const { result } = renderHook(() =>
      useSetAttributesCallback(attributes, 'mock.selectors')
    );

    result.current(divEl);

    expect(divEl.setAttribute).not.toHaveBeenCalled();

    selectorEls.forEach(el => {
      Object.entries(attributes).forEach(([key, value]) => {
        expect(el.setAttribute).toHaveBeenCalledWith(key, value);
      });
    });
  });
});
