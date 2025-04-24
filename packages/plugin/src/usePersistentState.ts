import {
  useContext,
  useDebugValue,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { nanoid } from 'nanoid';
import { PersistentStateContext } from './PersistentStateContext';

export type PersistentStateMigration = {
  from: number;
  to: number;
  migrate: (state: unknown) => unknown;
};

function migrateState(
  state: unknown,
  from: number,
  to: number,
  migrations: PersistentStateMigration[],
  type: string
): unknown {
  if (from > to) {
    throw new Error(
      `Persisted state ${type} is a newer version than the current version. Persisted version: ${from}. Current version: ${to}`
    );
  }

  let migratedState = state;
  let currentVersion = from;
  while (currentVersion < to) {
    // eslint-disable-next-line no-loop-func
    const possibleMigration = migrations.filter(m => m.from === currentVersion);
    if (possibleMigration.length === 0) {
      throw new Error(
        `No migration found for persisted state ${type} from version ${currentVersion}`
      );
    }

    if (possibleMigration.length > 1) {
      throw new Error(
        `Multiple migrations found for persisted state ${type} from version ${currentVersion}`
      );
    }

    const migration = possibleMigration[0];

    if (migration.from >= migration.to) {
      throw new Error(
        `Migration for persisted state ${type} has an invalid version change. From ${migration.from} to ${migration.to}`
      );
    }

    try {
      migratedState = migration.migrate(migratedState);
      currentVersion = migration.to;
    } catch (e) {
      throw new Error(
        `Error migrating persisted state ${type} from version ${migration.from} to ${migration.to}: ${e}`
      );
    }
  }
  return migratedState;
}

/**
 * Functions identically to useState except that a PersistentStateProvider can be used to
 * track all calls to this hook and persist the value for future page loads.
 * Primarily used in Deephaven UI so we can persist state of multiple components within a panel.
 *
 * @param initialState The initial state if there is no previously persisted state.
 * @param config.type The type of the state. This identifier is used to validate the state being rehydrated.
 * @param config.version The version of the state. This is used to determine if the state needs to be migrated.
 * @param config.migrations An array of migrations to apply to the state if the version of the persisted state is below the current version.
 * @param config.migrations.from The version to migrate from.
 * @param config.migrations.to The version to migrate to.
 * @param config.migrations.migrate The function to call to migrate the state.
 * @returns [state, setState] tuple just like useState.
 */
export function usePersistentState<S>(
  initialState: S | (() => S),
  config: {
    type: string;
    version: number;
    migrations?: PersistentStateMigration[];
  }
): [state: S, setState: Dispatch<SetStateAction<S>>] {
  // We use this id to track if the component re-renders due to calling setState in its render function.
  // Otherwise, usePersistentState might be called twice by the same component in the same render cycle before flushing in the provider.
  const [id] = useState(() => nanoid());
  const context = useContext(PersistentStateContext);
  const { value: persistedData, done } = context?.getInitialState<S>(id) ?? {
    value: undefined,
    done: true,
  };

  // If not done, then we can use the persisted state
  // Otherwise, we have exhausted the persisted state
  // By checking done, we are able to explicitly save undefined as a state value
  const [state, setState] = useState<S>(() => {
    if (persistedData == null || done) {
      return typeof initialState === 'function'
        ? (initialState as () => S)()
        : initialState;
    }

    if (persistedData.type !== config.type) {
      throw new Error(
        `usePersistentState type mismatch. Expected ${config.type} but got ${persistedData.type}.`
      );
    }

    if (persistedData.version !== config.version) {
      return migrateState(
        persistedData.state,
        persistedData.version,
        config.version,
        config.migrations ?? [],
        config.type
      ) as S;
    }

    return persistedData.state;
  });

  const stateWithConfig = { type: config.type, version: config.version, state };

  useDebugValue(stateWithConfig);

  context?.addState(id, stateWithConfig);

  // This won't cause unnecessary renders on initial mount because the state is already tracking,
  // so calls to scheduleStateUpdate will be no-ops since tracking finishes in an effect at the provider after this effect.
  // When a component mounts after the parents have already rendered, this will trigger a re-render to track the new state immediately.
  useEffect(
    function scheduleUpdateOnMountAndChange() {
      context?.scheduleStateUpdate();
    },
    [context, state]
  );

  useEffect(
    function scheduleUpdateOnUnmount() {
      return () => {
        context?.scheduleStateUpdate();
      };
    },
    [context]
  );

  return [state, setState];
}

export default usePersistentState;
