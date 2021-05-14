import shortid from 'shortid';
import { TableUtils } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import { ChartPanel, IrisGridPanel, DropdownFilterPanel } from '../panels';
import LayoutUtils from '../../layout/LayoutUtils';
import LinkType from './LinkType';

const log = Log.module('LinkerLink');

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

  static getLinkType(start = null, end = null, isolatedLinkerPanelId = null) {
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
      return LinkType.INVALID;
    }

    if (start.panelComponent == null || end.panelComponent == null) {
      log.error('PanelComponent should not be null', start, end);
      return LinkType.INVALID;
    }

    const isCompatibleComponent = LinkerUtils.ALLOWED_LINKS.get(
      start.panelComponent
    )?.includes(end.panelComponent);

    if (!isCompatibleComponent) {
      log.debug2('Incompatible panel components', start, end);
      return LinkType.INVALID;
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
      return LinkType.INVALID;
    }

    // If all checks pass, link type is determined by the target panel component
    switch (end.panelComponent) {
      case LayoutUtils.getComponentName(ChartPanel):
      case LayoutUtils.getComponentName(IrisGridPanel):
        return LinkType.TABLE_LINK;
      case LayoutUtils.getComponentName(DropdownFilterPanel):
        return LinkType.FILTER_SOURCE;
      default:
    }

    log.debug2('Incompatible target panel component', end.panelComponent);
    return LinkType.INVALID;
  }

  /**
   * Find column matching the link point
   * @param {Array} columns Columns to search in
   * @param {Object} linkPoint Link point to find column for
   * @param {string} linkPoint.columnName Column name to find
   * @param {string} linkPoint.columnType Column type to find
   * @returns {Column} Column matching the link point, null if not found
   */
  static findColumn(columns, { columnName, columnType }) {
    return columns.find(
      ({ name, type }) => name === columnName && type === columnType
    );
  }

  /**
   * Clone links for a given panel id
   * @param {object[]} links Original links array
   * @param {string} panelId Original panel id
   * @param {string} cloneId Cloned panel id
   * @returns {object[]} Cloned links array or empty array if no new links added
   */
  static cloneLinksForPanel(links, panelId, cloneId) {
    const clonedLinks = [];
    links.forEach(link => {
      if (
        link.start?.panelId === panelId &&
        link.type !== LinkType.FILTER_SOURCE
      ) {
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
