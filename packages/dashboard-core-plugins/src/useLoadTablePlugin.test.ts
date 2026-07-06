import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  PluginType,
  type TablePlugin,
  type LegacyTablePlugin,
  type TablePluginComponent,
} from '@deephaven/plugin';
import { TablePluginLoaderContext } from './TablePluginLoaderContext';
import { useLoadTablePlugin } from './useLoadTablePlugin';

const mockPlugins = new Map();

jest.mock('@deephaven/plugin', () => ({
  ...jest.requireActual('@deephaven/plugin'),
  usePlugins: () => mockPlugins,
}));

const MockTableComponent = jest.fn() as unknown as TablePluginComponent;
const MockLegacyTableComponent = jest.fn() as unknown as TablePluginComponent;

const tablePlugin: TablePlugin = {
  name: 'test-table-plugin',
  type: PluginType.TABLE_PLUGIN,
  component: MockTableComponent,
};

const legacyTablePlugin: LegacyTablePlugin = {
  TablePlugin: MockLegacyTableComponent,
};

beforeEach(() => {
  mockPlugins.clear();
});

describe('useLoadTablePlugin', () => {
  it('returns the component from a TablePlugin registered in the plugin map', () => {
    mockPlugins.set('test-table-plugin', tablePlugin);
    const { result } = renderHook(() => useLoadTablePlugin());
    expect(result.current('test-table-plugin')).toBe(MockTableComponent);
  });

  it('returns the component from a LegacyTablePlugin registered in the plugin map', () => {
    mockPlugins.set('legacy-plugin', legacyTablePlugin);
    const { result } = renderHook(() => useLoadTablePlugin());
    expect(result.current('legacy-plugin')).toBe(MockLegacyTableComponent);
  });

  it('throws an error when the plugin is not found and no context loader is provided', () => {
    const { result } = renderHook(() => useLoadTablePlugin());
    expect(() => result.current('missing-plugin')).toThrow(
      'Unable to find table plugin missing-plugin.'
    );
  });

  it('falls back to the context loader when the plugin is not in the map', () => {
    const contextComponent = jest.fn() as unknown as TablePluginComponent;
    const contextLoader = jest.fn(() => contextComponent);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TablePluginLoaderContext.Provider,
        { value: contextLoader },
        children
      );

    const { result } = renderHook(() => useLoadTablePlugin(), { wrapper });
    const loaded = result.current('context-plugin');

    expect(contextLoader).toHaveBeenCalledWith('context-plugin');
    expect(loaded).toBe(contextComponent);
  });

  it('prefers the plugin map over the context loader', () => {
    mockPlugins.set('test-table-plugin', tablePlugin);

    const contextComponent = jest.fn() as unknown as TablePluginComponent;
    const contextLoader = jest.fn(() => contextComponent);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TablePluginLoaderContext.Provider,
        { value: contextLoader },
        children
      );

    const { result } = renderHook(() => useLoadTablePlugin(), { wrapper });
    const loaded = result.current('test-table-plugin');

    expect(contextLoader).not.toHaveBeenCalled();
    expect(loaded).toBe(MockTableComponent);
  });

  it('throws an error when the plugin is not found even though a context loader is provided', () => {
    const contextLoader = jest.fn(() => {
      throw new Error('Plugin not found in context');
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TablePluginLoaderContext.Provider,
        { value: contextLoader },
        children
      );

    const { result } = renderHook(() => useLoadTablePlugin(), { wrapper });
    expect(() => result.current('missing-plugin')).toThrow(
      'Plugin not found in context'
    );
  });
});
