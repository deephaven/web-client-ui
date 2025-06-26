import { nanoid } from 'nanoid';
import { type PanelComponent } from '@deephaven/dashboard';
import { TableUtils } from '@deephaven/jsapi-utils';
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
import Log from '@deephaven/log';

export type LinkType = 'invalid' | 'filterSource' | 'tableLink' | 'chartLink';

export type LinkPoint = {
  panelId: string;
  columnName: string;
  columnType: string | null;
};

export type LinkPointOptions = {
  /**
   * The type of link this point is associated with.
   * If this point is the end point of a link, this will set the type of the link.
   */
  type: LinkType;
};

export type Link = {
  start: LinkPoint;
  end?: LinkPoint;
  id: string;
  isReversed?: boolean;
  type: LinkType;
  operator?: FilterTypeValue;
};

export type LinkColumn = {
  name: string;
  type: string | null;
  description?: string | null;
};

export type LinkDataValue<T = unknown> = {
  operator: FilterTypeValue;
  text: string;
  value: T;
  startColumnIndex: number;
};

export type LinkFilterMapValue<T = unknown> = {
  columnType: string | null;
  filterList: LinkDataValue<T>[];
};

export type LinkFilterMap<T = unknown> = Map<string, LinkFilterMapValue<T>>;

// [x,y] screen coordinates used by the Linker
export type LinkerCoordinate = [number, number];

export type LinkableFromPanel = PanelComponent & {
  getCoordinateForColumn: (name: string) => LinkerCoordinate;
};

export type LinkablePanel = LinkableFromPanel & {
  setFilterMap: (filterMap: LinkFilterMap) => void;
  unsetFilterValue: (name: string, type: string | null) => void;
};

export function isLinkableFromPanel(
  panel: PanelComponent
): panel is LinkableFromPanel {
  const p = panel as LinkableFromPanel;
  return typeof p.getCoordinateForColumn === 'function';
}

export function isLinkablePanel(panel: PanelComponent): panel is LinkablePanel {
  const p = panel as LinkablePanel;
  return (
    isLinkableFromPanel(panel) &&
    typeof p.setFilterMap === 'function' &&
    typeof p.unsetFilterValue === 'function'
  );
}

export function isLinkableColumn(column: LinkColumn): boolean {
  // TODO: core/#3358 Use preview/original type property instead of checking description
  return (
    column.description == null ||
    !column.description.startsWith('Preview of type: ')
  );
}

const log = Log.module('LinkerUtils');

/**
 * Collection of utility functions for use with the Linker
 */
class LinkerUtils {
  /**
   * Retrieve the type of link given parameters.
   * @param start The link start
   * @param end The link end
   * @param isolatedLinkerPanelId Whether there's an isolated linker
   * @returns The type of link, or invalid if there's an error
   */
  static isLinkValid(
    start: LinkPoint,
    end: LinkPoint,
    isolatedLinkerPanelId?: string | string[]
  ): boolean {
    // Panel compatibility checks:
    // Link ends should point to different non-null panelIds
    // For isolated linker one of the panels should match isolated panel id
    if (
      start.panelId == null ||
      end.panelId == null ||
      start.panelId === end.panelId ||
      (isolatedLinkerPanelId != null &&
        isolatedLinkerPanelId !== start.panelId &&
        isolatedLinkerPanelId !== end.panelId)
    ) {
      log.debug2('Incompatible panel ids', start, end, isolatedLinkerPanelId);
      return false;
    }

    // Check column type compatibility
    const { columnType: startColumnType } = start;
    const { columnType: endColumnType } = end;

    // Null columnType in ending link point allows linking to any type
    const isCompatibleType =
      endColumnType === null ||
      TableUtils.isCompatibleType(startColumnType, endColumnType);

    if (!isCompatibleType) {
      log.debug2('Incompatible type', startColumnType, endColumnType);
      return false;
    }

    return true;
  }

  /**
   * Find column matching the link point
   * @param columns Columns to search in
   * @param linkPoint Link point to find column for
   * @param linkPoint.columnName Column name to find
   * @param linkPoint.columnType Column type to find
   * @returns Column matching the link point, undefined if not found
   */
  static findColumn(
    columns: readonly LinkColumn[],
    { columnName, columnType }: LinkPoint
  ): LinkColumn | undefined {
    return columns.find(
      ({ name, type }) => name === columnName && type === columnType
    );
  }

  /**
   * Clone links for a given panel id
   * @param links Original links array
   * @param panelId Original panel id
   * @param cloneId Cloned panel id
   * @returns Cloned links array or empty array if no new links added
   */
  static cloneLinksForPanel(
    links: Link[],
    panelId: string | string[],
    cloneId: string
  ): Link[] {
    const clonedLinks: Link[] = [];
    links.forEach(link => {
      if (link.start.panelId === panelId && link.type !== 'filterSource') {
        clonedLinks.push({
          ...link,
          id: nanoid(),
          start: { ...link.start, panelId: cloneId },
        });
      } else if (link.end?.panelId === panelId) {
        clonedLinks.push({
          ...link,
          id: nanoid(),
          end: { ...link.end, panelId: cloneId },
        });
      }
    });
    return clonedLinks;
  }
}

export default LinkerUtils;
