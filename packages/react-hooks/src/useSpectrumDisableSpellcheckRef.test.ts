import { renderHook } from '@testing-library/react-hooks';
import { DOMRefValue } from '@react-types/shared';
import { TestUtils } from '@deephaven/test-utils';
import useSetAttributesCallback from './useSetAttributesCallback';
import {
  SPELLCHECK_FALSE_ATTRIBUTE,
  useSpectrumDisableSpellcheckRef,
} from './useSpectrumDisableSpellcheckRef';

jest.mock('./useSetAttributesCallback');

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const { asMock, createMockProxy } = TestUtils;

describe('useSpectrumDisableSpellcheckRef', () => {
  const mock = {
    useSetAttributesCallbackResult: jest.fn(),
    selectors: 'mock.selectors',
    ref: createMockProxy<DOMRefValue>(),
    rootEl: createMockProxy<HTMLDivElement>(),
  };

  beforeEach(() => {
    asMock(useSetAttributesCallback)
      .mockName('useSetAttributesCallback')
      .mockReturnValue(mock.useSetAttributesCallbackResult);

    asMock(mock.ref.UNSAFE_getDOMNode).mockReturnValue(mock.rootEl);
  });

  it('should set spellCheck:false on elements matching `selectors`', () => {
    const { result } = renderHook(() =>
      useSpectrumDisableSpellcheckRef(mock.selectors)
    );

    result.current(mock.ref);

    expect(useSetAttributesCallback).toHaveBeenCalledWith(
      SPELLCHECK_FALSE_ATTRIBUTE,
      mock.selectors
    );
    expect(mock.useSetAttributesCallbackResult).toHaveBeenCalledWith(
      mock.rootEl
    );
  });
});
