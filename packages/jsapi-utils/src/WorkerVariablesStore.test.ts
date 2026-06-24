import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  DEFAULT_WORKER_KEY,
  createWorkerVariablesStore,
  getWorkerKey,
} from './WorkerVariablesStore';

const { flushPromises } = TestUtils;

type FieldUpdateListener = (changes: dh.ide.VariableChanges) => void;

function makeDefinition(
  id: string,
  overrides: Partial<dh.ide.VariableDefinition> = {}
): dh.ide.VariableDefinition {
  return {
    id,
    name: id,
    title: id,
    type: 'Table',
    description: '',
    applicationId: '',
    applicationName: '',
    ...overrides,
  } as dh.ide.VariableDefinition;
}

function makeConnection(): {
  connection: dh.IdeConnection;
  emit: (changes: Partial<dh.ide.VariableChanges>) => void;
  subscribeMock: jest.Mock;
  unsubscribeMock: jest.Mock;
} {
  let listener: FieldUpdateListener | null = null;
  const unsubscribeMock = jest.fn(() => {
    listener = null;
  });
  const subscribeMock = jest.fn((cb: FieldUpdateListener) => {
    listener = cb;
    return unsubscribeMock;
  });
  const connection = {
    subscribeToFieldUpdates: subscribeMock,
  } as unknown as dh.IdeConnection;
  return {
    connection,
    subscribeMock,
    unsubscribeMock,
    emit: (changes: Partial<dh.ide.VariableChanges>) => {
      listener?.({
        created: [],
        removed: [],
        updated: [],
        ...changes,
      } as dh.ide.VariableChanges);
    },
  };
}

describe('getWorkerKey', () => {
  it('returns default key for null/undefined/plain descriptors', () => {
    expect(getWorkerKey(null)).toBe(DEFAULT_WORKER_KEY);
    expect(getWorkerKey(undefined)).toBe(DEFAULT_WORKER_KEY);
    expect(getWorkerKey({ type: 'Table', name: 'x' })).toBe(DEFAULT_WORKER_KEY);
  });

  it('prefers querySerial over queryName over sessionId', () => {
    expect(
      getWorkerKey({ querySerial: 'qs', queryName: 'qn', sessionId: 'sid' })
    ).toBe('q:qs');
    expect(getWorkerKey({ queryName: 'qn', sessionId: 'sid' })).toBe('qn:qn');
    expect(getWorkerKey({ sessionId: 'sid' })).toBe('s:sid');
  });

  it('ignores empty-string routing fields', () => {
    expect(
      getWorkerKey({ querySerial: '', queryName: '', sessionId: '' })
    ).toBe(DEFAULT_WORKER_KEY);
  });
});

describe('createWorkerVariablesStore', () => {
  it('returns null snapshot before any updates arrive', async () => {
    const { connection } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const listener = jest.fn();
    store.subscribe('w1', listener);
    expect(store.snapshot('w1')).toBeNull();
  });

  it('opens one subscription and shares it across consumers for the same key', async () => {
    const { connection, subscribeMock, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const a = jest.fn();
    const b = jest.fn();
    store.subscribe('w1', a);
    store.subscribe('w1', b);
    await flushPromises();
    expect(subscribeMock).toHaveBeenCalledTimes(1);
    emit({ created: [makeDefinition('v1')] });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(store.snapshot('w1')).toEqual([makeDefinition('v1')]);
  });

  it('opens separate subscriptions per worker key', async () => {
    const { connection, subscribeMock } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    store.subscribe('w1', jest.fn());
    store.subscribe('w2', jest.fn());
    await flushPromises();
    expect(subscribeMock).toHaveBeenCalledTimes(2);
  });

  it('applies created/updated/removed deltas with stable snapshot identity per delta', async () => {
    const { connection, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    store.subscribe('w1', jest.fn());
    await flushPromises();

    emit({ created: [makeDefinition('a'), makeDefinition('b')] });
    const snap1 = store.snapshot('w1');
    const snap1Again = store.snapshot('w1');
    expect(snap1).toBe(snap1Again);
    expect(snap1?.map(v => v.id)).toEqual(['a', 'b']);

    emit({ created: [makeDefinition('c')] });
    const snap2 = store.snapshot('w1');
    expect(snap2).not.toBe(snap1);
    expect(snap2?.map(v => v.id)).toEqual(['a', 'b', 'c']);

    emit({ removed: [makeDefinition('a')] });
    expect(store.snapshot('w1')?.map(v => v.id)).toEqual(['b', 'c']);

    emit({ updated: [makeDefinition('b', { title: 'b2' })] });
    const snap4 = store.snapshot('w1');
    expect(snap4?.map(v => v.id)).toEqual(['c', 'b']);
    expect(snap4?.find(v => v.id === 'b')?.title).toBe('b2');
  });

  it('closes the underlying subscription when the last listener unsubscribes', async () => {
    const { connection, unsubscribeMock } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const a = jest.fn();
    const b = jest.fn();
    const offA = store.subscribe('w1', a);
    const offB = store.subscribe('w1', b);
    await flushPromises();
    offA();
    expect(unsubscribeMock).not.toHaveBeenCalled();
    offB();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(store.snapshot('w1')).toBeNull();
  });

  it('unsubscribe is idempotent', async () => {
    const { connection, unsubscribeMock } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const off = store.subscribe('w1', jest.fn());
    await flushPromises();
    off();
    off();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('invalidate clears the snapshot, notifies listeners, and re-resolves', async () => {
    const subscribeMock = jest.fn();
    let listener: FieldUpdateListener | null = null;
    const unsubscribeMock = jest.fn(() => {
      listener = null;
    });
    subscribeMock.mockImplementation((cb: FieldUpdateListener) => {
      listener = cb;
      return unsubscribeMock;
    });
    const connection = {
      subscribeToFieldUpdates: subscribeMock,
    } as unknown as dh.IdeConnection;
    const store = createWorkerVariablesStore(async () => connection);

    const onChange = jest.fn();
    store.subscribe('w1', onChange);
    await flushPromises();
    listener?.({
      created: [makeDefinition('a')],
      removed: [],
      updated: [],
    });
    expect(store.snapshot('w1')?.map(v => v.id)).toEqual(['a']);
    onChange.mockClear();

    store.invalidate('w1');
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(store.snapshot('w1')).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);

    await flushPromises();
    expect(subscribeMock).toHaveBeenCalledTimes(2);
    listener?.({
      created: [makeDefinition('b')],
      removed: [],
      updated: [],
    });
    expect(store.snapshot('w1')?.map(v => v.id)).toEqual(['b']);
  });

  it('destroy tears down all entries and stops further updates', async () => {
    const { connection, unsubscribeMock, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const listener = jest.fn();
    store.subscribe('w1', listener);
    await flushPromises();
    store.destroy();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    emit({ created: [makeDefinition('v1')] });
    expect(listener).not.toHaveBeenCalled();
    expect(store.snapshot('w1')).toBeNull();
  });

  it('skips subscription when all listeners leave before connection resolves', async () => {
    let resolve: (c: dh.IdeConnection) => void = () => undefined;
    const connectionPromise = new Promise<dh.IdeConnection>(r => {
      resolve = r;
    });
    const { connection, subscribeMock } = makeConnection();
    const store = createWorkerVariablesStore(() => connectionPromise);
    const off = store.subscribe('w1', jest.fn());
    off();
    resolve(connection);
    await flushPromises();
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('does not subscribe when resolveConnection returns null', async () => {
    const store = createWorkerVariablesStore(async () => null);
    const listener = jest.fn();
    store.subscribe('w1', listener);
    await flushPromises();
    expect(listener).not.toHaveBeenCalled();
    expect(store.snapshot('w1')).toBeNull();
  });

  it('isolates a throwing listener so other listeners still run', async () => {
    const { connection, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    const throwing = jest.fn(() => {
      throw new Error('listener boom');
    });
    const other = jest.fn();
    store.subscribe('w1', throwing);
    store.subscribe('w1', other);
    await flushPromises();
    expect(() => emit({ created: [makeDefinition('v1')] })).not.toThrow();
    expect(throwing).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledTimes(1);
    expect(store.snapshot('w1')?.map(v => v.id)).toEqual(['v1']);
  });

  it('swallows errors thrown while unsubscribing from field updates', async () => {
    const unsubscribeMock = jest.fn(() => {
      throw new Error('unsubscribe boom');
    });
    const subscribeMock = jest.fn(() => unsubscribeMock);
    const connection = {
      subscribeToFieldUpdates: subscribeMock,
    } as unknown as dh.IdeConnection;
    const store = createWorkerVariablesStore(async () => connection);
    const off = store.subscribe('w1', jest.fn());
    await flushPromises();
    expect(() => off()).not.toThrow();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(store.snapshot('w1')).toBeNull();
  });

  it('does not start a second subscription while one is already resolving', async () => {
    let resolve: (c: dh.IdeConnection) => void = () => undefined;
    const connectionPromise = new Promise<dh.IdeConnection>(r => {
      resolve = r;
    });
    const { connection, subscribeMock } = makeConnection();
    const resolveConnection = jest.fn(() => connectionPromise);
    const store = createWorkerVariablesStore(resolveConnection);
    store.subscribe('w1', jest.fn());
    // First start is mid-flight (resolving); invalidate kicks off a second
    // start which must bail out early instead of resolving again.
    store.invalidate('w1');
    expect(resolveConnection).toHaveBeenCalledTimes(1);
    resolve(connection);
    await flushPromises();
    // The original resolve is stale (generation bumped), so no subscription.
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('logs and recovers when resolveConnection rejects', async () => {
    const store = createWorkerVariablesStore(async () => {
      throw new Error('resolve boom');
    });
    const listener = jest.fn();
    store.subscribe('w1', listener);
    await flushPromises();
    expect(listener).not.toHaveBeenCalled();
    expect(store.snapshot('w1')).toBeNull();
  });

  it('matches deltas by name/title when id is absent', async () => {
    const { connection, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    store.subscribe('w1', jest.fn());
    await flushPromises();

    // Definitions without an id (id omitted) must still be tracked by name.
    const a = makeDefinition('a', { id: undefined as unknown as string });
    const b = makeDefinition('b', { id: undefined as unknown as string });
    emit({ created: [a, b] });
    expect(store.snapshot('w1')?.map(v => v.name)).toEqual(['a', 'b']);

    // Removing by name (no id) should drop the matching entry, not all.
    emit({
      removed: [makeDefinition('a', { id: undefined as unknown as string })],
    });
    expect(store.snapshot('w1')?.map(v => v.name)).toEqual(['b']);

    // Updating by name replaces in place and moves to the end.
    emit({
      updated: [
        makeDefinition('b', {
          id: undefined as unknown as string,
          title: 'b2',
        }),
      ],
    });
    const snap = store.snapshot('w1');
    expect(snap?.map(v => v.name)).toEqual(['b']);
    expect(snap?.find(v => v.name === 'b')?.title).toBe('b2');
  });

  it('keeps keyless items instead of dropping them on a delta', async () => {
    const { connection, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    store.subscribe('w1', jest.fn());
    await flushPromises();

    const keyless = makeDefinition('', {
      id: undefined as unknown as string,
      name: '',
      title: '',
    });
    emit({ created: [keyless, makeDefinition('a')] });
    expect(store.snapshot('w1')).toHaveLength(2);

    // An unrelated delta must not drop the keyless item.
    emit({ removed: [makeDefinition('a')] });
    const snap = store.snapshot('w1');
    expect(snap).toHaveLength(1);
    expect(snap?.[0]).toBe(keyless);
  });
});
