import Log from '@deephaven/log';
import { init as initLexer, parse } from 'es-module-lexer';

const log = Log.module('@deephaven/app-utils.esmPluginLoader');

/**
 * Global registry of host singleton modules keyed by their bare specifier (e.g.
 * `react`, `@deephaven/components`). The generated blob re-export modules read
 * the live host instance from here so plugin imports share the host's
 * singletons rather than bundling their own copies.
 */
const SHARED_MODULES_KEY = '__DH_SHARED_PLUGIN_MODULES__';

declare global {
  interface Window {
    [SHARED_MODULES_KEY]?: Record<string, unknown>;
  }
}

export interface PluginImportMap {
  imports: Record<string, string>;
}

/** Reserved words that cannot be used as `export const <name>` identifiers. */
const RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'await',
]);

const IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function isValidExportName(name: string): boolean {
  return IDENTIFIER_REGEX.test(name) && !RESERVED_WORDS.has(name);
}

/**
 * Memoized host import map. The host singletons never change, so the blob
 * re-export modules are created once and reused across calls.
 */
let hostImportMapCache: PluginImportMap | null = null;

/**
 * Plugin entry sources that have already been fetched (for format detection),
 * keyed by resolved URL. The es-module-shims source hook serves these so the
 * entry is not fetched a second time when it is imported.
 */
const prefetchedSources = new Map<string, string>();

function getSharedModules(): Record<string, unknown> {
  if (window[SHARED_MODULES_KEY] == null) {
    window[SHARED_MODULES_KEY] = {};
  }
  return window[SHARED_MODULES_KEY] as Record<string, unknown>;
}

/**
 * Create a blob URL for an ES module that re-exports a host singleton module.
 * The generated module reads the live instance from the shared module registry
 * so plugins and the host share the exact same singleton.
 * @param specifier The bare specifier (e.g. `react`) used as the registry key
 * @param value The host module value to re-export
 * @returns A blob URL referencing the generated ES module
 */
function createHostReexportModule(specifier: string, value: unknown): string {
  const namedExports =
    value != null && typeof value === 'object'
      ? Object.keys(value as Record<string, unknown>).filter(
          key => key !== 'default' && isValidExportName(key)
        )
      : [];

  const registryAccess = `window[${JSON.stringify(
    SHARED_MODULES_KEY
  )}][${JSON.stringify(specifier)}]`;

  const lines = [
    `const __m = ${registryAccess};`,
    // If the module has an explicit default, use it; otherwise the module value
    // itself is the default (e.g. the React object for `react`).
    'export default (__m && __m.default !== undefined) ? __m.default : __m;',
    ...namedExports.map(
      name => `export const ${name} = __m[${JSON.stringify(name)}];`
    ),
  ];

  const blob = new Blob([lines.join('\n')], {
    type: 'application/javascript',
  });
  return URL.createObjectURL(blob);
}

/**
 * Build (and memoize) the import map that maps host bare specifiers to blob
 * re-export modules backed by the host's live singletons.
 * @param resolve The resolve map of host singletons (from remote-component.config)
 * @returns An import map `{ imports: { specifier: blobUrl } }`
 */
export function buildHostImportMap(
  resolve: Record<string, unknown>
): PluginImportMap {
  if (hostImportMapCache != null) {
    return hostImportMapCache;
  }

  const sharedModules = getSharedModules();
  const imports: Record<string, string> = {};

  Object.entries(resolve).forEach(([specifier, value]) => {
    sharedModules[specifier] = value;
    imports[specifier] = createHostReexportModule(specifier, value);
  });

  hostImportMapCache = { imports };
  return hostImportMapCache;
}

/**
 * Build the import map that maps each plugin's package name to its served entry
 * URL, enabling ESM plugins to import other plugins by package name.
 * @param plugins The plugin manifest entries
 * @param modulePluginsUrl The base URL the plugins are served from
 * @returns An import map `{ imports: { packageName: entryUrl } }`
 */
export function buildPluginImportMap(
  plugins: readonly {
    name: string;
    main: string;
    loader?: { package?: string };
  }[],
  modulePluginsUrl: string
): PluginImportMap {
  const imports: Record<string, string> = {};
  plugins.forEach(({ name, main, loader }) => {
    const packageName = loader?.package;
    if (packageName != null) {
      imports[packageName] = `${modulePluginsUrl}/${name}/${main}`;
    }
  });
  return { imports };
}

/**
 * es-module-shims source hook. Serves plugin entries that were already fetched
 * for format detection, and defers to the default (network) loader for
 * everything else (lazy chunks, cross-plugin imports not yet loaded, ...).
 */
const resolvePluginSource: NonNullable<ESMSInitOptions['source']> = async (
  url,
  fetchOpts,
  parent,
  defaultSourceHook
) => {
  const source = prefetchedSources.get(url);
  if (source != null) {
    prefetchedSources.delete(url);
    return { type: 'js', source };
  }
  return defaultSourceHook(url, fetchOpts, parent);
};

let esModuleShimsPromise: Promise<void> | null = null;
let isEsModuleShimsReady = false;

/**
 * Import map entries registered for plugins; the first mapping for a specifier
 * wins. Kept locally so entries registered before es-module-shims has loaded
 * can be applied once it is ready.
 */
const pluginImports: Record<string, string> = {};

/**
 * Lazily load and initialize es-module-shims in shim mode. Shim mode only
 * processes modules loaded through `importShim`, so the host's own module
 * scripts are never touched, import maps can be added at runtime on every
 * browser, and our source hook can feed already-fetched plugin entries.
 */
export function ensureEsModuleShims(): Promise<void> {
  if (esModuleShimsPromise == null) {
    // esmsInitOptions must be set before es-module-shims evaluates
    window.esmsInitOptions = {
      ...window.esmsInitOptions,
      shimMode: true,
      source: resolvePluginSource,
    };
    esModuleShimsPromise = import('es-module-shims').then(() => {
      isEsModuleShimsReady = true;
      window.importShim.addImportMap({ imports: pluginImports });
      log.debug('es-module-shims loaded with import map', pluginImports);
    });
  }
  return esModuleShimsPromise;
}

/**
 * Register an import map so ESM plugins can resolve host singletons and
 * cross-plugin package specifiers. Specifiers that are already mapped are left
 * untouched. Does not load es-module-shims; entries are applied when it loads.
 * @param map The import map to add
 */
export function addImportMap(map: PluginImportMap): void {
  const imports: Record<string, string> = {};
  Object.entries(map.imports).forEach(([specifier, url]) => {
    if (!(specifier in pluginImports)) {
      pluginImports[specifier] = url;
      imports[specifier] = url;
    }
  });
  if (Object.keys(imports).length === 0) {
    return;
  }
  if (isEsModuleShimsReady) {
    window.importShim.addImportMap({ imports });
    log.debug('Added plugin import map', imports);
  }
}

/**
 * Load an ES module plugin whose entry source has already been fetched. The
 * source is handed to es-module-shims through the source hook so it is not
 * fetched again, while relative chunk imports still resolve against `pluginUrl`.
 * @param pluginUrl The URL of the ESM plugin entry
 * @param source The already-fetched entry source
 * @returns The loaded module exports
 */
export async function loadEsModulePlugin(
  pluginUrl: string,
  source: string
): Promise<unknown> {
  await ensureEsModuleShims();
  prefetchedSources.set(new URL(pluginUrl, document.baseURI).href, source);
  return window.importShim(pluginUrl);
}

let lexerInitPromise: Promise<void> | null = null;

/**
 * Detect whether the provided module source is an ES module by checking for
 * static `import`/`export` statements using es-module-lexer.
 * @param source The module source text
 * @returns True if the source is an ES module
 */
export async function isEsModuleSource(source: string): Promise<boolean> {
  if (lexerInitPromise == null) {
    lexerInitPromise = initLexer;
  }
  await lexerInitPromise;
  try {
    const [imports, exports] = parse(source);
    // `d === -1` denotes a static import statement (vs. a dynamic import()).
    const hasStaticImport = imports.some(({ d }) => d === -1);
    return exports.length > 0 || hasStaticImport;
  } catch (e) {
    log.warn('Failed to parse module source for ESM detection', e);
    return false;
  }
}
