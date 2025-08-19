import { act, renderHook } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import type { PostMessage } from '@deephaven/utils';
import { useExternalTheme } from './useExternalTheme';
import {
  isExternalThemeEnabled,
  parseExternalThemeData,
  requestExternalThemeData,
} from './ThemeUtils';
import { MSG_REQUEST_SET_THEME, type ExternalThemeData } from './ThemeModel';

jest.mock('./ThemeUtils', () => ({
  ...jest.requireActual('./ThemeUtils'),
  isExternalThemeEnabled: jest.fn(),
  requestExternalThemeData: jest.fn(),
}));

const { asMock, findWindowEventHandlers, setupWindowParentMock } = TestUtils;

const mockExternalThemeData: ExternalThemeData = {
  name: 'Mock External Theme',
  cssVars: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  afterEachCallback = setupWindowParentMock('parent');

  jest.spyOn(window, 'addEventListener').mockName('addEventListener');
  jest.spyOn(window, 'removeEventListener').mockName('removeEventListener');
});

let afterEachCallback: (() => void) | null = null;
afterEach(() => {
  afterEachCallback?.();
  afterEachCallback = null;
});

it.each([
  ['parent', true, window],
  ['current', true, window.parent],
  ['parent', false, window],
  ['current', false, window.parent],
])(
  'should handle theme requests from %s Window if enabled: isEnabled=%s',
  async (_label, isEnabled, source) => {
    asMock(isExternalThemeEnabled).mockReturnValue(isEnabled);
    asMock(requestExternalThemeData).mockResolvedValue(mockExternalThemeData);

    const { result, unmount, waitForNextUpdate } = renderHook(() =>
      useExternalTheme()
    );

    expect(result.current.isPending).toEqual(isEnabled);

    if (!isEnabled) {
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
      expect(result.current).toEqual({
        isEnabled: false,
        isPending: false,
      });
      return;
    }

    await waitForNextUpdate();

    const messageHandlers = findWindowEventHandlers('message');
    expect(messageHandlers).toHaveLength(1);

    const messageHandler = messageHandlers[0];

    act(() => {
      messageHandler({
        data: {
          message: MSG_REQUEST_SET_THEME,
          payload: mockExternalThemeData,
        },
        source,
      } as MessageEvent<PostMessage<unknown>>);
    });

    expect(result.current).toEqual({
      isEnabled: true,
      isPending: false,
      themeData: parseExternalThemeData(mockExternalThemeData),
    });

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      messageHandler
    );
  }
);

it.each([
  [true, mockExternalThemeData],
  [false, mockExternalThemeData],
  [true, new Error('Mock Error')],
  [false, new Error('Mock Error')],
])(
  'should request external theme if enabled: isEnabled=%s, externalThemeDataOrError=%s',
  async (isEnabled, externalThemeDataOrError) => {
    asMock(isExternalThemeEnabled).mockReturnValue(isEnabled);

    if (externalThemeDataOrError instanceof Error) {
      asMock(requestExternalThemeData).mockRejectedValue(
        externalThemeDataOrError
      );
    } else {
      asMock(requestExternalThemeData).mockResolvedValue(
        externalThemeDataOrError
      );
    }

    const { result, waitForNextUpdate } = renderHook(() => useExternalTheme());

    expect(result.current.isPending).toEqual(isEnabled);

    if (!isEnabled) {
      expect(requestExternalThemeData).not.toHaveBeenCalled();
      return;
    }

    await waitForNextUpdate();
    expect(requestExternalThemeData).toHaveBeenCalled();

    if (externalThemeDataOrError instanceof Error) {
      expect(result.current).toEqual({
        isEnabled: true,
        isPending: false,
      });
    } else {
      expect(result.current).toEqual({
        isEnabled: true,
        isPending: false,
        themeData: parseExternalThemeData(externalThemeDataOrError),
      });
    }
  }
);
