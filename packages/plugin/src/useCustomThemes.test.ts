import { renderHook } from '@testing-library/react';
import { useExternalTheme, type ThemeData } from '@deephaven/components';
import { TestUtils } from '@deephaven/test-utils';
import { useCustomThemes } from './useCustomThemes';
import type { PluginModuleMap } from './PluginTypes';
import { getThemeDataFromPlugins } from './PluginUtils';

jest.mock('@deephaven/components');
jest.mock('./PluginUtils');

const { asMock } = TestUtils;

const mockExternalThemeData: ThemeData = {
  themeKey: 'mock.externalThemeKey',
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
  [true, false, mockExternalThemeData, mockPlugins, [mockExternalThemeData]],
  [true, false, undefined, mockPlugins, []],
  [true, true, mockExternalThemeData, mockPlugins, null],
  [false, false, mockExternalThemeData, mockPlugins, [mockPluginThemeData]],
  [false, false, mockExternalThemeData, null, null],
])(
  'should return external theme if enabled and ready, otherwise plugin themes: isExternalThemeEnabled=%s, isexternalThemePending=%s, externalThemeData=%s, plugins=%s, expectedResult=%s',
  (
    isExternalThemeEnabled,
    isexternalThemePending,
    externalThemeData,
    plugins,
    expectedResult
  ) => {
    asMock(useExternalTheme).mockReturnValue({
      isEnabled: isExternalThemeEnabled,
      isPending: isexternalThemePending,
      themeData: externalThemeData,
    });

    const { result } = renderHook(() => useCustomThemes(plugins));

    if (!isExternalThemeEnabled && plugins != null) {
      expect(getThemeDataFromPlugins).toHaveBeenCalledWith(plugins);
    }
    expect(result.current).toEqual(expectedResult);
  }
);
