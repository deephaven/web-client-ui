import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/jsapi-utils.WorkerVariablesStore');

/**
 * The current full list of variable definitions on a worker. Snapshot identity
 * is stable until the next field-update delta is applied, so consumers using
 * `useSyncExternalStore` will only re-render when the list actually changes.
 */
export type WorkerVariables = readonly dh.ide.VariableDefinition[];

/** Default key used when a host exposes a single connection (e.g. DHC). */
export const DEFAULT_WORKER_KEY = 'default';

/**
 * Derive a stable string key identifying the worker that owns the variable
 * described by `descriptor`. Used by {@link WorkerVariablesStore} to dedup
 * subscriptions across consumers that target the same worker.
 *
 * The base `dh.ide.VariableDescriptor` type only carries `type`/`id`/`name`,
 * but DHE attaches routing fields (`querySerial`, `queryName`, `sessionId`).
 * Those are read defensively so this helper works in DHC too — where every
 * descriptor maps to {@link DEFAULT_WORKER_KEY}.
 */
export function getWorkerKey(
  descriptor:
    | Partial<dh.ide.VariableDescriptor>
    | Record<string, unknown>
    | null
    | undefined
): string {
  if (descriptor == null) return DEFAULT_WORKER_KEY;
  const d = descriptor as Record<string, unknown>;
  if (typeof d.querySerial === 'string' && d.querySerial.length > 0) {
    return `q:${d.querySerial}`;
  }
  if (typeof d.queryName === 'string' && d.queryName.length > 0) {
    return `qn:${d.queryName}`;
  }
  if (typeof d.sessionId === 'string' && d.sessionId.length > 0) {
    return `s:${d.sessionId}`;
  }
  return DEFAULT_WORKER_KEY;
}

/**
 * Resolves the IDE connection that owns the worker identified by `key`. Return
 * `null` if the worker is not currently reachable (e.g. query is stopped). The
 * store will retry on the next subscribe or {@link WorkerVariablesStore.invalidate}.
 */
export type ResolveConnection = (
  key: string
) => Promise<dh.IdeConnection | null>;

/**
 * Identify a variable for delta matching. `dh.ide.VariableDefinition` declares
 * a non-optional `id`, but at runtime instances are frequently created as just
 * `{ name, type }` (e.g. field-update payloads and test fixtures), so `id` may
 * be absent. Fall back to `name`, then `title`, and return `undefined` when no
 * usable key exists so such items are never matched against a delta. Keys are
 * namespaced by source field so an `id` of `"x"` never collides with a `name`
 * of `"x"`.
 */
function getVariableKey(v: dh.ide.VariableDefinition): string | undefined {
  if (typeof v.id === 'string' && v.id.length > 0) {
    return `id:${v.id}`;
  }
  if (typeof v.name === 'string' && v.name.length > 0) {
    return `name:${v.name}`;
  }
  if (typeof v.title === 'string' && v.title.length > 0) {
    return `title:${v.title}`;
  }
  return undefined;
}

/**
 * A ref-counted store of worker variable lists, keyed by worker. Wraps
 * `IdeConnection.subscribeToFieldUpdates` so the underlying push subscription
 * is opened once per worker regardless of the number of React consumers.
 */
export type WorkerVariablesStore = {
  /** Current list for `key`, or `null` if not yet resolved. */
  snapshot: (key: string) => WorkerVariables | null;
  /**
   * Subscribe to changes for `key`. The listener fires after each delta is
   * applied. Returns an unsubscribe function; the underlying field-updates
   * subscription is closed when the last listener for `key` unsubscribes.
   */
  subscribe: (key: string, listener: () => void) => () => void;
  /**
   * Drop the cached list and subscription for `key`. Active subscribers will
   * be notified (snapshot becomes `null`) and a fresh resolve+subscribe will
   * kick off. Use when an external signal indicates the worker behind `key`
   * has been replaced (e.g. DHE query restart).
   */
  invalidate: (key: string) => void;
  /** Tear down all entries. Call when the owning provider unmounts. */
  destroy: () => void;
};

type Entry = {
  list: WorkerVariables | null;
  listeners: Set<() => void>;
  unsubscribeFieldUpdates: (() => void) | null;
  resolving: boolean;
  generation: number;
};

/**
 * Create a {@link WorkerVariablesStore} backed by `resolveConnection`. The
 * store is framework-free; pair it with a React provider/hook (see
 * `@deephaven/jsapi-bootstrap`'s `WorkerVariablesContext`/`useWorkerVariables`).
 */
export function createWorkerVariablesStore(
  resolveConnection: ResolveConnection
): WorkerVariablesStore {
  const entries = new Map<string, Entry>();

  /** Get the entry for `key`, creating an empty one if it doesn't exist. */
  function getOrCreate(key: string): Entry {
    let entry = entries.get(key);
    if (entry == null) {
      entry = {
        list: null,
        listeners: new Set(),
        unsubscribeFieldUpdates: null,
        resolving: false,
        generation: 0,
      };
      entries.set(key, entry);
    }
    return entry;
  }

  /** Invoke every listener on `entry`, isolating listener errors. */
  function notify(entry: Entry): void {
    entry.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        log.error('WorkerVariables listener threw', e);
      }
    });
  }

  /** Close the field-updates subscription for `key`, if any. */
  function teardown(key: string): void {
    const entry = entries.get(key);
    if (entry?.unsubscribeFieldUpdates != null) {
      try {
        entry.unsubscribeFieldUpdates();
      } catch (e) {
        log.warn('Error unsubscribing from field updates', e);
      }
      entry.unsubscribeFieldUpdates = null;
    }
  }

  /** Resolve the connection for `key` and open its field-updates subscription. */
  async function start(key: string): Promise<void> {
    const entry = entries.get(key);
    if (
      entry == null ||
      entry.resolving ||
      entry.unsubscribeFieldUpdates != null
    ) {
      return;
    }
    entry.resolving = true;
    const gen = entry.generation;
    try {
      const connection = await resolveConnection(key);
      if (
        gen !== entry.generation ||
        entry.listeners.size === 0 ||
        entries.get(key) !== entry
      ) {
        return;
      }
      if (connection == null) {
        log.debug('No connection available for worker', key);
        return;
      }
      // entry.list is replaced with a fresh array each delta so snapshot
      // identity is stable for `useSyncExternalStore` consumers.
      const unsubscribe = connection.subscribeToFieldUpdates(changes => {
        if (gen !== entry.generation) return;
        const removedKeys = new Set(
          changes.removed.map(getVariableKey).filter(k => k != null)
        );
        const updatedKeys = new Set(
          changes.updated.map(getVariableKey).filter(k => k != null)
        );
        // Keep keyless items (they can't be matched) and items whose key was
        // not removed or updated; updated/created items are re-appended below.
        const next = (entry.list ?? []).filter(v => {
          const k = getVariableKey(v);
          return k == null || (!removedKeys.has(k) && !updatedKeys.has(k));
        });
        next.push(...changes.updated, ...changes.created);
        entry.list = next;
        notify(entry);
      });
      entry.unsubscribeFieldUpdates = unsubscribe;
    } catch (e) {
      log.error('Failed to resolve worker connection', key, e);
    } finally {
      entry.resolving = false;
      // If `invalidate` ran while this resolve was in flight, it bumped
      // `generation` but couldn't start a fresh resolve (this one was still
      // marked `resolving`). The in-flight resolve above then bailed out as
      // stale, so kick off another resolve now that `resolving` is cleared —
      // otherwise the entry would be stuck with `list === null` and no
      // subscription until the next `invalidate`/subscribe. `gen` now equals
      // `entry.generation` when no invalidation occurred, so this never loops.
      if (
        entries.get(key) === entry &&
        gen !== entry.generation &&
        entry.unsubscribeFieldUpdates == null &&
        entry.listeners.size > 0
      ) {
        start(key).catch(() => undefined);
      }
    }
  }

  /** Current list for `key`, or `null` if not yet resolved. */
  function snapshot(key: string): WorkerVariables | null {
    return entries.get(key)?.list ?? null;
  }

  /** Register `listener` for `key`, starting the subscription on first listener. */
  function subscribe(key: string, listener: () => void): () => void {
    const entry = getOrCreate(key);
    entry.listeners.add(listener);
    if (entry.unsubscribeFieldUpdates == null && !entry.resolving) {
      // start handles its own errors; nothing to do on rejection
      start(key).catch(() => undefined);
    }
    return () => {
      entry.listeners.delete(listener);
      if (entry.listeners.size === 0) {
        teardown(key);
        entry.list = null;
        entries.delete(key);
      }
    };
  }

  /** Drop the cached list/subscription for `key` and re-resolve if observed. */
  function invalidate(key: string): void {
    const entry = entries.get(key);
    if (entry == null) return;
    entry.generation += 1;
    teardown(key);
    entry.list = null;
    notify(entry);
    if (entry.listeners.size > 0) {
      // start handles its own errors; nothing to do on rejection
      start(key).catch(() => undefined);
    }
  }

  /** Tear down every entry and clear all state. */
  function destroy(): void {
    Array.from(entries.keys()).forEach(key => {
      teardown(key);
    });
    entries.clear();
  }

  return { snapshot, subscribe, invalidate, destroy };
}
