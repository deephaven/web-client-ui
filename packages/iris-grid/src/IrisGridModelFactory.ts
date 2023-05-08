import type { dh as DhType, Table, TreeTable } from '@deephaven/jsapi-types';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';

/**
 * Factory to create an IrisGridDataModel based on a table or tree table, whatever is passed in.
 */
class IrisGridModelFactory {
  /**
   * @param table The Table or TreeTable object to create the model with
   * @param formatter The formatter to use
   * @returns An IrisGridModel that uses the table provided
   */
  static async makeModel(
    dh: DhType,
    table: Table | TreeTable,
    formatter = new Formatter()
  ): Promise<IrisGridModel> {
    let inputTable = null;
    if (!TableUtils.isTreeTable(table) && table.hasInputTable) {
      inputTable = await table.inputTable();
    }
    return new IrisGridProxyModel(dh, table, formatter, inputTable);
  }
}

export default IrisGridModelFactory;
