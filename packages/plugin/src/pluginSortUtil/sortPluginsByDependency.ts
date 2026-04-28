import Log from '@deephaven/log';
import { type PluginManifestPluginInfo } from '../PluginUtils';

const log = Log.module('@deephaven/plugin.sortPluginsByDependency');

/**
 * Topologically sort plugins so that dependencies are loaded before the
 * plugins that depend on them. Plugins without dependencies or whose
 * dependencies are not in the manifest keep their original relative order
 * (stable sort). Throws if a dependency cycle is detected.
 *
 * @param plugins The plugin list from the manifest
 * @returns A new array with plugins sorted so dependencies come first
 */
export function sortPluginsByDependency<
  T extends Pick<PluginManifestPluginInfo, 'name' | 'package' | 'dependencies'>,
>(plugins: readonly T[]): T[] {
  // Build a lookup from package name → plugin index
  const packageToIndex = new Map<string, number>();
  plugins.forEach((p, i) => {
    if (p.package != null) {
      packageToIndex.set(p.package, i);
    }
  });

  // Build adjacency list: index → indices it depends on
  const depIndices = new Map<number, number[]>();
  plugins.forEach((p, i) => {
    if (p.dependencies != null && p.dependencies.length > 0) {
      const resolved: number[] = [];
      p.dependencies.forEach(dep => {
        const idx = packageToIndex.get(dep);
        if (idx != null) {
          resolved.push(idx);
        } else {
          log.warn(
            `Plugin '${p.name}' depends on '${dep}' which is not in the manifest`
          );
        }
      });
      if (resolved.length > 0) {
        depIndices.set(i, resolved);
      }
    }
  });

  // If no plugin has in-manifest dependencies, return original order
  if (depIndices.size === 0) {
    return [...plugins];
  }

  // Kahn's algorithm for topological sort (stable — preserves original order
  // among plugins at the same dependency depth)
  const inDegree = new Array<number>(plugins.length).fill(0);

  // Reverse adjacency: who depends on me?
  const dependents = new Map<number, number[]>();
  depIndices.forEach((deps, idx) => {
    deps.forEach(dep => {
      if (!dependents.has(dep)) {
        dependents.set(dep, []);
      }
      const depList = dependents.get(dep);
      if (depList != null) {
        depList.push(idx);
      }
      inDegree[idx] += 1;
    });
  });

  // Seed queue with all nodes that have no in-manifest dependencies,
  // in their original order
  const queue: number[] = [];
  for (let i = 0; i < plugins.length; i += 1) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const sorted: T[] = [];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (idx == null) {
      break;
    }
    sorted.push(plugins[idx]);
    const deps = dependents.get(idx);
    if (deps != null) {
      // Process dependents in original manifest order for stability
      deps.sort((a, b) => a - b);
      deps.forEach(depIdx => {
        inDegree[depIdx] -= 1;
        if (inDegree[depIdx] === 0) {
          queue.push(depIdx);
        }
      });
    }
  }

  if (sorted.length !== plugins.length) {
    // Find the cycle participants for a useful error message
    const inCycle = plugins.filter((_, i) => inDegree[i] > 0).map(p => p.name);
    throw new Error(
      `Circular plugin dependency detected among: ${inCycle.join(', ')}`
    );
  }

  return sorted;
}
