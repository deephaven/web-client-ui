import {
  buildHostImportMap,
  buildPluginImportMap,
  ensureEsModuleShims,
  injectImportMap,
  isEsModulePlugin,
  isEsModuleSource,
  loadEsModulePlugin,
} from './esmPluginLoader';

const SHARED_MODULES_KEY = '__DH_SHARED_PLUGIN_MODULES__';

// es-module-shims sets window.importShim as a side effect when imported.
const mockImportShim = jest.fn();
jest.mock('es-module-shims', () => {
  (globalThis as unknown as { importShim: unknown }).importShim = (
    ...args: unknown[]
  ) => mockImportShim(...args);
  return {};
});

beforeAll(() => {
  // jsdom doesn't implement createObjectURL.
  let counter = 0;
  // eslint-disable-next-line no-plusplus
  URL.createObjectURL = jest.fn(() => `blob:mock-${counter++}`);
});

beforeEach(() => {
  document.head.innerHTML = '';
  delete (window as unknown as Record<string, unknown>)[SHARED_MODULES_KEY];
  mockImportShim.mockReset();
});

describe('isEsModuleSource', () => {
  it('detects modules with export statements', async () => {
    expect(await isEsModuleSource('export const foo = 1;')).toBe(true);
    expect(await isEsModuleSource('export default function () {}')).toBe(true);
  });

  it('detects modules with static imports', async () => {
    expect(await isEsModuleSource('import React from "react";')).toBe(true);
  });

  it('treats CommonJS source as not an ES module', async () => {
    expect(
      await isEsModuleSource(
        'module.exports = function () { return 1; };\nvar x = require("react");'
      )
    ).toBe(false);
  });

  it('does not treat a lone dynamic import as an ES module', async () => {
    expect(await isEsModuleSource('const p = import("./lazy.js");')).toBe(
      false
    );
  });
});

describe('isEsModulePlugin', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns true for an ESM entry', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'export const Plugin = {};',
    } as unknown as Response);
    expect(await isEsModulePlugin('http://localhost/p/main.js')).toBe(true);
  });

  it('returns false for a CommonJS entry', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'module.exports = {};',
    } as unknown as Response);
    expect(await isEsModulePlugin('http://localhost/p/main.js')).toBe(false);
  });

  it('returns false when the fetch is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => '',
    } as unknown as Response);
    expect(await isEsModulePlugin('http://localhost/p/main.js')).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    expect(await isEsModulePlugin('http://localhost/p/main.js')).toBe(false);
  });
});

describe('buildHostImportMap', () => {
  it('registers host singletons and maps specifiers to blob urls', () => {
    const react = { useState: () => {}, default: {} };
    const map = buildHostImportMap({ react });

    expect(map.imports.react).toMatch(/^blob:mock-/);
    expect(
      (window as unknown as Record<string, Record<string, unknown>>)[
        SHARED_MODULES_KEY
      ].react
    ).toBe(react);
  });

  it('memoizes the result across calls', () => {
    const first = buildHostImportMap({ react: {} });
    const second = buildHostImportMap({ '@deephaven/components': {} });
    // Memoized: second call returns the same cached map, ignoring new input.
    expect(second).toBe(first);
  });
});

describe('buildPluginImportMap', () => {
  it('maps each plugin package name to its served entry url', () => {
    const map = buildPluginImportMap(
      [
        { name: 'plugin-a', main: 'index.js', package: '@scope/plugin-a' },
        { name: 'plugin-b', main: 'dist/index.js', package: '@scope/plugin-b' },
      ],
      'http://localhost/js-plugins'
    );
    expect(map.imports).toEqual({
      '@scope/plugin-a': 'http://localhost/js-plugins/plugin-a/index.js',
      '@scope/plugin-b': 'http://localhost/js-plugins/plugin-b/dist/index.js',
    });
  });

  it('skips plugins without a package field', () => {
    const map = buildPluginImportMap(
      [{ name: 'plugin-a', main: 'index.js' }],
      'http://localhost/js-plugins'
    );
    expect(map.imports).toEqual({});
  });
});

describe('injectImportMap', () => {
  it('injects an importmap script for new specifiers', () => {
    injectImportMap({ imports: { foo: 'blob:1' } });
    const scripts = document.head.querySelectorAll('script[type="importmap"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '{}')).toEqual({
      imports: { foo: 'blob:1' },
    });
  });

  it('does not re-inject already-injected specifiers', () => {
    injectImportMap({ imports: { bar: 'blob:1' } });
    injectImportMap({ imports: { bar: 'blob:2' } });
    const scripts = document.head.querySelectorAll('script[type="importmap"]');
    // Only the first injection produced a script; the second was deduped.
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '{}')).toEqual({
      imports: { bar: 'blob:1' },
    });
  });
});

describe('loadEsModulePlugin', () => {
  it('loads es-module-shims and imports via importShim', async () => {
    mockImportShim.mockResolvedValue({ default: { name: 'plugin' } });
    const result = await loadEsModulePlugin('http://localhost/p/main.js');
    expect(mockImportShim).toHaveBeenCalledWith('http://localhost/p/main.js');
    expect(result).toEqual({ default: { name: 'plugin' } });
  });

  it('ensureEsModuleShims resolves and sets up importShim', async () => {
    await ensureEsModuleShims();
    expect(
      (window as unknown as { importShim?: unknown }).importShim
    ).toBeDefined();
  });
});
