import React from 'react';
import { act, renderHook } from '@testing-library/react';
import type { dh } from '@deephaven/jsapi-types';
import type { WorkerVariablesStore } from '@deephaven/jsapi-utils';
import WorkerVariablesContext from './WorkerVariablesContext';
import useWorkerVariables from './useWorkerVariables';

function makeStore(initial: dh.ide.VariableDefinition[] | null = null): {
  store: WorkerVariablesStore;
  push: (next: dh.ide.VariableDefinition[] | null) => void;
  subscribeMock: jest.Mock;
} {
  let current = initial;
  const listeners = new Set<() => void>();
  const subscribeMock = jest.fn((_key: string, listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  });
  const store: WorkerVariablesStore = {
    snapshot: () => current,
    subscribe: subscribeMock as unknown as WorkerVariablesStore['subscribe'],
    invalidate: jest.fn(),
    destroy: jest.fn(),
  };
  return {
    store,
    subscribeMock,
    push: next => {
      current = next;
      listeners.forEach(l => l());
    },
  };
}

function wrapperWith(
  store: WorkerVariablesStore | null
): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WorkerVariablesContext.Provider value={store}>
        {children}
      </WorkerVariablesContext.Provider>
    );
  };
}

describe('useWorkerVariables', () => {
  it('returns null with no provider', () => {
    const { result } = renderHook(() => useWorkerVariables({ type: 'Table' }));
    expect(result.current).toBeNull();
  });

  it('returns null when the store has no snapshot yet', () => {
    const { store } = makeStore();
    const { result } = renderHook(() => useWorkerVariables({ type: 'Table' }), {
      wrapper: wrapperWith(store),
    });
    expect(result.current).toBeNull();
  });

  it('re-renders when the store pushes a new snapshot', () => {
    const { store, push } = makeStore();
    const { result } = renderHook(() => useWorkerVariables({ type: 'Table' }), {
      wrapper: wrapperWith(store),
    });
    expect(result.current).toBeNull();

    const next = [
      { id: 'a', name: 'a', type: 'Table' } as dh.ide.VariableDefinition,
    ];
    act(() => {
      push(next);
    });
    expect(result.current).toBe(next);
  });

  it('uses the worker key derived from the descriptor', () => {
    const { store, subscribeMock } = makeStore();
    renderHook(
      () =>
        useWorkerVariables({ querySerial: 'qs' } as Record<string, unknown>),
      { wrapper: wrapperWith(store) }
    );
    expect(subscribeMock).toHaveBeenCalledWith('q:qs', expect.any(Function));
  });
});
