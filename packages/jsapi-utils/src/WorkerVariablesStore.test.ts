import type { dh } from '@deephaven/jsapi-types';
import {
  DEFAULT_WORKER_KEY,
  createWorkerVariablesStore,
  getWorkerKey,
} from './WorkerVariablesStore';

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
  function flushMicrotasks(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

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
    await flushMicrotasks();
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
    await flushMicrotasks();
    expect(subscribeMock).toHaveBeenCalledTimes(2);
  });

  it('applies created/updated/removed deltas with stable snapshot identity per delta', async () => {
    const { connection, emit } = makeConnection();
    const store = createWorkerVariablesStore(async () => connection);
    store.subscribe('w1', jest.fn());
    await flushMicrotasks();

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
    await flushMicrotasks();
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
    await flushMicrotasks();
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
    await flushMicrotasks();
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

    await flushMicrotasks();
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
    await flushMicrotasks();
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
    await flushMicrotasks();
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('does not subscribe when resolveConnection returns null', async () => {
    const store = createWorkerVariablesStore(async () => null);
    const listener = jest.fn();
    store.subscribe('w1', listener);
    await flushMicrotasks();
    expect(listener).not.toHaveBeenCalled();
    expect(store.snapshot('w1')).toBeNull();
  });
});
