/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/* eslint no-empty-function: "off" */
import { EventTarget, Event } from 'event-target-shim';
import memoize from 'memoize-one';
import {
  EditableGridModel,
  EditOperation,
  ExpandableGridModel,
  GridRange,
  MockTreeGridModel,
  ModelIndex,
} from '@deephaven/grid';
import { Formatter, IrisGridModel } from '@deephaven/iris-grid';
import type { Column } from '@deephaven/jsapi-shim';

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
  implements ExpandableGridModel, EditableGridModel {
  protected model: MockTreeGridModel;

  protected editedData: string[][];

  constructor(model = new MockTreeGridModel()) {
    super();

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

  setValues(edits: EditOperation[]): never {
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

  get pendingDataMap(): Map<ModelIndex, Map<string, unknown>> {
    return new Map();
  }

  set pendingDataMap(value: Map<ModelIndex, Map<string, unknown>>) {
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

  textForColumnHeader(column: ModelIndex): string {
    return this.model.textForColumnHeader(column);
  }

  get hasExpandableRows(): boolean {
    return this.model.hasExpandableRows;
  }

  isRowExpandable(row: ModelIndex): boolean {
    return this.model.isRowExpandable(row);
  }

  isRowExpanded(row: ModelIndex): boolean {
    return this.model.isRowExpanded(row);
  }

  setRowExpanded(row: ModelIndex, isExpanded: boolean): void {
    this.model.setRowExpanded(row, isExpanded);
  }

  depthForRow(row: ModelIndex): number {
    return this.model.depthForRow(row);
  }

  // Stub out functions for IrisGridModel functionality
  get columns(): Column[] {
    return this.getCachedColumns(this.columnCount) as Column[];
  }

  get groupedColumns(): Column[] {
    return EMPTY_ARRAY;
  }

  getCachedColumns = memoize(count => {
    const columns = [];
    for (let i = 0; i < count; i += 1) {
      columns.push({
        name: this.model.textForColumnHeader(i),
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

  async setValueForRanges(ranges: GridRange[], text: string): Promise<void> {
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

  async columnStatistics(column: Column): Promise<never> {
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

  valuesTable(column: Column): Promise<never> {
    throw new Error('Not defined in mock');
  }
}

export default MockIrisGridTreeModel;
