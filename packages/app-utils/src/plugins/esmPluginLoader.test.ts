import {
  addImportMap,
  buildHostImportMap,
  buildPluginImportMap,
  ensureEsModuleShims,
  isEsModuleSource,
  loadEsModulePlugin,
} from './esmPluginLoader';

const SHARED_MODULES_KEY = '__DH_SHARED_PLUGIN_MODULES__';

// es-module-shims sets window.importShim as a side effect when imported.
const mockImportShim = Object.assign(jest.fn(), {
  addImportMap: jest.fn(),
});
jest.mock('es-module-shims', () => {
  (globalThis as unknown as { importShim: unknown }).importShim =
    mockImportShim;
  return {};
});

const blobsByUrl = new Map<string, Blob>();

beforeAll(() => {
  // jsdom doesn't implement createObjectURL.
  let counter = 0;
  URL.createObjectURL = jest.fn((blob: Blob) => {
    // eslint-disable-next-line no-plusplus
    const url = `blob:mock-${counter++}`;
    blobsByUrl.set(url, blob);
    return url;
  });
});

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/**
 * Evaluate a generated re-export module by rewriting its `export` statements
 * into assignments, returning what an importer would see.
 */
async function evaluateReexportModule(
  url: string
): Promise<Record<string, unknown>> {
  const source = await readBlob(blobsByUrl.get(url) as Blob);
  const body = source
    .replace('export default ', 'exports.default = ')
    .replace(/export const (\w+) =/g, 'exports.$1 =');
  const exports: Record<string, unknown> = {};
  // eslint-disable-next-line no-new-func
  new Function('window', 'exports', body)(window, exports);
  return exports;
}

beforeEach(() => {
  delete (window as unknown as Record<string, unknown>)[SHARED_MODULES_KEY];
  mockImportShim.mockReset();
  mockImportShim.addImportMap.mockReset();
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

describe('buildHostImportMap', () => {
  it('re-exports default and named exports of host modules', async () => {
    const react = { useState: jest.fn(), createElement: jest.fn() };
    const Log = { module: jest.fn() };
    const logInit = jest.fn();
    const logModule = { default: Log, Log, logInit };
    const map = buildHostImportMap({ react, '@deephaven/log': logModule });

    expect(map.imports.react).toMatch(/^blob:mock-/);
    expect(
      (window as unknown as Record<string, Record<string, unknown>>)[
        SHARED_MODULES_KEY
      ].react
    ).toBe(react);

    // A module without an explicit default uses the value itself as default.
    const reactExports = await evaluateReexportModule(map.imports.react);
    expect(reactExports.default).toBe(react);
    expect(reactExports.useState).toBe(react.useState);
    expect(reactExports.createElement).toBe(react.createElement);

    const logExports = await evaluateReexportModule(
      map.imports['@deephaven/log']
    );
    expect(logExports.default).toBe(Log);
    expect(logExports.Log).toBe(Log);
    expect(logExports.logInit).toBe(logInit);
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
        {
          name: 'plugin-a',
          main: 'index.js',
          loader: { package: '@scope/plugin-a' },
        },
        {
          name: 'plugin-b',
          main: 'dist/index.js',
          loader: { package: '@scope/plugin-b' },
        },
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
      [
        { name: 'plugin-a', main: 'index.js' },
        { name: 'plugin-b', main: 'index.js', loader: {} },
      ],
      'http://localhost/js-plugins'
    );
    expect(map.imports).toEqual({});
  });
});

// These tests share module state (import map entries, shim readiness) and
// intentionally run in order: entries added before es-module-shims loads must
// be applied on load, and later additions go straight to importShim.
describe('es-module-shims integration', () => {
  it('defers import map entries until es-module-shims has loaded', async () => {
    addImportMap({ imports: { foo: 'blob:1' } });
    expect(mockImportShim.addImportMap).not.toHaveBeenCalled();

    await ensureEsModuleShims();

    expect(window.esmsInitOptions).toMatchObject({ shimMode: true });
    expect(window.esmsInitOptions?.source).toEqual(expect.any(Function));
    expect(mockImportShim.addImportMap).toHaveBeenCalledTimes(1);
    expect(mockImportShim.addImportMap).toHaveBeenCalledWith({
      imports: { foo: 'blob:1' },
    });
  });

  it('adds only new specifiers once loaded', () => {
    addImportMap({ imports: { foo: 'blob:2', bar: 'blob:3' } });
    expect(mockImportShim.addImportMap).toHaveBeenCalledTimes(1);
    expect(mockImportShim.addImportMap).toHaveBeenCalledWith({
      imports: { bar: 'blob:3' },
    });
  });

  it('does not call importShim when nothing new is added', () => {
    addImportMap({ imports: { foo: 'blob:4', bar: 'blob:5' } });
    expect(mockImportShim.addImportMap).not.toHaveBeenCalled();
  });

  it('imports via importShim and serves the prefetched source once', async () => {
    const url = 'http://localhost/p/main.js';
    const source = 'export default { name: "plugin" };';
    const defaultSourceHook = jest
      .fn()
      .mockResolvedValue({ url, type: 'js', source: 'from network' });
    const sourceHook = window.esmsInitOptions?.source;
    if (sourceHook == null) {
      throw new Error('source hook not registered');
    }

    mockImportShim.mockResolvedValue({ default: { name: 'plugin' } });
    const result = await loadEsModulePlugin(url, source);

    expect(mockImportShim).toHaveBeenCalledWith(url);
    expect(result).toEqual({ default: { name: 'plugin' } });

    // First request for the entry is served from the prefetched source
    expect(await sourceHook(url, {}, '', defaultSourceHook)).toEqual({
      type: 'js',
      source,
    });
    expect(defaultSourceHook).not.toHaveBeenCalled();

    // Anything else (and re-requests) go to the default network loader
    expect(await sourceHook(url, {}, '', defaultSourceHook)).toEqual({
      url,
      type: 'js',
      source: 'from network',
    });
    expect(defaultSourceHook).toHaveBeenCalledWith(url, {}, '');
  });

  it('keys prefetched sources by resolved URL', async () => {
    const sourceHook = window.esmsInitOptions?.source;
    if (sourceHook == null) {
      throw new Error('source hook not registered');
    }
    mockImportShim.mockResolvedValue({});

    await loadEsModulePlugin('/plugins/p/main.js', 'export {};');

    const resolved = new URL('/plugins/p/main.js', document.baseURI).href;
    expect(await sourceHook(resolved, {}, '', jest.fn())).toEqual({
      type: 'js',
      source: 'export {};',
    });
  });
});
