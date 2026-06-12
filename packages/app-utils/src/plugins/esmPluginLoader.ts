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
    esmsInitOptions?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importShim?: (url: string) => Promise<any>;
  }
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
 * Specifiers that have already been registered in an injected import map.
 * Prevents re-injecting an existing specifier with a different URL, which
 * es-module-shims rejects in polyfill mode.
 */
const injectedSpecifiers = new Set<string>();

/**
 * Memoized host import map. The host singletons never change, so the blob
 * re-export modules are created once and reused across calls.
 */
let hostImportMapCache: { imports: Record<string, string> } | null = null;

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
export function buildHostImportMap(resolve: Record<string, unknown>): {
  imports: Record<string, string>;
} {
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
    package?: string | null;
  }[],
  modulePluginsUrl: string
): { imports: Record<string, string> } {
  const imports: Record<string, string> = {};
  plugins.forEach(({ name, main, package: packageName }) => {
    if (packageName != null) {
      imports[packageName] = `${modulePluginsUrl}/${name}/${main}`;
    }
  });
  return { imports };
}

/**
 * Inject an import map into the document head. Only specifiers that have not
 * already been injected are added, avoiding override errors in polyfill mode.
 * Injected before any ESM plugin is imported so es-module-shims can resolve the
 * plugins' bare and cross-plugin specifiers.
 * @param map The import map to inject
 */
export function injectImportMap(map: {
  imports: Record<string, string>;
}): void {
  const newImports: Record<string, string> = {};
  Object.entries(map.imports).forEach(([specifier, url]) => {
    if (!injectedSpecifiers.has(specifier)) {
      newImports[specifier] = url;
      injectedSpecifiers.add(specifier);
    }
  });

  if (Object.keys(newImports).length === 0) {
    return;
  }

  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify({ imports: newImports });
  document.head.appendChild(script);
  log.debug('Injected plugin import map', newImports);
}

/**
 * Lazily load and initialize es-module-shims in polyfill mode. es-module-shims
 * exposes `window.importShim`, which we use to load ESM plugins so their imports
 * resolve through our injected import map (polyfilled on browsers that don't
 * support runtime-injected import maps, e.g. Firefox).
 */
let esModuleShimsPromise: Promise<void> | null = null;

export function ensureEsModuleShims(): Promise<void> {
  if (esModuleShimsPromise == null) {
    // esmsInitOptions must be set before es-module-shims executes. Default
    // (polyfill) mode passes through to native loading where supported.
    window.esmsInitOptions = {
      ...window.esmsInitOptions,
      // Log when the polyfill engages instead of using the native loader.
      onpolyfill: () => {
        log.debug('es-module-shims polyfill engaged for plugin loading');
      },
    };
    esModuleShimsPromise = import('es-module-shims').then(() => {
      log.debug('es-module-shims loaded');
    });
  }
  return esModuleShimsPromise;
}

/**
 * Load an ES module plugin from the provided URL via es-module-shims'
 * `importShim`, so bare specifiers and lazy dynamic imports resolve through the
 * injected import map.
 * @param pluginUrl The URL of the ESM plugin entry to load
 * @returns The loaded module exports
 */
export async function loadEsModulePlugin(pluginUrl: string): Promise<unknown> {
  await ensureEsModuleShims();
  if (window.importShim == null) {
    throw new Error('es-module-shims did not initialize importShim');
  }
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

/**
 * Fetch a plugin entry and detect whether it is an ES module. Falls back to
 * `false` (CommonJS) when the source cannot be fetched or parsed.
 * @param pluginUrl The URL of the plugin entry
 * @returns True if the plugin entry is an ES module
 */
export async function isEsModulePlugin(pluginUrl: string): Promise<boolean> {
  try {
    const res = await fetch(pluginUrl);
    if (!res.ok || typeof res.text !== 'function') {
      return false;
    }
    const source = await res.text();
    return await isEsModuleSource(source);
  } catch (e) {
    log.warn(`Unable to detect module format for '${pluginUrl}'`, e);
    return false;
  }
}
