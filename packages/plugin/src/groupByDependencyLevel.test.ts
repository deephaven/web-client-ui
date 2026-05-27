import {
  groupByDependencyLevel,
  type PluginManifestPluginInfo,
} from './PluginUtils';

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

describe('groupByDependencyLevel', () => {
  it('returns all plugins in a single level when no dependencies', () => {
    const plugins = [
      makeManifestPlugin('a'),
      makeManifestPlugin('b'),
      makeManifestPlugin('c'),
    ];

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(1);
    expect(levels[0].map(p => p.name)).toEqual(['a', 'b', 'c']);
  });

  it('separates dependency and consumer into different levels', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep'],
      }),
      makeManifestPlugin('dep', {
        package: '@scope/dep',
      }),
    ];

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(2);
    expect(levels[0].map(p => p.name)).toEqual(['dep']);
    expect(levels[1].map(p => p.name)).toEqual(['consumer']);
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

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(3);
    expect(levels[0].map(p => p.name)).toEqual(['a']);
    expect(levels[1].map(p => p.name)).toEqual(['b']);
    expect(levels[2].map(p => p.name)).toEqual(['c']);
  });

  it('groups independent plugins at the same level', () => {
    const plugins = [
      makeManifestPlugin('x'),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
      makeManifestPlugin('y'),
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('z'),
    ];

    const levels = groupByDependencyLevel(plugins);

    // Level 0: x, dep, y, z (all independent or no deps)
    // Level 1: consumer (depends on dep)
    expect(levels).toHaveLength(2);
    expect(levels[0].map(p => p.name)).toEqual(['x', 'dep', 'y', 'z']);
    expect(levels[1].map(p => p.name)).toEqual(['consumer']);
  });

  it('handles cycles gracefully by placing them in a final level', () => {
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

    // Should not throw
    const levels = groupByDependencyLevel(plugins);

    // Both end up in a single level since neither can be resolved first
    expect(levels).toHaveLength(1);
    expect(levels[0].map(p => p.name).sort()).toEqual(['a', 'b']);
  });

  it('warns and ignores dependencies not in the manifest', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/nonexistent'],
      }),
    ];

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(1);
    expect(levels[0].map(p => p.name)).toEqual(['consumer']);
  });

  it('handles multiple dependencies', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep-a', '@scope/dep-b'],
      }),
      makeManifestPlugin('dep-a', { package: '@scope/dep-a' }),
      makeManifestPlugin('dep-b', { package: '@scope/dep-b' }),
    ];

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(2);
    expect(levels[0].map(p => p.name)).toEqual(['dep-a', 'dep-b']);
    expect(levels[1].map(p => p.name)).toEqual(['consumer']);
  });

  it('does not mutate the input array', () => {
    const plugins = [
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
    ];
    const original = [...plugins];

    groupByDependencyLevel(plugins);

    expect(plugins).toEqual(original);
  });

  it('handles empty plugin list', () => {
    expect(groupByDependencyLevel([])).toEqual([]);
  });

  it('handles plugins with empty dependencies array', () => {
    const plugins = [
      makeManifestPlugin('a', { dependencies: [] }),
      makeManifestPlugin('b'),
    ];

    const levels = groupByDependencyLevel(plugins);

    expect(levels).toHaveLength(1);
    expect(levels[0].map(p => p.name)).toEqual(['a', 'b']);
  });

  it('handles cycle with independent plugins', () => {
    const plugins = [
      makeManifestPlugin('independent'),
      makeManifestPlugin('a', {
        package: '@scope/a',
        dependencies: ['@scope/b'],
      }),
      makeManifestPlugin('b', {
        package: '@scope/b',
        dependencies: ['@scope/a'],
      }),
    ];

    const levels = groupByDependencyLevel(plugins);

    // Level 0: independent (no deps)
    // Level 1: a and b (cycle, placed together in final level)
    expect(levels).toHaveLength(2);
    expect(levels[0].map(p => p.name)).toEqual(['independent']);
    expect(levels[1].map(p => p.name).sort()).toEqual(['a', 'b']);
  });
});
