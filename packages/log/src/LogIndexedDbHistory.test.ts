import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import LogIndexedDbHistory from './LogIndexedDbHistory';
import LogProxy, { LOG_PROXY_TYPE } from './LogProxy';

let proxy: LogProxy;
let history: LogIndexedDbHistory;
let dbCount = 0;

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
    expect(formatted).toContain(`===== session ${first.getSessionId()} =====`);
    expect(formatted).toContain(
      `===== session ${history.getSessionId()} (current) =====`
    );
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
