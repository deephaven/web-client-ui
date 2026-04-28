import { sortPluginsByDependency } from './sortPluginsByDependency';
import { type PluginManifestPluginInfo } from '../PluginUtils';

function makeManifestPlugin(
  name: string,
  opts?: {
    package?: string;
    dependencies?: string[];
  }
): PluginManifestPluginInfo {
  return {
    name,
    main: 'index.js',
    version: '1.0.0',
    package: opts?.package,
    dependencies: opts?.dependencies,
  };
}

describe('sortPluginsByDependency', () => {
  it('returns plugins in original order when no dependencies', () => {
    const plugins = [
      makeManifestPlugin('a'),
      makeManifestPlugin('b'),
      makeManifestPlugin('c'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['a', 'b', 'c']);
  });

  it('reorders so dependency loads before consumer', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep'],
      }),
      makeManifestPlugin('dep', {
        package: '@scope/dep',
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['dep', 'consumer']);
  });

  it('handles a chain of dependencies: a → b → c', () => {
    const plugins = [
      makeManifestPlugin('c', {
        package: '@scope/c',
        dependencies: ['@scope/b'],
      }),
      makeManifestPlugin('b', {
        package: '@scope/b',
        dependencies: ['@scope/a'],
      }),
      makeManifestPlugin('a', {
        package: '@scope/a',
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
    expect(names.indexOf('b')).toBeLessThan(names.indexOf('c'));
  });

  it('preserves original order among independent plugins', () => {
    const plugins = [
      makeManifestPlugin('x'),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
      makeManifestPlugin('y'),
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('z'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    // dep must come before consumer
    expect(names.indexOf('dep')).toBeLessThan(names.indexOf('consumer'));
    // independent plugins keep their relative order
    expect(names.indexOf('x')).toBeLessThan(names.indexOf('y'));
    expect(names.indexOf('y')).toBeLessThan(names.indexOf('z'));
  });

  it('throws on circular dependencies', () => {
    const plugins = [
      makeManifestPlugin('a', {
        package: '@scope/a',
        dependencies: ['@scope/b'],
      }),
      makeManifestPlugin('b', {
        package: '@scope/b',
        dependencies: ['@scope/a'],
      }),
    ];

    expect(() => sortPluginsByDependency(plugins)).toThrow(
      /Circular plugin dependency/
    );
  });

  it('warns and ignores dependencies not in the manifest', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/nonexistent'],
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['consumer']);
  });

  it('handles multiple dependencies', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep-a', '@scope/dep-b'],
      }),
      makeManifestPlugin('dep-a', { package: '@scope/dep-a' }),
      makeManifestPlugin('dep-b', { package: '@scope/dep-b' }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    expect(names.indexOf('dep-a')).toBeLessThan(names.indexOf('consumer'));
    expect(names.indexOf('dep-b')).toBeLessThan(names.indexOf('consumer'));
  });

  it('does not mutate the input array', () => {
    const plugins = [
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
    ];
    const original = [...plugins];

    sortPluginsByDependency(plugins);

    expect(plugins).toEqual(original);
  });

  it('handles empty plugin list', () => {
    expect(sortPluginsByDependency([])).toEqual([]);
  });

  it('handles plugins with empty dependencies array', () => {
    const plugins = [
      makeManifestPlugin('a', { dependencies: [] }),
      makeManifestPlugin('b'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['a', 'b']);
  });
});
