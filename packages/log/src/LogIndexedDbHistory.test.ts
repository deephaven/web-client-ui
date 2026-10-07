import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import LogHistory from './LogHistory';
import LogIndexedDbHistory, {
  type PersistedLogEntry,
} from './LogIndexedDbHistory';
import LogProxy, { LOG_PROXY_TYPE } from './LogProxy';

let proxy: LogProxy;
let history: LogIndexedDbHistory;
let dbCount = 0;

/**
 * Reads the store directly, so it does not trigger the flush that
 * getFormattedHistory performs. Polls because writes are fire-and-forget.
 */
async function waitForPersisted(
  dbName: string,
  message: string
): Promise<PersistedLogEntry[]> {
  let entries: PersistedLogEntry[] = [];

  for (let i = 0; i < 100; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const db = await openDB(dbName);
    // eslint-disable-next-line no-await-in-loop
    entries = (await db.getAll('entries')) as PersistedLogEntry[];
    db.close();

    if (entries.some(entry => entry.message === message)) {
      return entries;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => {
      setTimeout(resolve, 5);
    });
  }

  return entries;
}

function makeHistory(
  options: ConstructorParameters<typeof LogIndexedDbHistory>[1] = {}
): LogIndexedDbHistory {
  dbCount += 1;
  return new LogIndexedDbHistory(proxy, {
    dbName: `test-logs-${dbCount}`,
    flushIntervalMs: 100000,
    ...options,
  });
}

beforeEach(() => {
  // Each test gets an isolated IndexedDB
  globalThis.indexedDB = new IDBFactory();
  proxy = new LogProxy();
  proxy.enable();
});

afterEach(() => {
  history?.disable();
  proxy.disable();
});

describe('writing', () => {
  it('flushes pending entries when history is read', async () => {
    history = makeHistory();
    history.enable();

    // eslint-disable-next-line no-console
    console.log('buffered');

    expect(await history.getFormattedHistory()).toContain('buffered');
  });

  it('persists entries so they are readable after a flush', async () => {
    history = makeHistory();
    history.enable();

    // eslint-disable-next-line no-console
    console.log('hello', 'world');
    await history.flush();

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain(`${LOG_PROXY_TYPE.LOG}\thello\tworld`);
  });

  it('records a stack for errors and uncaught errors only', async () => {
    history = makeHistory();
    history.enable();

    /* eslint-disable no-console */
    console.log('plain log');
    console.error('an error');
    /* eslint-enable no-console */
    await history.flush();

    const lines = (await history.getFormattedHistory()).split('\n');
    const logLine = lines.findIndex(l => l.includes('plain log'));
    const errorLine = lines.findIndex(l => l.includes('an error'));

    expect(lines[logLine + 1]).not.toMatch(/^\s/);
    expect(lines[errorLine + 1]).toMatch(/^\s/);
  });

  it('persists errors without waiting for a flush', async () => {
    const dbName = 'test-logs-error-flush';
    history = new LogIndexedDbHistory(proxy, {
      dbName,
      flushIntervalMs: 100000,
    });
    history.enable();

    /* eslint-disable no-console */
    console.log('waits for the next tick');
    console.error('written immediately');
    /* eslint-enable no-console */

    const persisted = await waitForPersisted(dbName, 'written immediately');
    expect(persisted.map(entry => entry.message)).toContain(
      'written immediately'
    );
    // The error flush drains the whole buffer, so earlier entries ride along
    expect(persisted).toHaveLength(2);
  });

  it('coalesces an error storm into a bounded number of writes', async () => {
    const dbName = 'test-logs-error-storm';
    history = new LogIndexedDbHistory(proxy, {
      dbName,
      flushIntervalMs: 100000,
      errorFlushIntervalMs: 100000,
    });
    history.enable();
    await history.prune();

    /* eslint-disable no-console */
    for (let i = 0; i < 100; i += 1) {
      console.error(`storm ${i}`);
    }
    /* eslint-enable no-console */

    const persisted = await waitForPersisted(dbName, 'storm 0');

    // The leading edge writes once; the remaining errors wait for the trailing
    // edge rather than each opening their own transaction
    expect(persisted.length).toBeLessThan(100);
    expect(persisted.map(entry => entry.message)).toContain('storm 0');

    // Nothing is lost, it is just written later
    expect(await history.getFormattedHistory()).toContain('storm 99');
  });

  it('does not write non-error entries immediately', async () => {
    const dbName = 'test-logs-throttle-defer';
    history = new LogIndexedDbHistory(proxy, {
      dbName,
      flushIntervalMs: 100000,
    });
    history.enable();
    await history.prune();

    // eslint-disable-next-line no-console
    console.log('still buffered');

    const db = await openDB(dbName);
    const persisted = await db.getAll('entries');
    db.close();

    expect(persisted).toHaveLength(0);
  });

  it('writes buffered entries once the throttle window elapses', async () => {
    const dbName = 'test-logs-throttle-window';
    history = new LogIndexedDbHistory(proxy, { dbName, flushIntervalMs: 10 });
    history.enable();

    // eslint-disable-next-line no-console
    console.log('flushed by throttle');

    const persisted = await waitForPersisted(dbName, 'flushed by throttle');
    expect(persisted.map(entry => entry.message)).toContain(
      'flushed by throttle'
    );
  });

  it('truncates entries longer than maxEntryLength', async () => {
    history = makeHistory({ maxEntryLength: 10 });
    history.enable();

    // eslint-disable-next-line no-console
    console.log('x'.repeat(50));
    await history.flush();

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain('xxxxxxxxxx... [truncated 40 chars]');
    expect(formatted).not.toContain('x'.repeat(11));
  });

  it('ignores levels that are not subscribed', async () => {
    history = makeHistory({ levels: [LOG_PROXY_TYPE.ERROR] });
    history.enable();

    /* eslint-disable no-console */
    console.log('ignored');
    console.error('kept');
    /* eslint-enable no-console */
    await history.flush();

    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('ignored');
    expect(formatted).toContain('kept');
  });
});

describe('eviction protection', () => {
  it.each([
    [true, 'granted'],
    [false, 'not granted'],
  ])('reports persist() returning %s in the history', async (granted, text) => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        persist: jest.fn().mockResolvedValue(granted),
        estimate: jest.fn().mockResolvedValue({ usage: 1, quota: 100 }),
      },
    });

    history = makeHistory();
    history.enable();
    await history.prune();

    // eslint-disable-next-line no-console
    console.log('an entry');

    expect(await history.getFormattedHistory()).toContain(
      `eviction protection: ${text}`
    );
    expect(history.isPersistent).toBe(granted);
  });

  it('omits the header when nothing is persisted', async () => {
    history = makeHistory();
    history.enable();

    expect(await history.getFormattedHistory()).toBe('');
  });
});

describe('cross-session persistence', () => {
  it('retains entries written by a previous session', async () => {
    const dbName = 'test-logs-shared';

    const first = new LogIndexedDbHistory(proxy, { dbName });
    first.enable();
    // eslint-disable-next-line no-console
    console.log('from first session');
    await first.flush();
    first.disable();

    // Simulates a reload: new instance, new session id, same database
    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    // eslint-disable-next-line no-console
    console.log('from second session');

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain('from first session');
    expect(formatted).toContain('from second session');
    expect(first.getSessionId()).not.toBe(history.getSessionId());
  });

  it('groups entries by session and marks the current one', async () => {
    const dbName = 'test-logs-grouped';

    const first = new LogIndexedDbHistory(proxy, { dbName });
    first.enable();
    // eslint-disable-next-line no-console
    console.log('old');
    await first.flush();
    first.disable();

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    // eslint-disable-next-line no-console
    console.log('new');

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain(
      `===== session ${first.getSessionId()} (not logged in) =====`
    );
    expect(formatted).toContain(
      `===== session ${history.getSessionId()} (not logged in) (current) =====`
    );
  });
});

describe('user-scoped export', () => {
  /**
   * Simulates one page load: optionally logs before login, logs in, logs
   * after login, then unloads.
   */
  async function pageLoad(
    dbName: string,
    user: string | null,
    { before, after }: { before?: string; after?: string }
  ): Promise<LogIndexedDbHistory> {
    const page = new LogIndexedDbHistory(proxy, { dbName });
    page.enable();
    /* eslint-disable no-console */
    if (before != null) {
      console.log(before);
    }
    if (user != null) {
      page.setUser(user);
    }
    if (after != null) {
      console.log(after);
    }
    /* eslint-enable no-console */
    await page.flush();
    page.disable();
    return page;
  }

  it("hides another user's logs but shares pre-login logs", async () => {
    const dbName = 'test-logs-users';
    await pageLoad(dbName, 'alice', {
      before: 'alice pre-login',
      after: 'alice private',
    });

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    history.setUser('bob');

    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('alice private');
    expect(formatted).toContain('alice pre-login');
  });

  it("keeps a user's earlier sessions after another user logs in", async () => {
    const dbName = 'test-logs-returning-user';
    await pageLoad(dbName, 'alice', { after: 'alice first' });
    await pageLoad(dbName, 'bob', { after: 'bob only' });

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    history.setUser('alice');
    // eslint-disable-next-line no-console
    console.log('alice second');

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain('alice first');
    expect(formatted).toContain('alice second');
    expect(formatted).not.toContain('bob only');
  });

  it('only shows unbound sessions before anyone logs in', async () => {
    const dbName = 'test-logs-logged-out';
    await pageLoad(dbName, 'alice', {
      before: 'login screen',
      after: 'alice private',
    });

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain('login screen');
    expect(formatted).not.toContain('alice private');
  });

  it('starts a new session when a different user logs in without a reload', async () => {
    const dbName = 'test-logs-in-tab-switch';
    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();

    history.setUser('alice');
    const aliceSession = history.getSessionId();
    // eslint-disable-next-line no-console
    console.log('alice private');

    history.setUser('bob');
    expect(history.getSessionId()).not.toBe(aliceSession);

    // Buffered before the switch, so it stays in alice's session
    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('alice private');
  });

  it('keeps the session when the same user is set again', () => {
    history = makeHistory();
    history.enable();

    history.setUser('alice');
    const sessionId = history.getSessionId();
    history.setUser('alice');

    expect(history.getSessionId()).toBe(sessionId);
  });

  it('binds a session whose user was set before enable', async () => {
    const dbName = 'test-logs-set-before-enable';
    const page = new LogIndexedDbHistory(proxy, { dbName });
    page.setUser('alice');
    page.enable();
    // eslint-disable-next-line no-console
    console.log('alice private');
    await page.flush();
    page.disable();

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    history.setUser('bob');

    expect(await history.getFormattedHistory()).not.toContain('alice private');
  });

  it('labels each session with its user', async () => {
    const dbName = 'test-logs-labels';
    const alice = await pageLoad(dbName, 'alice', { after: 'alice private' });

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    // eslint-disable-next-line no-console
    console.log('login screen');
    const preLogin = history.getSessionId();
    history.setUser('alice');
    // eslint-disable-next-line no-console
    console.log('alice again');

    const formatted = await history.getFormattedHistory();
    expect(formatted).toContain(
      `===== session ${alice.getSessionId()} (user: "alice") =====`
    );
    expect(formatted).toContain(
      `===== session ${preLogin} (not logged in) =====`
    );
    expect(formatted).toContain(
      `===== session ${history.getSessionId()} (user: "alice") (current) =====`
    );
  });

  it('keeps the current session bound after clear', async () => {
    const dbName = 'test-logs-clear-binding';
    const page = new LogIndexedDbHistory(proxy, { dbName });
    page.enable();
    page.setUser('alice');
    await page.clear();
    // eslint-disable-next-line no-console
    console.log('alice after clear');
    await page.flush();
    page.disable();

    history = new LogIndexedDbHistory(proxy, { dbName });
    history.enable();
    history.setUser('bob');

    expect(await history.getFormattedHistory()).not.toContain(
      'alice after clear'
    );
  });

  it('prunes bindings for sessions with no remaining entries', async () => {
    const dbName = 'test-logs-orphans';
    const alice = await pageLoad(dbName, 'alice', { after: 'alice private' });

    history = new LogIndexedDbHistory(proxy, { dbName, maxEntries: 0 });
    history.enable();
    history.setUser('bob');
    await history.getFormattedHistory();
    await history.prune();

    const db = await openDB(dbName);
    const sessionIds = await db.getAllKeys('sessions');
    db.close();

    expect(sessionIds).not.toContain(alice.getSessionId());
    expect(sessionIds).toContain(history.getSessionId());
  });
});

describe('pruning', () => {
  it('drops entries older than maxAgeMs', async () => {
    // fake-indexeddb schedules its own work on real timers, so only Date is faked
    const now = jest.spyOn(Date, 'now');
    try {
      const start = new Date('2026-01-01T00:00:00Z').getTime();
      now.mockReturnValue(start);

      history = makeHistory({ maxAgeMs: 1000 });
      history.enable();
      await history.prune();
      // eslint-disable-next-line no-console
      console.log('stale entry');
      await history.flush();

      now.mockReturnValue(start + 60000);
      // eslint-disable-next-line no-console
      console.log('fresh entry');
      await history.flush();

      await history.prune();

      const formatted = await history.getFormattedHistory();
      expect(formatted).not.toContain('stale entry');
      expect(formatted).toContain('fresh entry');
    } finally {
      now.mockRestore();
    }
  });

  it('drops the oldest entries over maxEntries', async () => {
    history = makeHistory({ maxEntries: 2 });
    history.enable();
    // Settles the prune kicked off by enable so it cannot overlap the one below
    await history.prune();

    /* eslint-disable no-console */
    console.log('first');
    console.log('second');
    console.log('third');
    /* eslint-enable no-console */
    await history.flush();

    await history.prune();

    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('first');
    expect(formatted).toContain('second');
    expect(formatted).toContain('third');
  });

  it('trims the oldest entries when over the quota ratio', async () => {
    const estimate = jest.fn().mockResolvedValue({ usage: 95, quota: 100 });
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate, persist: jest.fn().mockResolvedValue(true) },
    });

    history = makeHistory({ maxQuotaRatio: 0.8, quotaTrimFloor: 1 });
    history.enable();
    await history.prune();

    /* eslint-disable no-console */
    console.log('oldest');
    console.log('newest');
    /* eslint-enable no-console */
    await history.flush();

    await history.prune();

    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('oldest');
    expect(formatted).toContain('newest');
  });

  it('stops quota trimming at the floor when other storage is the bloat', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      // Permanently over quota, as if command history were filling the origin
      value: {
        estimate: jest.fn().mockResolvedValue({ usage: 99, quota: 100 }),
        persist: jest.fn().mockResolvedValue(true),
      },
    });

    history = makeHistory({ maxQuotaRatio: 0.8, quotaTrimFloor: 2 });
    history.enable();
    await history.prune();

    /* eslint-disable no-console */
    console.log('first');
    console.log('second');
    console.log('third');
    /* eslint-enable no-console */
    await history.flush();

    // Repeated prunes must not drain the store, since trimming cannot relieve
    // pressure we are not causing
    await history.prune();
    await history.prune();
    await history.prune();

    const formatted = await history.getFormattedHistory();
    expect(formatted).not.toContain('first');
    expect(formatted).toContain('second');
    expect(formatted).toContain('third');
  });
});

describe('failure handling', () => {
  it('reports storage failures to the in-memory history', async () => {
    const memoryHistory = new LogHistory(proxy);
    memoryHistory.enable();
    const open = jest
      .spyOn(
        LogIndexedDbHistory.prototype as unknown as {
          open: () => Promise<unknown>;
        },
        'open'
      )
      .mockRejectedValue(new Error('open blew up'));

    try {
      history = makeHistory();
      history.enable();
      // eslint-disable-next-line no-console
      console.log('entry');
      await history.flush();

      expect(history.lastError).toBeInstanceOf(Error);
      expect(memoryHistory.getFormattedHistory()).toContain(
        'disabling log persistence'
      );
    } finally {
      open.mockRestore();
      memoryHistory.disable();
    }
  });
  it('disables itself when IndexedDB is unavailable', () => {
    const original = globalThis.indexedDB;
    // @ts-expect-error forcing the unsupported case
    delete globalThis.indexedDB;
    const reportError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      history = makeHistory();
      history.enable();

      // eslint-disable-next-line no-console
      console.log('should not be captured');
      expect(reportError).toHaveBeenCalled();
    } finally {
      reportError.mockRestore();
      globalThis.indexedDB = original;
    }
  });

  it('does not recurse when a flush failure logs an error', async () => {
    history = makeHistory();
    history.enable();

    // eslint-disable-next-line no-console
    console.log('entry');

    const reportError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const open = jest
      .spyOn(
        LogIndexedDbHistory.prototype as unknown as {
          open: () => Promise<unknown>;
        },
        'open'
      )
      .mockImplementation(() => {
        // Mimics an IndexedDB failure path that logs through the patched console
        // eslint-disable-next-line no-console
        console.error('open blew up');
        return Promise.reject(new Error('open blew up'));
      });

    try {
      await expect(history.flush()).resolves.toBeUndefined();
      expect(reportError).toHaveBeenCalled();
    } finally {
      open.mockRestore();
      reportError.mockRestore();
    }
  });
});

describe('clear', () => {
  it('removes all persisted entries', async () => {
    history = makeHistory();
    history.enable();

    // eslint-disable-next-line no-console
    console.log('to be cleared');
    await history.flush();
    expect(await history.getFormattedHistory()).toContain('to be cleared');

    await history.clear();
    expect(await history.getFormattedHistory()).toBe('');
  });
});
