/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/* eslint no-empty-function: "off" */
import { type EventTarget, type Event } from 'event-target-shim';
import memoize from 'memoize-one';
import {
  type EditableGridModel,
  type EditOperation,
  type ExpandableGridModel,
  GridRange,
  MockTreeGridModel,
  type ModelIndex,
  type MoveOperation,
} from '@deephaven/grid';
import {
  IrisGridModel,
  type PendingDataMap,
  type UITreeRow,
  type ColumnHeaderGroup,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type Formatter } from '@deephaven/jsapi-utils';

// We need to cast our CustomEvent so it's happy with event-target-shim
type CustomEventType = EventTarget.EventData<
  Record<string, Event>,
  'standard',
  'CustomEvent'
>;

const EMPTY_ARRAY: never[] = [];

/**
 * A mock class that takes a GridModel and adds mock functionality for use in IrisGrid.
 * Useful for testing.
 */
class MockIrisGridTreeModel
  extends IrisGridModel
  implements ExpandableGridModel, EditableGridModel
{
  protected model: MockTreeGridModel;

  protected editedData: string[][];

  constructor(dh: typeof DhType, model = new MockTreeGridModel()) {
    super(dh);

    this.model = model;
    this.editedData = [];
  }

  // Delegate to the passed in model
  get rowCount(): number {
    return this.model.rowCount;
  }

  get columnCount(): number {
    return this.model.columnCount;
  }

  get floatingTopRowCount(): number {
    return 3;
  }

  get floatingBottomRowCount(): number {
    return 3;
  }

  get isEditable(): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    return this.isEditable;
  }

  setValues(edits: readonly EditOperation[]): never {
    throw new Error('Method not implemented.');
  }

  delete(ranges: GridRange[]): never {
    throw new Error('Method not implemented.');
  }

  get pendingRowCount(): number {
    return 0;
  }

  set pendingRowCount(count: number) {
    // Ignore for mock
  }

  get pendingDataMap(): PendingDataMap<UITreeRow> {
    return new Map();
  }

  set pendingDataMap(value: PendingDataMap<UITreeRow>) {
    // Ignore for mock
  }

  updateFrozenColumns(columns: string[]): void {
    // Ignore for mock
  }

  getColumnIndexByName(name: string): ModelIndex {
    return Number(name);
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return (
      this.editedData[column]?.[row] ?? this.model.textForCell(column, row)
    );
  }

  textForRowHeader(row: ModelIndex): string {
    return this.model.textForRowHeader(row);
  }

  textForRowFooter(row: ModelIndex): string {
    return this.model.textForRowHeader(row);
  }

  textForColumnHeader(column: ModelIndex, depth: number): string {
    return this.model.textForColumnHeader(column, depth);
  }

  get hasExpandableRows(): boolean {
    return this.model.hasExpandableRows;
  }

  get isExpandAllAvailable(): boolean {
    return false;
  }

  isRowExpandable(row: ModelIndex): boolean {
    return this.model.isRowExpandable(row);
  }

  isRowExpanded(row: ModelIndex): boolean {
    return this.model.isRowExpanded(row);
  }

  setRowExpanded(
    row: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    this.model.setRowExpanded(row, isExpanded, expandDescendants);
  }

  expandAll(): void {
    throw new Error('Expand all not implemented.');
  }

  collapseAll(): void {
    throw new Error('Collapse all not implemented.');
  }

  depthForRow(row: ModelIndex): number {
    return this.model.depthForRow(row);
  }

  // Stub out functions for IrisGridModel functionality
  get columns(): DhType.Column[] {
    return this.getCachedColumns(this.columnCount) as DhType.Column[];
  }

  get groupedColumns(): DhType.Column[] {
    return EMPTY_ARRAY;
  }

  getCachedColumns = memoize((count: number) => {
    const columns = [];
    for (let i = 0; i < count; i += 1) {
      columns.push({
        name: this.model.textForColumnHeader(i, 0),
        type: 'java.lang.String',
        description: `Mock column ${i}`,
      });
    }
    return columns;
  });

  get description(): string {
    return 'A mock used for testing.';
  }

  get customColumns(): string[] {
    return [];
  }

  set customColumns(customColumns: string[]) {
    // Ignore for mock
  }

  get formatColumns(): DhType.CustomColumn[] {
    return [];
  }

  set formatColumns(formatColumns: DhType.CustomColumn[]) {
    // Ignore for mock
  }

  get sort(): never[] {
    return [];
  }

  set sort(sort: never[]) {
    // Ignore for mock
  }

  get filter(): never[] {
    return [];
  }

  set filter(filter: never[]) {
    // Ignore for mock
  }

  get partition(): never[] {
    return [];
  }

  set partition(partition: never[]) {
    // Ignore for mock
  }

  get partitionColumns(): never[] {
    return [];
  }

  set partitionColumns(partitionColumns: never[]) {
    // Ignore for mock
  }

  set formatter(formatter: Formatter) {
    // Ignore for mock
  }

  displayString(value: unknown): string {
    return `${value}`;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return this.textForCell(column, row);
  }

  formatForCell(column: ModelIndex, row: ModelIndex): undefined {
    return undefined;
  }

  setViewport(): void {
    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.UPDATED) as CustomEventType
    );
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    if (this.editedData[column] == null) {
      this.editedData[column] = [];
    }
    this.editedData[column][row] = `${value}`;

    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.UPDATED) as CustomEventType
    );
  }

  async setValueForRanges(
    ranges: readonly GridRange[],
    text: string
  ): Promise<void> {
    GridRange.forEachCell(ranges, (x, y) => {
      this.setValueForCell(x, y, text);
    });
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textForCell(column, row);
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    return true;
  }

  async columnStatistics(column: DhType.Column): Promise<never> {
    throw new Error('Not defined in mock');
  }

  async commitPending(): Promise<never> {
    throw new Error('Not defined in mock');
  }

  async export(): Promise<never> {
    throw new Error('Not defined in mock');
  }

  get pendingDataErrors(): never {
    throw new Error('Not defined in mock');
  }

  get rollupConfig(): never {
    throw new Error('Not defined in mock');
  }

  set rollupConfig(rollupConfig: never) {
    throw new Error('Not defined in mock');
  }

  get selectDistinctColumns(): never {
    throw new Error('Not defined in mock');
  }

  set selectDistinctColumns(names: never) {
    throw new Error('Not defined in mock');
  }

  async snapshot(ranges: GridRange[]): Promise<never> {
    throw new Error('Not defined in mock');
  }

  async textSnapshot(): Promise<never> {
    throw new Error('Not defined in mock');
  }

  get totalsConfig(): never {
    throw new Error('Not defined in mock');
  }

  set totalsConfig(totalsConfig: never) {
    throw new Error('Not defined in mock');
  }

  valuesTable(columns: DhType.Column | DhType.Column[]): Promise<never> {
    throw new Error('Not defined in mock');
  }

  seekRow(
    startRow: number,
    column: DhType.Column,
    valueType: DhType.ValueTypeType,
    value: unknown,
    insensitive?: boolean | undefined,
    contains?: boolean | undefined,
    isBackwards?: boolean | undefined
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  get columnHeaderGroups(): ColumnHeaderGroup[] {
    return [];
  }

  set columnHeaderGroups(groups: ColumnHeaderGroup[]) {
    // no-op
  }

  get columnHeaderGroupMap(): Map<string, ColumnHeaderGroup> {
    return new Map();
  }

  getColumnHeaderParentGroup(): ColumnHeaderGroup | undefined {
    return undefined;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return [];
  }

  get initialMovedRows(): readonly MoveOperation[] {
    return [];
  }

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return [];
  }
}

export default MockIrisGridTreeModel;
