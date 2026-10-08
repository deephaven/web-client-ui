/* eslint-disable no-console */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import throttle from 'lodash.throttle';
import { nanoid } from 'nanoid';
import LogHistory from './LogHistory';
import { LOG_PROXY_TYPE, type LogProxy } from './LogProxy';

export type PersistedLogEntry = {
  id?: number;
  /** Identifies the page load that produced the entry, so exports can be grouped */
  sessionId: string;
  /**
   * User logged in when the entry was buffered; absent before login. Stored on
   * the entry so attribution cannot be lost separately from it.
   */
  user?: string;
  time: number;
  type: LOG_PROXY_TYPE;
  /** Pre-formatted at write time; raw log args are not structured-cloneable */
  message: string;
  /** Where an error entry was logged from. Not recorded for uncaught errors. */
  stack?: string;
  /** Own stacks of any Error objects passed to the log call */
  errorStacks?: string[];
};

interface LogDbSchema extends DBSchema {
  entries: {
    key: number;
    value: PersistedLogEntry;
    indexes: { time: number };
  };
}

export type LogIndexedDbHistoryOptions = {
  dbName?: string;
  maxEntries?: number;
  maxAgeMs?: number;
  /** Milliseconds a non-error entry may sit buffered before being written. */
  flushIntervalMs?: number;
  /**
   * Minimum spacing between error-triggered writes. The first error in a window
   * is written immediately; a storm of them coalesces into one write per window.
   */
  errorFlushIntervalMs?: number;
  /** Characters of a formatted message kept before truncating. */
  maxEntryLength?: number;
  /**
   * Characters of a stack kept before truncating. Defaults to larger than the message limit.
   */
  maxStackLength?: number;
  /**
   * Fraction of the origin storage quota above which the oldest entries are
   * trimmed. The quota is shared with other Deephaven stores (command history),
   * so exceeding it risks eviction of the entire origin.
   */
  maxQuotaRatio?: number;
  /** Entry count below which quota trimming stops. Defaults to QUOTA_TRIM_FLOOR. */
  quotaTrimFloor?: number;
  levels?: LOG_PROXY_TYPE[];
};

const STORE_NAME = 'entries';
const TIME_INDEX = 'time';
const DB_VERSION = 1;

export const DEFAULT_DB_NAME = 'Deephaven.Logs';
export const DEFAULT_MAX_ENTRIES = 20000;
export const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_FLUSH_INTERVAL_MS = 2000;
export const DEFAULT_ERROR_FLUSH_INTERVAL_MS = 250;
export const DEFAULT_MAX_ENTRY_LENGTH = 4096;
export const DEFAULT_MAX_STACK_LENGTH = 16384;
export const DEFAULT_MAX_QUOTA_RATIO = 0.8;

/** Bounds memory if flushes are failing or the page is logging faster than it can write */
const MAX_BUFFERED_ENTRIES = 5000;
const FLUSHES_PER_PRUNE = 30;
/** Prunes early once this fraction of maxEntries has been written, so a log storm cannot overshoot the cap by much */
const PRUNE_WRITE_RATIO = 0.1;
/** Fraction of entries dropped when over the quota ratio */
const QUOTA_TRIM_RATIO = 0.25;
/**
 * Quota pressure is measured across the whole origin but only this store can be
 * trimmed, so below this many entries the bloat is someone else's and further
 * trimming would discard logs for no benefit.
 */
const QUOTA_TRIM_FLOOR = 1000;
const SESSION_SEPARATOR = '=====';

/**
 * Caps a single entry so one runaway log line cannot consume the storage budget.
 * @param value - The formatted message or stack
 * @param maxLength - Characters to keep before truncating
 */
function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}... [truncated ${
    value.length - maxLength
  } chars]`;
}

type LogDb = IDBPDatabase<LogDbSchema>;

/**
 * Removes the given entries in one transaction. Every delete request is issued
 * synchronously so the transaction cannot auto-commit partway through the batch.
 * @param db - Open log database
 * @param keys - Primary keys of the entries to remove
 */
async function deleteKeys(db: LogDb, keys: number[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([...keys.map(key => tx.store.delete(key)), tx.done]);
}

/**
 * Enforces the age limit.
 * @param db - Open log database
 * @param cutoff - Epoch ms at or before which entries are removed
 */
async function deleteOlderThan(db: LogDb, cutoff: number): Promise<void> {
  const keys = await db.getAllKeysFromIndex(
    STORE_NAME,
    TIME_INDEX,
    IDBKeyRange.upperBound(cutoff)
  );
  await deleteKeys(db, keys);
}

/**
 * Enforces the count and quota limits.
 * @param db - Open log database
 * @param count - Number of oldest entries to remove; no-op when not positive
 */
async function deleteOldest(db: LogDb, count: number): Promise<void> {
  if (count <= 0) {
    return;
  }
  // Auto-increment keys ascend with insertion order, so the oldest sort first
  const keys = await db.getAllKeys(STORE_NAME);
  await deleteKeys(db, keys.slice(0, count));
}

/**
 * Asks the browser to exempt this origin from automatic eviction. Chrome grants
 * silently, Firefox prompts, and Safari only honors it for installed web apps.
 * @returns Whether protection was granted; false also covers denial and browsers
 * that do not implement the API
 */
async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator?.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/**
 * Persists browser logs to IndexedDB so they survive a reload. Subscribes to
 * the same LogProxy events as LogHistory, but batches writes rather than
 * storing in memory.
 */
export class LogIndexedDbHistory {
  private proxy: LogProxy;

  private dbName: string;

  private maxEntries: number;

  private maxAgeMs: number;

  private flushIntervalMs: number;

  private errorFlushIntervalMs: number;

  private maxEntryLength: number;

  private maxStackLength: number;

  private maxQuotaRatio: number;

  private quotaTrimFloor: number;

  private levels: LOG_PROXY_TYPE[];

  private sessionId = nanoid();

  private buffer: PersistedLogEntry[] = [];

  private dbPromise: Promise<IDBPDatabase<LogDbSchema>> | null = null;

  /** User logged in during the current session; null until the first setUser */
  private sessionUser: string | null = null;

  /**
   * Trailing-edge only, so a burst coalesces into one write and nothing is
   * written during the startup log flood.
   */
  private throttledFlush: ReturnType<typeof throttle<() => void>>;

  /**
   * Leading edge, so the first error is written at once while an error storm
   * still costs at most one transaction per window.
   */
  private throttledErrorFlush: ReturnType<typeof throttle<() => void>>;

  private flushesSincePrune = 0;

  private writesSincePrune = 0;

  /** In-flight prune, so concurrent callers cannot each trim the same overflow */
  private prunePromise: Promise<void> | null = null;

  private isEnabled = false;

  /**
   * In-flight flush. Shared by all callers so a pagehide or export arriving
   * mid-write waits for, and is covered by, the same drain.
   */
  private flushPromise: Promise<void> | null = null;

  private reportError: (...data: unknown[]) => void;

  lastError: unknown = null;

  /**
   * Whether the browser exempted this origin from automatic eviction. When
   * false, entries may be discarded well before the age limit.
   */
  isPersistent = false;

  /**
   * @param proxy - Source of console events; must be enabled for anything to be captured
   * @param options - Retention and batching overrides
   */
  constructor(proxy: LogProxy, options: LogIndexedDbHistoryOptions = {}) {
    this.proxy = proxy;
    this.dbName = options.dbName ?? DEFAULT_DB_NAME;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    this.flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.errorFlushIntervalMs =
      options.errorFlushIntervalMs ?? DEFAULT_ERROR_FLUSH_INTERVAL_MS;
    this.maxEntryLength = options.maxEntryLength ?? DEFAULT_MAX_ENTRY_LENGTH;
    this.maxStackLength = options.maxStackLength ?? DEFAULT_MAX_STACK_LENGTH;
    this.maxQuotaRatio = options.maxQuotaRatio ?? DEFAULT_MAX_QUOTA_RATIO;
    this.quotaTrimFloor = options.quotaTrimFloor ?? QUOTA_TRIM_FLOOR;
    this.levels = options.levels ?? Object.values(LOG_PROXY_TYPE);
    this.reportError = console.error.bind(console);
    this.throttledFlush = throttle(
      () => {
        this.flush();
      },
      this.flushIntervalMs,
      { leading: false, trailing: true }
    );
    this.throttledErrorFlush = throttle(
      () => {
        this.flush();
      },
      this.errorFlushIntervalMs,
      { leading: true, trailing: true }
    );
  }

  /** Identifies the current session. Changes on every reload and every login. */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Attributes subsequent logs to a user, so exports only include that user's
   * logs and logs from before anyone logged in. Each login and logout starts a
   * new session, so a session never mixes users or pre-login entries.
   * @param name - The authenticated user; '' where the server provides no name;
   * null on logout
   */
  setUser(name: string | null): void {
    if (this.sessionUser === name) {
      return;
    }

    // Buffered entries keep the session and user they were logged under
    this.sessionId = nanoid();
    this.sessionUser = name;
  }

  /**
   * Starts capturing. Subscribes to the proxy, schedules periodic flushes, and
   * kicks off a prune to clear out entries left by previous sessions. Silently
   * does nothing where IndexedDB is unavailable, such as private browsing.
   */
  enable(): void {
    if (this.isEnabled) {
      return;
    }

    if (typeof indexedDB === 'undefined') {
      this.reportError(
        'LogIndexedDbHistory: IndexedDB unavailable, log persistence disabled'
      );
      return;
    }

    this.levels.forEach(level => {
      this.proxy.addEventListener(level, this.addHistory);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.handleFlushRequest);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }

    this.isEnabled = true;

    this.prune().catch(this.handleError);
  }

  /**
   * Stops capturing and writes out whatever is still buffered. Persisted
   * entries are left in place; use clear to remove them.
   */
  disable(): void {
    if (!this.isEnabled) {
      return;
    }

    this.levels.forEach(level => {
      this.proxy.removeEventListener(level, this.addHistory);
    });

    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.handleFlushRequest);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }

    // Drop the pending trailing calls; the flush below covers them
    this.throttledFlush.cancel();
    this.throttledErrorFlush.cancel();

    this.isEnabled = false;

    this.flush();
  }

  /**
   * Buffers a console event. Formatting happens here rather than at write time
   * because the raw arguments may be DOM nodes or proxies, which IndexedDB
   * cannot structured-clone. Errors flush immediately; everything else
   * schedules a throttled flush.
   * @param event - Console event dispatched by the proxy
   */
  private addHistory = ({ type, detail }: CustomEvent<unknown[]>): void => {
    const entry: PersistedLogEntry = {
      sessionId: this.sessionId,
      time: Date.now(),
      type: type as LOG_PROXY_TYPE,
      message: truncate(LogHistory.formatMessages(detail), this.maxEntryLength),
    };
    if (this.sessionUser != null) {
      entry.user = this.sessionUser;
    }

    // formatMessages reduces an Error to its message, so capture the stacks here
    const errorStacks = detail
      .filter((arg): arg is Error => arg instanceof Error)
      .flatMap(error => (error.stack != null ? [error.stack] : []))
      .map(stack => truncate(stack, this.maxStackLength));
    if (errorStacks.length > 0) {
      entry.errorStacks = errorStacks;
    }

    let isError = false;
    switch (type) {
      case LOG_PROXY_TYPE.ERROR: {
        // Captures where console.error was called, which the logged arguments don't record
        const { stack } = Error();
        if (stack != null) {
          entry.stack = truncate(stack, this.maxStackLength);
        }
        isError = true;
        break;
      }
      case LOG_PROXY_TYPE.UNCAUGHT_ERROR:
        // The current stack here is only the browser's error event dispatch
        isError = true;
        break;
      default:
        break;
    }

    this.buffer.push(entry);

    if (this.buffer.length > MAX_BUFFERED_ENTRIES) {
      this.buffer.splice(0, this.buffer.length - MAX_BUFFERED_ENTRIES);
    }

    // The in-flight flush drains the buffer before it resolves
    if (this.flushPromise != null) {
      return;
    }

    // Errors often precede a crash or a user-initiated reload, so they cannot
    // wait for the regular window
    if (isError) {
      this.throttledFlush.cancel();
      this.throttledErrorFlush();
    } else {
      this.throttledFlush();
    }
  };

  /** pagehide handler. Flush swallows its own errors. */
  private handleFlushRequest = (): void => {
    this.flush();
  };

  /**
   * Flushes when the page is backgrounded, which is the last reliable chance to
   * write before a mobile browser discards the tab.
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.flush();
    }
  };

  /**
   * Shuts persistence down on an unrecoverable storage error so a failing store
   * cannot stall logging. The error is kept on lastError for debugging.
   * @param error - Failure raised by IndexedDB
   */
  private handleError = (error: unknown): void => {
    this.lastError = error;
    this.buffer = [];
    // Unsubscribe first so the report reaches the in-memory history without
    // re-entering this failing store
    this.disable();
    this.reportError(
      'LogIndexedDbHistory: disabling log persistence after error',
      error
    );
  };

  /**
   * Opens the database once and reuses the promise. A rejection is cached
   * deliberately so repeated failures do not retry on every flush.
   */
  private open(): Promise<IDBPDatabase<LogDbSchema>> {
    if (this.dbPromise == null) {
      this.dbPromise = openDB<LogDbSchema>(this.dbName, DB_VERSION, {
        upgrade(db) {
          const entries = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          entries.createIndex(TIME_INDEX, 'time');
        },
      });
      requestPersistentStorage().then(granted => {
        this.isPersistent = granted;
      });
    }
    return this.dbPromise;
  }

  /**
   * Writes everything buffered, including entries logged while the write is in
   * progress. Concurrent callers share one in-flight flush. Entries are dropped
   * rather than requeued on failure to keep memory bounded.
   */
  flush(): Promise<void> {
    if (this.flushPromise == null) {
      if (this.buffer.length === 0) {
        return Promise.resolve();
      }
      this.flushPromise = this.drain().finally(() => {
        this.flushPromise = null;
        // Covers entries logged after the drain's last check but before this
        if (this.isEnabled && this.buffer.length > 0) {
          this.throttledFlush();
        }
      });
    }
    return this.flushPromise;
  }

  /** Flush implementation. Call flush instead so writes stay serialized. */
  private async drain(): Promise<void> {
    try {
      while (this.buffer.length > 0) {
        const entries = this.buffer;
        this.buffer = [];

        // eslint-disable-next-line no-await-in-loop
        const db = await this.open();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        // eslint-disable-next-line no-await-in-loop
        await Promise.all([
          ...entries.map(entry => tx.store.add(entry)),
          tx.done,
        ]);

        this.flushesSincePrune += 1;
        this.writesSincePrune += entries.length;
        if (
          this.flushesSincePrune >= FLUSHES_PER_PRUNE ||
          this.writesSincePrune >= this.maxEntries * PRUNE_WRITE_RATIO
        ) {
          // eslint-disable-next-line no-await-in-loop
          await this.prune();
        }
      }
    } catch (error) {
      // Clears the buffer and disables, which also ends the drain
      this.handleError(error);
    }
  }

  /**
   * Enforces the age, count, and quota limits. Runs on enable, every
   * FLUSHES_PER_PRUNE flushes, and whenever writes approach the count limit;
   * callers may also invoke it directly.
   * Concurrent calls share one run, since two overlapping prunes would each
   * trim the same overflow and delete twice as much as intended.
   */
  async prune(): Promise<void> {
    if (this.prunePromise == null) {
      this.flushesSincePrune = 0;
      this.writesSincePrune = 0;
      this.prunePromise = this.pruneNow().finally(() => {
        this.prunePromise = null;
      });
    }
    return this.prunePromise;
  }

  /** Prune implementation. Call prune instead so runs stay coalesced. */
  private async pruneNow(): Promise<void> {
    const db = await this.open();

    await deleteOlderThan(db, Date.now() - this.maxAgeMs);
    await deleteOldest(db, (await db.count(STORE_NAME)) - this.maxEntries);

    const count = await db.count(STORE_NAME);
    if (count > this.quotaTrimFloor && (await this.isOverQuota())) {
      const excess = Math.ceil(count * QUOTA_TRIM_RATIO);
      await deleteOldest(db, Math.min(excess, count - this.quotaTrimFloor));
    }
  }

  /**
   * Reports whether the origin is close enough to its storage quota to risk
   * eviction. The estimate covers the whole origin, not just this store, which
   * is the point: eviction clears every database at once, so the command
   * history going over would take these logs with it.
   * @returns False when the browser cannot provide an estimate
   */
  private async isOverQuota(): Promise<boolean> {
    try {
      const estimate = await navigator?.storage?.estimate?.();
      if (
        estimate?.usage == null ||
        !(estimate.quota != null && estimate.quota > 0)
      ) {
        return false;
      }
      return estimate.usage / estimate.quota > this.maxQuotaRatio;
    } catch {
      return false;
    }
  }

  /**
   * Formats the persisted entries visible to the current user, using the same
   * per-line format as LogHistory so both export files parse identically.
   * Includes the current user's entries and entries from before anyone logged
   * in. Entries are ordered by time and headed by a marker whenever the session
   * changes. Pending entries are flushed first.
   * @returns Empty string when nothing visible is persisted
   */
  async getFormattedHistory(): Promise<string> {
    await this.flush();

    const db = await this.open();
    const entries = (await db.getAllFromIndex(STORE_NAME, TIME_INDEX)).filter(
      entry => entry.user == null || entry.user === this.sessionUser
    );

    if (entries.length === 0) {
      return '';
    }

    // Without eviction protection the browser may have dropped older entries,
    // which is the first thing to rule out when history looks truncated
    const lines: string[] = [
      `${SESSION_SEPARATOR} eviction protection: ${
        this.isPersistent ? 'granted' : 'not granted'
      } ${SESSION_SEPARATOR}`,
    ];
    let lastSessionId: string | null = null;

    entries.forEach(entry => {
      if (entry.sessionId !== lastSessionId) {
        const user =
          entry.user == null
            ? ' (not logged in)'
            : ` (user: ${JSON.stringify(entry.user)})`;
        const current = entry.sessionId === this.sessionId ? ' (current)' : '';
        lines.push(
          `${SESSION_SEPARATOR} session ${entry.sessionId}${user}${current} ${SESSION_SEPARATOR}`
        );
        lastSessionId = entry.sessionId;
      }

      const errorStacks = (entry.errorStacks ?? []).map(
        stack =>
          `\n\t${stack
            .split('\n')
            .map(line => line.trim())
            .join('\n\t')}`
      );
      // Labeled so the call site cannot be mistaken for more of the error's frames
      const loggedFrom =
        entry.stack != null
          ? `${
              errorStacks.length > 0 ? '\n\tlogged from:' : ''
            }\n${LogHistory.formatStack(entry.stack, entry.type)}`
          : '';
      lines.push(
        `${new Date(entry.time).toISOString()} ${entry.type}\t${
          entry.message
        }${errorStacks.join('')}${loggedFrom}`
      );
    });

    return lines.join('\n');
  }

  /** Discards every persisted entry across all sessions, plus anything buffered. */
  async clear(): Promise<void> {
    this.buffer = [];
    const db = await this.open();
    await db.clear(STORE_NAME);
  }
}

export default LogIndexedDbHistory;
