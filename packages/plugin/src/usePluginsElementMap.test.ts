import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import type { PluginModuleMap } from './PluginTypes';
import { usePluginsElementMap } from './useElementPluginMapping';
import { getPluginsElementMap } from './PluginUtils';
import { usePlugins } from './usePlugins';

jest.mock('./PluginUtils');
jest.mock('./usePlugins');

const { asMock } = TestUtils;

const mockElementPluginMapping = new Map<
  string,
  React.ComponentType<unknown>
>();

const mockPlugins: PluginModuleMap = new Map();

it('should return element plugin mapping from plugins context', () => {
  asMock(getPluginsElementMap).mockReturnValue(mockElementPluginMapping);
  asMock(usePlugins).mockReturnValue(mockPlugins);

  const { result } = renderHook(() => usePluginsElementMap());

  expect(getPluginsElementMap).toHaveBeenCalledWith(mockPlugins);
  expect(result.current).toEqual(mockElementPluginMapping);
});
