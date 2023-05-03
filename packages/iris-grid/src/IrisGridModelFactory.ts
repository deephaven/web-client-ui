import { Table, TreeTable } from '@deephaven/jsapi-shim';
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
    table: Table | TreeTable,
    tableUtils: TableUtils,
    formatter = new Formatter()
  ): Promise<IrisGridModel> {
    let inputTable = null;
    if (!TableUtils.isTreeTable(table) && table.hasInputTable) {
      inputTable = await table.inputTable();
    }
    return new IrisGridProxyModel(table, tableUtils, formatter, inputTable);
  }
}

export default IrisGridModelFactory;
