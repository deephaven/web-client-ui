import { EventTarget, Event } from 'event-target-shim';
import { ModelIndex } from './GridMetrics';
import { GridColor, GridTheme, NullableGridColor } from './GridTheme';

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
   * Get the text for the specified cell
   * @param column Column to get the text for
   * @param row Row to get the text for
   * @returns Text for the specified cell
   */
  abstract textForCell(column: ModelIndex, row: ModelIndex): string;

  /**
   * Get the truncation character for the specified cell. Can be undefined
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
   * @returns Text to put in the column header
   */
  textForColumnHeader(column: ModelIndex): string {
    return '';
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
  isColumnMovable(column: ModelIndex): boolean {
    return true;
  }

  /**
   * @param row Row to check
   * @returns True if the row is movable
   */
  isRowMovable(row: ModelIndex): boolean {
    return true;
  }
}

export default GridModel;
