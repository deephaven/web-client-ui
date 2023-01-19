import shortid from 'shortid';
import { LayoutUtils, PanelComponent } from '@deephaven/dashboard';
import { TableUtils } from '@deephaven/jsapi-utils';
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
import Log from '@deephaven/log';
import { ChartPanel, IrisGridPanel, DropdownFilterPanel } from '../panels';

export type LinkType = 'invalid' | 'filterSource' | 'tableLink';

export type LinkPoint = {
  panelId: string | string[];
  panelComponent?: string | null;
  columnName: string;
  columnType: string | null;
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
  index?: number | undefined;
};

export type LinkDataValue<T = unknown> = {
  operator: FilterTypeValue;
  text: string;
  value: T;
  startColumnIndex: number;
};

export type LinkFilterMapValue<T = unknown> = {
  columnType: string;
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

const log = Log.module('LinkerUtils');

/**
 * Collection of utility functions for use with the Linker
 */
class LinkerUtils {
  static ALLOWED_LINKS = new Map([
    [
      LayoutUtils.getComponentName(IrisGridPanel),
      [
        LayoutUtils.getComponentName(IrisGridPanel),
        LayoutUtils.getComponentName(ChartPanel),
        LayoutUtils.getComponentName(DropdownFilterPanel),
      ],
    ],
  ]);

  /**
   * Retrieve the type of link given parameters.
   * @param start The link start
   * @param end The link end
   * @param isolatedLinkerPanelId Whether there's an isolated linker
   * @returns The type of link, or invalid if there's an error
   */
  static getLinkType(
    start?: LinkPoint,
    end?: LinkPoint,
    isolatedLinkerPanelId?: string | string[]
  ): LinkType {
    // Panel compatibility checks:
    // Link ends should point to different non-null panelIds
    // For isolated linker one of the panels should match isolated panel id
    if (
      start?.panelId == null ||
      end?.panelId == null ||
      start.panelId === end.panelId ||
      (isolatedLinkerPanelId != null &&
        isolatedLinkerPanelId !== start.panelId &&
        isolatedLinkerPanelId !== end.panelId)
    ) {
      log.debug2('Incompatible panel ids', start, end, isolatedLinkerPanelId);
      return 'invalid';
    }

    if (start.panelComponent == null || end.panelComponent == null) {
      log.error('PanelComponent should not be null', start, end);
      return 'invalid';
    }

    const isCompatibleComponent = LinkerUtils.ALLOWED_LINKS.get(
      start.panelComponent
    )?.includes(end.panelComponent);

    if (isCompatibleComponent === undefined || !isCompatibleComponent) {
      log.debug2('Incompatible panel components', start, end);
      return 'invalid';
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
      return 'invalid';
    }

    // If all checks pass, link type is determined by the target panel component
    switch (end.panelComponent) {
      case LayoutUtils.getComponentName(ChartPanel):
      case LayoutUtils.getComponentName(IrisGridPanel):
        return 'tableLink';
      case LayoutUtils.getComponentName(DropdownFilterPanel):
        return 'filterSource';
      default:
    }

    log.debug2('Incompatible target panel component', end.panelComponent);
    return 'invalid';
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
    columns: LinkColumn[],
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
          id: shortid.generate(),
          start: { ...link.start, panelId: cloneId },
        });
      } else if (link.end?.panelId === panelId) {
        clonedLinks.push({
          ...link,
          id: shortid.generate(),
          end: { ...link.end, panelId: cloneId },
        });
      }
    });
    return clonedLinks;
  }
}

export default LinkerUtils;
