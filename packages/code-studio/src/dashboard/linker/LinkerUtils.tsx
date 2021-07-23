import shortid from 'shortid';
import { TableUtils } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import { ChartPanel, IrisGridPanel, DropdownFilterPanel } from '../panels';
import LayoutUtils from '../../layout/LayoutUtils';

export type LinkType = 'invalid' | 'filterSource' | 'tableLink';

export type LinkPoint = {
  panelId: string;
  panelComponent?: string;
  columnName: string;
  columnType: string;
};

export type Link = {
  start: LinkPoint;
  end?: LinkPoint;
  id: string;
  isReversed?: boolean;
  type: LinkType;
};

export type LinkColumn = {
  name: string;
  type: string;
};

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
    isolatedLinkerPanelId?: string
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

    if (!isCompatibleComponent) {
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
    panelId: string,
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
