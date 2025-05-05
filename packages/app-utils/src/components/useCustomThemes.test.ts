import { useContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useExternalTheme, type ThemeData } from '@deephaven/components';
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
    asMock(useContext).mockReturnValue(plugins);
    asMock(useExternalTheme).mockReturnValue({
      isEnabled: isExternalThemeEnabled,
      isPending: isexternalThemePending,
      themeData: externalThemeData,
    });

    const { result } = renderHook(() => useCustomThemes());

    if (!isExternalThemeEnabled && plugins != null) {
      expect(getThemeDataFromPlugins).toHaveBeenCalledWith(plugins);
    }
    expect(result.current).toEqual(expectedResult);
  }
);
