import {
  CommandHistoryStorageItem,
  CommandHistoryTable,
} from '@deephaven/console';
import { FilterType } from '@deephaven/iris-grid/dist/filters';
import { StorageUtils } from '@deephaven/storage';
import PouchStorageTable from './PouchStorageTable';

export class PouchCommandHistoryTable
  extends PouchStorageTable<CommandHistoryStorageItem>
  implements CommandHistoryTable {
  constructor(language: string) {
    super(`CommandHistoryStorage.${language}`);
  }

  setSearch(search: string): void {
    this.setFilters(
      search
        ? [
            StorageUtils.makeFilterConfig([
              StorageUtils.makeFilterItem('name', FilterType.contains, search),
            ]),
          ]
        : []
    );
  }
}

export default PouchCommandHistoryTable;
