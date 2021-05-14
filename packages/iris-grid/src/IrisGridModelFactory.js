import Formatter from './Formatter';
import IrisGridProxyModel from './IrisGridProxyModel';

/**
 * Factory to create an IrisGridDataModel based on a table or tree table, whatever is passed in.
 */
class IrisGridModelFactory {
  /**
   * @param {Table|TreeTable} table The Table or TreeTable object to create the model with
   * @param {Formatter} formatter The formatter to use
   * @returns {Promise<IrisGridModel>} An IrisGridModel that uses the table provided
   */
  static async makeModel(
    table,
    isConsoleTable = false,
    formatter = new Formatter()
  ) {
    if (!isConsoleTable && table.isUncoalesced) {
      table.close();
      throw new Error(
        'Table is uncoalesced. Tables must contain a where clause when part of persistent queries to be viewable.'
      );
    }

    let inputTable = null;
    if (table.hasInputTable) {
      inputTable = await table.inputTable();
    }
    return new IrisGridProxyModel(table, formatter, inputTable);
  }
}

export default IrisGridModelFactory;
