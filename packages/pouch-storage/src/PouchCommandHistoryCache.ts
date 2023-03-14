import { CommandHistoryStorageItem } from '@deephaven/console';
import Log from '@deephaven/log';
import PouchCommandHistoryTable from './PouchCommandHistoryTable';
import { PouchStorageItem } from './PouchStorageTable';

type CommandHistoryStorageItemFindResponse = PouchDB.Find.FindResponse<
  CommandHistoryStorageItem & PouchStorageItem
>;

type DatabaseName = string;

const log = Log.module('PouchCommandHistoryCache');

/**
 * Static cache for tracking things shared across multiople
 * `PouchCommandHistoryTable` instances.
 */
class PouchCommandHistoryCache {
  /**
   * Keep track of pruning status for a database. This helps ensure only 1
   * pruning operation gets executed if multiple instances of a PouchCommandHistory
   * table load data at the same time.
   */
  static isPruning: Map<DatabaseName, boolean> = new Map();

  /**
   * Cache for command history query results keyed by db name. The cached data
   * will be shared across all `PouchCommandHistoryTable` instances that have
   * the same db name.
   */
  static response: Map<
    DatabaseName,
    Promise<CommandHistoryStorageItemFindResponse> | null
  > = new Map();

  /**
   * Keeps track of all `PouchCommandHistoryTable` instances.
   */
  static tableRegistry: Map<
    DatabaseName,
    Set<PouchCommandHistoryTable>
  > = new Map();

  /**
   * Pauses PouchDB change listeners for any `PouchCommandHistoryTables` with
   * the given database name. This will cancel existing subscriptions and
   * return a callback that can be used to re-subscribe them.
   * @param dbName
   */
  static pauseChangeListeners(dbName: DatabaseName): () => void {
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
        log.debug(`Resuming event listeners on '${dbName}' table`, table);
        table.listenForChanges();
      });
    };
  }
}

export default PouchCommandHistoryCache;
