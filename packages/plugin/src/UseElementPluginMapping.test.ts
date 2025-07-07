import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import type { PluginModuleMap } from './PluginTypes';
import { useElementPluginMapping } from './useElementPluginMapping';
import { getElementPluginMapping } from './PluginUtils';
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
  asMock(getElementPluginMapping).mockReturnValue(mockElementPluginMapping);
  asMock(usePlugins).mockReturnValue(mockPlugins);

  const { result } = renderHook(() => useElementPluginMapping());

  expect(getElementPluginMapping).toHaveBeenCalledWith(mockPlugins);
  expect(result.current).toEqual(mockElementPluginMapping);
});
