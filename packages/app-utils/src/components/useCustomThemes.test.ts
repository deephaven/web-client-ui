import { useContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useParentWindowTheme, type ThemeData } from '@deephaven/components';
import {
  getThemeDataFromPlugins,
  type PluginModuleMap,
} from '@deephaven/plugin';
import { TestUtils } from '@deephaven/test-utils';
import { useCustomThemes } from './useCustomThemes';

jest.mock('@deephaven/components');
jest.mock('@deephaven/plugin');
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

const { asMock } = TestUtils;

const mockParentThemeData: ThemeData = {
  themeKey: 'mock.parentThemeKey',
  name: 'mock.name',
  styleContent: 'mock.styleContent',
};

const mockPluginThemeData: ThemeData = {
  themeKey: 'mock.pluginThemeKey',
  name: 'mock.name',
  styleContent: 'mock.styleContent',
};

const mockPlugins: PluginModuleMap = new Map();

beforeEach(() => {
  jest.clearAllMocks();
  asMock(getThemeDataFromPlugins).mockReturnValue([mockPluginThemeData]);
});

it.each([
  [true, false, mockParentThemeData, mockPlugins, [mockParentThemeData]],
  [true, false, undefined, mockPlugins, []],
  [true, true, mockParentThemeData, mockPlugins, null],
  [false, false, mockParentThemeData, mockPlugins, [mockPluginThemeData]],
  [false, false, mockParentThemeData, null, null],
])(
  'should return parent theme if enabled and ready, otherwise plugin themes: isParentThemeEnabled=%s, isPending=%s, parentThemeData=%s, plugins=%s, expectedResult=%s',
  (
    isParentThemeEnabled,
    isParentThemePending,
    parentThemeData,
    plugins,
    expectedResult
  ) => {
    asMock(useContext).mockReturnValue(plugins);
    asMock(useParentWindowTheme).mockReturnValue({
      isEnabled: isParentThemeEnabled,
      isPending: isParentThemePending,
      themeData: parentThemeData,
    });

    const { result } = renderHook(() => useCustomThemes());

    if (!isParentThemeEnabled && plugins != null) {
      expect(getThemeDataFromPlugins).toHaveBeenCalledWith(plugins);
    }
    expect(result.current).toEqual(expectedResult);
  }
);
