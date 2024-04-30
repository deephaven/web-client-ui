/* eslint class-methods-use-this: "off" */
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridTableModel from './IrisGridTableModel';

/** Model that represents an empty table with a schema from the provided table */
class IrisGridEmptyTableModel extends IrisGridTableModel {
  /**
   * @param dh JSAPI instance
   * @param table Table to be used in the model
   * @param formatter The formatter to use when getting formats
   */
  constructor(
    dh: typeof DhType,
    table: DhType.Table,
    formatter = new Formatter(dh)
  ) {
    super(dh, table, formatter);
  }

  get size(): number {
    return 0;
  }
}

export default IrisGridEmptyTableModel;
