import { act, renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import type { PostMessage } from '@deephaven/utils';
import { useParentWindowTheme } from './useParentWindowTheme';
import {
  isParentThemeEnabled,
  parseParentThemeData,
  requestParentThemeData,
} from './ThemeUtils';
import { MSG_REQUEST_SET_THEME, type ParentThemeData } from './ThemeModel';

jest.mock('./ThemeUtils', () => ({
  ...jest.requireActual('./ThemeUtils'),
  isParentThemeEnabled: jest.fn(),
  requestParentThemeData: jest.fn(),
}));

const { asMock, findWindowEventHandlers, setupWindowParentMock } = TestUtils;

const mockParentThemeData: ParentThemeData = {
  name: 'Mock Parent Theme',
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
    asMock(isParentThemeEnabled).mockReturnValue(isEnabled);
    asMock(requestParentThemeData).mockResolvedValue(mockParentThemeData);

    const { result, unmount, waitForNextUpdate } = renderHook(() =>
      useParentWindowTheme()
    );

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
          payload: mockParentThemeData,
        },
        source,
      } as MessageEvent<PostMessage<unknown>>);
    });

    expect(result.current).toEqual({
      isEnabled: true,
      isPending: false,
      themeData: parseParentThemeData(mockParentThemeData),
    });

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      messageHandler
    );
  }
);

it.each([
  [true, mockParentThemeData],
  [false, mockParentThemeData],
  [true, new Error('Mock Error')],
  [false, new Error('Mock Error')],
])(
  'should request parent theme if enabled: isEnabled=%s, parentThemeDataOrError=%s',
  async (isEnabled, parentThemeDataOrError) => {
    asMock(isParentThemeEnabled).mockReturnValue(isEnabled);

    if (parentThemeDataOrError instanceof Error) {
      asMock(requestParentThemeData).mockRejectedValue(parentThemeDataOrError);
    } else {
      asMock(requestParentThemeData).mockResolvedValue(parentThemeDataOrError);
    }

    const { result, waitForNextUpdate } = renderHook(() =>
      useParentWindowTheme()
    );

    if (!isEnabled) {
      expect(requestParentThemeData).not.toHaveBeenCalled();
      return;
    }

    await waitForNextUpdate();
    expect(requestParentThemeData).toHaveBeenCalled();

    if (parentThemeDataOrError instanceof Error) {
      expect(result.current).toEqual({
        isEnabled: true,
        isPending: false,
      });
    } else {
      expect(result.current).toEqual({
        isEnabled: true,
        isPending: false,
        themeData: parseParentThemeData(parentThemeDataOrError),
      });
    }
  }
);
