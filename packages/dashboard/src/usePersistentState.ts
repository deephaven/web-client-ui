import {
  useContext,
  useDebugValue,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { nanoid } from 'nanoid';
import { PersistentStateContext } from './PersistentStateContext';
import { useDhId } from './useDhId';

export type PersistentStateMigration = {
  from: number;
  migrate: (state: unknown) => unknown;
};

/**
 * Migrates persisted state to the provided version using the provided migrations.
 *
 * @param state The current state
 * @param from The current version
 * @param to The version to migrate to
 * @param migrations The list of all migrations (may include those already applied)
 * @param type The type of the state. Used for better error messages
 * @returns The state at the new version
 * @throws Error if trying to migrate backwards or no migration exists for the to version
 */
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

    try {
      migratedState = migration.migrate(migratedState);
      currentVersion += 1;
    } catch (e) {
      throw new Error(
        `Error migrating persisted state ${type} from version ${migration.from}: ${e}`,
        { cause: e }
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
 * @param config.type The type of the state. This identifier is used to validate the state being rehydrated. Should be unique to your component.
 * @param config.version The version of the state. This should be an integer, and is used to determine if the state needs to be migrated. Value should be incremented when data structure changes for this type.
 * @param config.migrations An array of migrations to apply to the state if the version of the persisted state is below the current version. Each migration increments the version by 1.
 * @param config.migrations.from The starting version of the migration. The migration will increment the version by 1.
 * @param config.migrations.migrate The function to call to migrate the state.
 * @param config.deleteOnUnmount If true, the state will be deleted from the PersistentStateProvider when the component using this hook is unmounted. Defaults to true.
 *                               May be useful to set to false for components which are conditionally rendered within a panel like console creator settings.
 * @returns [state, setState] tuple just like useState.
 */
export function usePersistentState<S>(
  initialState: S | (() => S),
  config: {
    type: string;
    version: number;
    migrations?: PersistentStateMigration[];
    deleteOnUnmount?: boolean;
  }
): [state: S, setState: Dispatch<SetStateAction<S>>] {
  const panelId = useDhId();
  const hookId = useMemo(() => nanoid(), []);
  const context = useContext(PersistentStateContext);
  const { type, version, migrations = [], deleteOnUnmount = true } = config;

  const [state, setState] = useState<S>(() => {
    const persistedData =
      panelId != null ? context?.getState<S>(panelId, type) : undefined;
    if (persistedData == null) {
      return typeof initialState === 'function'
        ? (initialState as () => S)()
        : initialState;
    }

    if (persistedData.version !== version) {
      return migrateState(
        persistedData.state,
        persistedData.version,
        version,
        migrations,
        type
      ) as S;
    }

    return persistedData.state;
  });

  const stateWithConfig = useMemo(
    () => ({
      type,
      version,
      state,
    }),
    [state, type, version]
  );

  useDebugValue(stateWithConfig);

  useEffect(
    function addState() {
      if (panelId != null) {
        context?.addState(hookId, panelId, stateWithConfig);
      }
    },
    [context, hookId, panelId, stateWithConfig]
  );

  useEffect(
    function removeOnUnmount() {
      return () => {
        if (deleteOnUnmount && panelId != null) {
          context?.removeState(hookId, panelId, type);
        }
      };
    },
    [context, deleteOnUnmount, hookId, panelId, type]
  );

  useEffect(
    () => () => {
      if (panelId != null) {
        context?.deregisterHook(hookId, panelId, type);
      }
    },
    [context, hookId, panelId, type]
  );

  return [state, setState];
}

export default usePersistentState;
