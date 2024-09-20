import { type CommandHistoryStorageItem } from '@deephaven/console';
import Log from '@deephaven/log';
import type PouchCommandHistoryTable from './PouchCommandHistoryTable';
import { type PouchStorageItem } from './PouchStorageTable';

type CommandHistoryStorageItemFindResponse = PouchDB.Find.FindResponse<
  CommandHistoryStorageItem & PouchStorageItem
>;

type DatabaseName = string;

const log = Log.module('PouchCommandHistoryCache');

/**
 * Cache for tracking things shared across multiple
 * `PouchCommandHistoryTable` instances.
 */
class PouchCommandHistoryCache {
  constructor() {
    this.isPruning = new Map();
    this.response = new Map();
    this.tableRegistry = new Map();
  }

  /**
   * Keep track of pruning status for a database. This helps ensure only 1
   * pruning operation gets executed if multiple instances of a PouchCommandHistory
   * table load data at the same time.
   */
  isPruning: Map<DatabaseName, boolean>;

  /**
   * Cache for command history query results keyed by db name. The cached data
   * will be shared across all `PouchCommandHistoryTable` instances that have
   * the same db name.
   */
  response: Map<
    DatabaseName,
    Promise<CommandHistoryStorageItemFindResponse> | null
  >;

  /**
   * Keeps track of all `PouchCommandHistoryTable` instances.
   */
  tableRegistry: Map<DatabaseName, Set<PouchCommandHistoryTable>>;

  /**
   * Pauses PouchDB change listeners for any `PouchCommandHistoryTable` with
   * the given database name. This will cancel existing subscriptions and
   * return a callback that can be used to re-subscribe them.
   * @param dbName
   */
  pauseChangeListeners(dbName: DatabaseName): () => void {
    const pausedTables: PouchCommandHistoryTable[] = [];

    this.tableRegistry.get(dbName)?.forEach(table => {
      if (table.changes) {
        log.debug(`Pausing event listeners on '${dbName}' table`, table);
        table.changes.cancel();

        pausedTables.push(table);
      }
    });

    return () => {
      pausedTables.forEach(table => {
        // Resume listening for changes if the table is still in the registry
        if (this.tableRegistry.get(dbName)?.has(table) ?? false) {
          log.debug(`Resuming event listeners on '${dbName}' table`, table);
          table.listenForChanges();
        }
      });
    };
  }
}

export default PouchCommandHistoryCache;
