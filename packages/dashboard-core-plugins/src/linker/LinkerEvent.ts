import { makeEventFunctions } from '@deephaven/golden-layout';
import { type RowDataMap } from '@deephaven/jsapi-utils';
import {
  type LinkPointOptions,
  type LinkColumn,
  type LinkFilterMap,
} from './LinkerUtils';

export const LinkerEvent = Object.freeze({
  LINK_POINT_SELECTED: 'LinkerEvent.LINK_POINT_SELECTED',
  SOURCE_DATA_SELECTED: 'LinkerEvent.SOURCE_DATA_SELECTED',
  REGISTER_TARGET: 'LinkerEvent.REGISTER_TARGET',
});

const linkPointSelectedFns = makeEventFunctions<
  [sourceId: string, column: LinkColumn, options: LinkPointOptions]
>(LinkerEvent.LINK_POINT_SELECTED);
export const listenForLinkPointSelected = linkPointSelectedFns.listen;

/**
 * Emit a linker point selected event
 * @param sourceId The source ID for the link point. Typically panel ID or widget ID
 * @param column The column selected as the link point
 * @param options Optional parameters for the link point selection
 * @param options.isAlwaysEnd Whether this link point is always the end of a link
 * @param options.isIsolatedLinker Whether this link point is selected in an isolated linker context
 */
export const emitLinkPointSelected = linkPointSelectedFns.emit;
export const useLinkPointSelectedListener = linkPointSelectedFns.useListener;

const linkSourceDataSelectedFns = makeEventFunctions<
  [sourceId: string, data: RowDataMap]
>(LinkerEvent.SOURCE_DATA_SELECTED);
export const listenForLinkSourceDataSelected = linkSourceDataSelectedFns.listen;
export const emitLinkSourceDataSelected = linkSourceDataSelectedFns.emit;
export const useLinkSourceDataSelectedListener =
  linkSourceDataSelectedFns.useListener;

export type LinkTargetProps = {
  /**
   * Gets the coordinates for displaying a link point in the target.
   * Coordinates are relative to the window, not the panel.
   * @param columnName The column name to get coordinates for
   * @returns The coordinates for the column, or null if column not visible
   * @throws Error if the column is not valid for this target
   */
  getCoordinates: (columnName: string) => [number, number] | null;

  /**
   * Called when a link source value is selected.
   * Only includes the values from the current event, not previously set links.
   * @param filterMap The filter map to set for the target. May include multiple columns.
   */
  setFilterValues: (filterMap: LinkFilterMap) => void;

  /**
   * Called when a link is deleted or a filter value is unset.
   * @param columnName The column name to unset the filter value for.
   * @param type The column type of the filter to unset.
   */
  unsetFilterValue: (columnName: string, type: string | null) => void;

  /**
   * The ID of the golden layout panel the target is in.
   * May be the same as the sourceId if the target is a panel component.
   */
  panelId: string;
};

const registerLinkTargetFns = makeEventFunctions<
  [sourceId: string, props: LinkTargetProps | null]
>(LinkerEvent.REGISTER_TARGET);

export const listenForRegisterLinkTarget = registerLinkTargetFns.listen;
export const emitRegisterLinkTarget = registerLinkTargetFns.emit;
export const useRegisterLinkTargetListener = registerLinkTargetFns.useListener;
