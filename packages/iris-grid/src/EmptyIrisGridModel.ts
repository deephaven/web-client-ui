/* eslint class-methods-use-this: "off" */
import { ModelIndex, MoveOperation } from '@deephaven/grid';
import { dh as DhType } from '@deephaven/jsapi-types';
import { ColumnName, Formatter } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import ColumnHeaderGroup from './ColumnHeaderGroup';
import { UITotalsTableConfig } from './CommonTypes';
import IrisGridSchemaModelTemplate from './IrisGridSchemaModelTemplate';

class EmptyIrisGridModel extends IrisGridSchemaModelTemplate {
  constructor(dh: typeof DhType, formatter = new Formatter(dh)) {
    super(dh, []);
  }

  get columnCount(): number {
    return 0;
  }

  textForColumnHeader(column: ModelIndex, depth?: number): string | undefined {
    return undefined;
  }

  get columns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  getColumnIndexByName(name: string): ModelIndex | undefined {
    return undefined;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  get initialMovedRows(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return EMPTY_ARRAY;
  }

  get groupedColumns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  get filter(): readonly DhType.FilterCondition[] {
    return EMPTY_ARRAY;
  }

  set filter(filter: readonly DhType.FilterCondition[]) {
    // No-op
  }

  get partition(): readonly unknown[] {
    return EMPTY_ARRAY;
  }

  set partition(partition: readonly unknown[]) {
    // No-op
  }

  get partitionColumns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(sort: readonly DhType.Sort[]) {
    // No-op
  }

  get customColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    // No-op
  }

  get formatColumns(): readonly DhType.CustomColumn[] {
    return EMPTY_ARRAY;
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // Do nothing
  }

  get rollupConfig(): DhType.RollupConfig | null {
    return null;
  }

  set rollupConfig(rollupConfig: DhType.RollupConfig | null) {
    // No-op
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    // No-op
  }

  export(): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: DhType.Column): Promise<DhType.ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get selectDistinctColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set selectDistinctColumns(selectDistinctColumns: readonly ColumnName[]) {
    // No-op
  }

  get columnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return EMPTY_ARRAY;
  }

  set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]) {
    // No-op
  }

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    return EMPTY_MAP;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return undefined;
  }
}

export default EmptyIrisGridModel;
