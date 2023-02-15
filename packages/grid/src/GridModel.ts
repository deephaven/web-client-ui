import { EventTarget, Event } from 'event-target-shim';
import * as linkify from 'linkifyjs';
import type { IColumnHeaderGroup } from './ColumnHeaderGroup';
import { ModelIndex } from './GridMetrics';
import { GridColor, GridTheme, NullableGridColor } from './GridTheme';
import memoizeClear from './memoizeClear';

/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/**
 * Model for a Grid
 * All of these methods should return very quickly, as they will be called many times in the render cycle.
 * If data needs to be loaded asynchronously, return something immediately, then trigger an event for the table to refresh (Not yet implemented).
 */
abstract class GridModel<
  TEventMap extends Record<string, Event<string>> = Record<
    string,
    Event<string>
  >,
  TMode extends 'standard' | 'strict' = 'standard'
> extends EventTarget<TEventMap, TMode> {
  /** Count of rows in the grid */
  abstract get rowCount(): number;

  /** Count of columns in the grid */
  abstract get columnCount(): number;

  /** Count of rows that are frozen (or 'floating') at the top */
  get floatingTopRowCount(): number {
    return 0;
  }

  /** Count of rows that are frozen at the bottom */
  get floatingBottomRowCount(): number {
    return 0;
  }

  /** Count of columns that are frozen (or 'floating') at the left */
  get floatingLeftColumnCount(): number {
    return 0;
  }

  /** Count of columns that are frozen (or 'floating') at the right */
  get floatingRightColumnCount(): number {
    return 0;
  }

  /**
   * How many columns header levels are in the grid
   * Used for column grouping where columns at depth 0 are the base columns
   *
   * A grid with 1-level grouping would have a columnHeaderDepth of 2
   * and column headers at depths 0 and 1
   */
  get columnHeaderMaxDepth(): number {
    return 1;
  }

  /**
   * Get the text for the specified cell
   * @param column Column to get the text for
   * @param row Row to get the text for
   * @returns Text for the specified cell
   */
  abstract textForCell(column: ModelIndex, row: ModelIndex): string;

  /**
   * Get the character to replace text when truncated for a specific cell.
   * Leave undefined to show text truncated with ellipsis
   * @param column Column to get the truncation character for
   * @param row Row to get the truncation character for
   * @returns Truncation character for the specified cell
   */
  truncationCharForCell(
    column: ModelIndex,
    row: ModelIndex
  ): string | undefined {
    return undefined;
  }

  /**
   * Get the text alignment for the specified cell
   * @param column Column to get the alignment for
   * @param row Row to get the alignment for
   * @returns Text alignment for the specified cell
   */
  textAlignForCell(column: ModelIndex, row: ModelIndex): CanvasTextAlign {
    return 'left';
  }

  /**
   * Get the color for the text in the specified cell
   * @param column Column to get the color for
   * @param row Row to get the color for
   * @param theme Theme applied to the grid
   * @returns Color for the text in the cell
   */
  colorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridTheme
  ): GridColor {
    return theme.textColor;
  }

  /**
   * Get the background color for the cell
   * @param column Column to get the background color for
   * @param row Row to get the background color for
   * @param theme Theme applied to the grid
   * @returns Background color for the cell
   */
  backgroundColorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridTheme
  ): NullableGridColor {
    return null;
  }

  /**
   * Text for the column header
   * @param column Column to get the header for
   * @param depth Depth to get the header text for. 0 is base columns
   * @returns Text to put in the column header
   */
  abstract textForColumnHeader(
    column: ModelIndex,
    depth?: number
  ): string | undefined;

  /** Color for column header
   * @param column Column to get the color for
   * @param depth Header depth to get the color for
   * @returns Color for the header at the depth or null
   */
  colorForColumnHeader(column: ModelIndex, depth = 0): string | null {
    return null;
  }

  /**
   * Text for the row header
   * @param row Row to get the header for
   * @returns Text to put in the row header
   */
  textForRowHeader(row: ModelIndex): string {
    return '';
  }

  /**
   * Text for the row footer
   * @param row Row to get the footer for
   * @returns Text to put in the row footer
   */
  textForRowFooter(row: ModelIndex): string {
    return '';
  }

  /**
   * @param column Column to check
   * @returns True if the column is movable
   */
  isColumnMovable(column: ModelIndex, depth = 0): boolean {
    return true;
  }

  /**
   * @param row Row to check
   * @returns True if the row is movable
   */
  isRowMovable(row: ModelIndex): boolean {
    return true;
  }

  getColumnHeaderGroup(
    modelIndex: ModelIndex,
    depth: number
  ): IColumnHeaderGroup | undefined {
    return undefined;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): IColumnHeaderGroup | undefined {
    return undefined;
  }

  /**
   * Gets the string split into tokens
   * @param value The string to tokenize
   * @returns The string split into an array, separated by their types (e.g. url, hashtag, etc)
   */
  tokensForCell(value: string): linkify.MultiToken[] {
    return this.getTokenizedString(value);
  }

  getTokenizedString = memoizeClear(
    (value: string): linkify.MultiToken[] => linkify.tokenize(value),
    { max: 10000 }
  );
}

export default GridModel;
