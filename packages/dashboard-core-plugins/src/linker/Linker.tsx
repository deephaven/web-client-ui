import React, { Component, ErrorInfo } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { nanoid } from 'nanoid';
import memoize from 'memoize-one';
import { FadeTransition } from '@deephaven/components';
import {
  LayoutUtils,
  PanelComponent,
  PanelEvent,
  PanelManager,
} from '@deephaven/dashboard';
import type GoldenLayout from '@deephaven/golden-layout';
import {
  DateTimeColumnFormatter,
  DateUtils,
  RowDataMap,
  TableUtils,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Type as FilterType } from '@deephaven/filters';
import {
  getActiveTool,
  getApi,
  getTimeZone,
  setActiveTool as setActiveToolAction,
  RootState,
} from '@deephaven/redux';
import { assertNotNull } from '@deephaven/utils';
import {
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  setDashboardLinks as setDashboardLinksAction,
  addDashboardLinks as addDashboardLinksAction,
  deleteDashboardLinks as deleteDashboardLinksAction,
  setDashboardIsolatedLinkerPanelId as setDashboardIsolatedLinkerPanelIdAction,
  setDashboardColumnSelectionValidator as setDashboardColumnSelectionValidatorAction,
} from '../redux';
import ToolType from './ToolType';
import { ChartEvent, IrisGridEvent } from '../events';
import LinkerOverlayContent from './LinkerOverlayContent';
import LinkerUtils, {
  isLinkablePanel,
  Link,
  LinkColumn,
  LinkFilterMap,
  LinkType,
  isLinkableColumn,
  type LinkPointOptions,
} from './LinkerUtils';
import {
  type FilterColumnSourceId,
  listenForFilterColumnsChanged,
} from '../FilterEvents';
import {
  type LinkTargetProps,
  listenForLinkPointSelected,
  listenForLinkSourceDataSelected,
  listenForRegisterLinkTarget,
} from './LinkerEvent';

const log = Log.module('Linker');

interface StateProps {
  activeTool: string;
  dh: typeof DhType;
  isolatedLinkerPanelId?: string;
  links: Link[];
  timeZone: string;
}

interface OwnProps {
  layout: GoldenLayout;
  panelManager: PanelManager;
  localDashboardId: string;
}

const mapState = (state: RootState, ownProps: OwnProps): StateProps => ({
  activeTool: getActiveTool(state),
  dh: getApi(state),
  isolatedLinkerPanelId: getIsolatedLinkerPanelIdForDashboard(
    state,
    ownProps.localDashboardId
  ),
  links: getLinksForDashboard(state, ownProps.localDashboardId),
  timeZone: getTimeZone(state),
});

const connector = connect(mapState, {
  setActiveTool: setActiveToolAction,
  setDashboardLinks: setDashboardLinksAction,
  addDashboardLinks: addDashboardLinksAction,
  deleteDashboardLinks: deleteDashboardLinksAction,
  setDashboardIsolatedLinkerPanelId: setDashboardIsolatedLinkerPanelIdAction,
  setDashboardColumnSelectionValidator:
    setDashboardColumnSelectionValidatorAction,
});

export type LinkerProps = OwnProps &
  StateProps &
  ConnectedProps<typeof connector>;

export type LinkerState = {
  linkInProgress?: Link & { endType?: LinkType };
  selectedIds: Set<string>;
  isDraggingPanel: boolean;
};

export class Linker extends Component<LinkerProps, LinkerState> {
  constructor(props: LinkerProps) {
    super(props);

    this.handleCancel = this.handleCancel.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handlePanelCloned = this.handlePanelCloned.bind(this);
    this.handleColumnsChanged = this.handleColumnsChanged.bind(this);
    this.handlePanelClosed = this.handlePanelClosed.bind(this);
    this.handleLayoutStateChanged = this.handleLayoutStateChanged.bind(this);
    this.handleAllLinksDeleted = this.handleAllLinksDeleted.bind(this);
    this.handleLinkDeleted = this.handleLinkDeleted.bind(this);
    this.handleLinksUpdated = this.handleLinksUpdated.bind(this);
    this.handleChartColumnSelect = this.handleChartColumnSelect.bind(this);
    this.handleGridColumnSelect = this.handleGridColumnSelect.bind(this);
    this.handleUpdateValues = this.handleUpdateValues.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleExited = this.handleExited.bind(this);
    this.handleLinkPointSelected = this.handleLinkPointSelected.bind(this);
    this.handleTargetRegistered = this.handleTargetRegistered.bind(this);
    this.handleLinkSelected = this.handleLinkSelected.bind(this);
    this.handlePanelDragging = this.handlePanelDragging.bind(this);
    this.handlePanelDropped = this.handlePanelDropped.bind(this);
    this.isColumnSelectionValid = this.isColumnSelectionValid.bind(this);

    this.state = {
      linkInProgress: undefined,
      selectedIds: new Set<string>(),
      isDraggingPanel: false,
    };
  }

  componentDidMount(): void {
    const { layout } = this.props;
    this.startListening(layout);
    this.updateSelectionValidators();
  }

  componentDidUpdate(prevProps: LinkerProps): void {
    const { activeTool, layout } = this.props;
    if (layout !== prevProps.layout) {
      this.stopListening(prevProps.layout);
      this.startListening(layout);
    }
    if (activeTool !== prevProps.activeTool) {
      this.updateSelectionValidators();
      if (activeTool === ToolType.DEFAULT) {
        this.reset();
      }
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    const { layout } = this.props;
    this.stopListening(layout);
  }

  private linkTargetPropMap: Map<string, LinkTargetProps> = new Map();

  private removerFns: (() => void)[] = [];

  startListening(layout: GoldenLayout): void {
    layout.on('stateChanged', this.handleLayoutStateChanged);

    const { eventHub } = layout;
    eventHub.on(IrisGridEvent.COLUMN_SELECTED, this.handleGridColumnSelect);
    eventHub.on(IrisGridEvent.DATA_SELECTED, this.handleUpdateValues);
    eventHub.on(IrisGridEvent.STATE_CHANGED, this.handleStateChange);
    eventHub.on(ChartEvent.COLUMN_SELECTED, this.handleChartColumnSelect);
    eventHub.on(PanelEvent.CLONED, this.handlePanelCloned);
    this.removerFns = [
      listenForFilterColumnsChanged(eventHub, this.handleColumnsChanged),
      listenForLinkPointSelected(eventHub, this.handleLinkPointSelected),
      listenForLinkSourceDataSelected(eventHub, this.handleUpdateValues),
      listenForRegisterLinkTarget(eventHub, this.handleTargetRegistered),
    ];
    eventHub.on(PanelEvent.CLOSE, this.handlePanelClosed);
    eventHub.on(PanelEvent.CLOSED, this.handlePanelClosed);
    eventHub.on(PanelEvent.DRAGGING, this.handlePanelDragging);
    eventHub.on(PanelEvent.DROPPED, this.handlePanelDropped);
  }

  stopListening(layout: GoldenLayout): void {
    layout.off('stateChanged', this.handleLayoutStateChanged);

    const { eventHub } = layout;
    eventHub.off(IrisGridEvent.COLUMN_SELECTED, this.handleGridColumnSelect);
    eventHub.off(IrisGridEvent.DATA_SELECTED, this.handleUpdateValues);
    eventHub.off(IrisGridEvent.STATE_CHANGED, this.handleStateChange);
    eventHub.off(ChartEvent.COLUMN_SELECTED, this.handleChartColumnSelect);
    eventHub.off(PanelEvent.CLONED, this.handlePanelCloned);
    eventHub.off(PanelEvent.CLOSE, this.handlePanelClosed);
    eventHub.off(PanelEvent.CLOSED, this.handlePanelClosed);
    eventHub.off(PanelEvent.DRAGGING, this.handlePanelDragging);
    eventHub.off(PanelEvent.DROPPED, this.handlePanelDropped);
    this.removerFns.forEach(remove => remove());
    this.removerFns = [];
  }

  reset(): void {
    this.setState({
      linkInProgress: undefined,
      selectedIds: new Set<string>(),
    });
  }

  handleCancel(): void {
    const { linkInProgress } = this.state;
    if (linkInProgress == null) {
      const { setActiveTool } = this.props;
      setActiveTool(ToolType.DEFAULT);
    }
    this.setState({ linkInProgress: undefined });
  }

  handleDone(): void {
    const { setActiveTool } = this.props;
    setActiveTool(ToolType.DEFAULT);
  }

  handleChartColumnSelect(panel: PanelComponent, column: LinkColumn): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    assertNotNull(panelId);
    this.columnSelected(panelId, column, 'chartLink', true);
  }

  handleColumnsChanged(
    sourceId: FilterColumnSourceId,
    columns: readonly LinkColumn[] | null
  ): void {
    log.debug('handleColumnsChanged', sourceId, columns);
    const { links } = this.props;
    if (sourceId == null) {
      log.error('Invalid filter columns source id', sourceId);
      return;
    }

    // Columns is null when dh.ui widgets with linker capability are closed
    if (columns == null) {
      this.deleteLinksForPanelId(sourceId);
      return;
    }
    // NOTE: links need to be updated to use sourceId instead of panelId. This will be done when we implement linker for dh.ui widgets DH-18840
    // Delete links that start or end on non-existent column in the updated panel
    const linksToDelete = links.filter(
      ({ start, end }) =>
        (start.panelId === sourceId &&
          LinkerUtils.findColumn(columns, start) == null) ||
        (end != null &&
          end.panelId === sourceId &&
          LinkerUtils.findColumn(columns, end) == null)
    );
    this.deleteLinks(linksToDelete);
  }

  handleGridColumnSelect(panel: PanelComponent, column: LinkColumn): void {
    if (!isLinkableColumn(column)) {
      log.debug2('Column is not filterable');
      return;
    }
    const panelId = LayoutUtils.getIdFromPanel(panel);
    assertNotNull(panelId);
    this.columnSelected(panelId, column, 'tableLink');
  }

  handleLinkPointSelected(
    sourceId: string,
    column: LinkColumn,
    options: LinkPointOptions
  ): void {
    const { type } = options;
    const isIsolatedLinker = type === 'filterSource';
    const isAlwaysEnd = type === 'chartLink' || type === 'filterSource';

    // filterSource type should open in isolated linker mode
    if (!this.isOverlayShown() && sourceId != null && isIsolatedLinker) {
      const {
        links,
        localDashboardId,
        setActiveTool,
        setDashboardIsolatedLinkerPanelId,
      } = this.props;

      const panelLinks = links.filter(
        link =>
          link.start?.panelId === sourceId || link.end?.panelId === sourceId
      );

      // Initial click on the filter source button with linker inactive
      // Show linker in isolated mode for panel
      setActiveTool(ToolType.LINKER);
      setDashboardIsolatedLinkerPanelId(localDashboardId, sourceId);

      if (panelLinks.length === 0) {
        // Source not linked - start new link in isolated linker mode
        // Need to pass panelId for overrideIsolatedLinkerPanelId
        // as redux prop update at this point not yet propagated
        this.columnSelected(sourceId, column, type, isAlwaysEnd, sourceId);
      }
      return;
    }

    this.columnSelected(sourceId, column, type, isAlwaysEnd);
  }

  /**
   * Track a column selection and build the link from it.
   * @param sourceId The ID of the source for the column selection
   * @param column The column that was selected
   * @param type The type of the link point
   * @param isAlwaysEndPoint True if the selection is always the end point, even if it's the first column selected. Defaults to false.
   * @param overrideIsolatedLinkerPanelId isolatedLinkerPanelId to use when method is called before prop changes propagate
   */
  columnSelected(
    sourceId: string,
    column: LinkColumn,
    type: LinkType,
    isAlwaysEndPoint = false,
    overrideIsolatedLinkerPanelId?: string | string[]
  ): void {
    if (overrideIsolatedLinkerPanelId === undefined && !this.isOverlayShown()) {
      return;
    }
    const { isolatedLinkerPanelId } = this.props;
    const { linkInProgress } = this.state;
    const { name: columnName, type: columnType } = column;
    if (linkInProgress == null || linkInProgress.start == null) {
      const newLink: Link & { endType?: LinkType } = {
        id: nanoid(),
        start: {
          panelId: sourceId,
          columnName,
          columnType,
        },
        type: 'invalid',
        isReversed: isAlwaysEndPoint,
      };

      if (isAlwaysEndPoint) {
        newLink.endType = type;
      }

      log.debug('starting link', newLink);

      this.setState({ linkInProgress: newLink });
    } else {
      const { links } = this.props;
      const { start, id, isReversed = false } = linkInProgress;
      const end = {
        panelId: sourceId,
        columnName,
        columnType,
      };

      const isValid =
        !(isReversed && isAlwaysEndPoint) && // Cannot add a point which is only an end when we already have an end
        LinkerUtils.isLinkValid(
          isReversed ? end : start,
          isReversed ? start : end,
          overrideIsolatedLinkerPanelId ?? isolatedLinkerPanelId
        );

      if (!isValid) {
        log.debug('Ignore invalid link connection', linkInProgress, end);
        return;
      }

      // The end point is what determines the type
      // If the link is reversed, we already set the type on the linkInProgress
      const finalType = linkInProgress.endType ?? type;

      switch (finalType) {
        case 'invalid':
          log.debug('Ignore invalid link connection', linkInProgress, end);
          return;
        case 'filterSource': {
          // filterSource links have a limit of 1 link per target
          // New link validation passed, delete existing links before adding the new one
          const existingLinkPanelId =
            isReversed !== undefined && isReversed
              ? start.panelId
              : end.panelId;
          // In cases with multiple targets per panel (i.e. chart filters)
          // links would have to be filtered by panelId and columnName and columnType
          const linksToDelete = links.filter(
            ({ end: panelLinkEnd }) =>
              panelLinkEnd?.panelId === existingLinkPanelId
          );
          this.deleteLinks(linksToDelete);
          break;
        }
        case 'chartLink': {
          const existingLinkEnd = isReversed === true ? start : end;
          const existingLinkStart = isReversed === true ? end : start;
          log.debug('creating chartlink', { existingLinkEnd, start, end });
          // Don't allow linking more than one column per source to each chart column
          const linksToDelete = links.filter(
            ({ end: panelLinkEnd, start: panelLinkStart }) =>
              panelLinkStart?.panelId === existingLinkStart.panelId &&
              panelLinkEnd?.panelId === existingLinkEnd.panelId &&
              panelLinkEnd?.columnName === existingLinkEnd.columnName &&
              panelLinkEnd?.columnType === existingLinkEnd.columnType
          );
          this.deleteLinks(linksToDelete);
          break;
        }
        case 'tableLink':
          // No-op
          break;
      }

      // Create a completed link from link in progress
      const newLink: Link = {
        start: isReversed ? end : start,
        end: isReversed ? start : end,
        id,
        type: finalType,
        operator: FilterType.eq,
      };
      log.info('creating link', newLink);

      this.setState(
        { linkInProgress: undefined, selectedIds: new Set<string>([id]) },
        () => {
          // Adding link after updating state
          // otherwise both new link and linkInProgress could be rendered at the same time
          // resulting in "multiple children with same key" error
          this.addLinks([newLink]);
        }
      );
    }
  }

  unsetFilterValueForLink(link: Link): void {
    const { panelManager } = this.props;
    if (link.end) {
      const { end } = link;
      const { panelId, columnName, columnType } = end;
      const { linkTargetPropMap } = this;
      const unsetFilterValue = linkTargetPropMap.get(panelId)?.unsetFilterValue;
      if (unsetFilterValue) {
        unsetFilterValue(columnName, columnType);
        return;
      }

      const endPanel = panelManager.getOpenedPanelById(panelId);
      if (!endPanel) {
        log.debug(
          'endPanel no longer exists or target is not a panel. Ignoring unsetFilterValue',
          panelId
        );
      } else if (isLinkablePanel(endPanel)) {
        endPanel.unsetFilterValue(columnName, columnType);
      } else {
        log.debug('endPanel.unsetFilterValue not implemented', endPanel);
      }
    }
  }

  /**
   * Set filters for a given panel ID
   * @param panelId ID of panel to set filters on
   * @param filterMap Map of column name to column type, text, and value
   */
  setPanelFilterMap(panelId: string, filterMap: LinkFilterMap): void {
    log.debug('Set filter data for panel:', panelId, filterMap);
    const { panelManager } = this.props;
    const { linkTargetPropMap } = this;
    const setFilterValues = linkTargetPropMap.get(panelId)?.setFilterValues;
    if (setFilterValues) {
      setFilterValues(filterMap);
      return;
    }

    const panel = panelManager.getOpenedPanelById(panelId);
    if (!panel) {
      log.debug(
        'panel no longer exists or target is not a panel. Ignoring setFilterMap',
        panelId
      );
    } else if (isLinkablePanel(panel)) {
      panel.setFilterMap(filterMap);
    } else {
      log.debug('panel.setFilterMap not implemented', panelId, panel);
    }
  }

  addLinks(links: Link[]): void {
    const { addDashboardLinks, localDashboardId } = this.props;
    addDashboardLinks(localDashboardId, links);
  }

  deleteLinks(links: Link[], clearAll = false): void {
    const { localDashboardId } = this.props;
    links.forEach(link => this.unsetFilterValueForLink(link));
    if (clearAll) {
      const { setDashboardLinks } = this.props;
      setDashboardLinks(localDashboardId, []);
    } else if (links.length > 0) {
      const { deleteDashboardLinks } = this.props;
      deleteDashboardLinks(
        localDashboardId,
        links.map(({ id }) => id)
      );
    }
  }

  handleAllLinksDeleted(): void {
    const { links, isolatedLinkerPanelId } = this.props;
    if (isolatedLinkerPanelId === undefined) {
      this.deleteLinks(links, true);
    } else {
      const isolatedLinks = links.filter(
        link =>
          link?.start?.panelId === isolatedLinkerPanelId ||
          link?.end?.panelId === isolatedLinkerPanelId
      );
      this.deleteLinks(isolatedLinks);
    }
    this.reset();
  }

  handleLinkDeleted(linkId: string): void {
    const { links } = this.props;
    const link = links.find(l => l.id === linkId);
    if (link) {
      this.deleteLinks([link]);
    } else {
      log.error('Unable to find link to delete', linkId);
    }
  }

  handleTargetRegistered(
    sourceId: string,
    handlers: LinkTargetProps | null
  ): void {
    const { linkTargetPropMap } = this;
    if (handlers == null) {
      linkTargetPropMap.delete(sourceId);
    } else {
      linkTargetPropMap.set(sourceId, handlers);
    }
  }

  handleUpdateValues(sourceId: string, dataMap: RowDataMap): void {
    const { dh, links, timeZone } = this.props;
    // Map of panel ID to filterMap
    const panelFilterMap: Map<string, LinkFilterMap> = new Map();
    // Instead of setting filters one by one for each link,
    // combine them so they could be set in a single call per target panel
    for (let i = 0; i < links.length; i += 1) {
      const { start, end, operator } = links[i];
      if (start.panelId === sourceId && end != null) {
        const { panelId: endPanelId, columnName, columnType } = end;
        // Map of column name to column type and filter value
        const existingFilterMap = panelFilterMap.get(endPanelId);
        const filterMap: LinkFilterMap = existingFilterMap ?? new Map();
        const filterList = filterMap.get(columnName)?.filterList ?? [];
        const {
          visibleIndex: startColumnIndex,
          isExpandable,
          isGrouped,
        } = dataMap[start.columnName];
        let { value } = dataMap[start.columnName];
        let text = `${value}`;
        if (value === null && isExpandable && isGrouped) {
          // Clear filter on empty rollup grouping columns
          value = undefined;
        }
        if (columnType != null && TableUtils.isDateType(columnType)) {
          const dateFilterFormatter = new DateTimeColumnFormatter(dh, {
            timeZone,
            showTimeZone: false,
            showTSeparator: true,
            defaultDateTimeFormatString: DateUtils.FULL_DATE_FORMAT,
          });
          // The values are Dates for dateType values, not string like everything else
          text = dateFilterFormatter.format(value as Date);
        }
        filterList.push({ operator, text, value, startColumnIndex });
        filterMap.set(columnName, {
          columnType,
          filterList,
        });
        panelFilterMap.set(endPanelId, filterMap);
      }
    }

    // Apply combined filters to all target panels
    panelFilterMap.forEach((filterMap, endPanelId) => {
      this.setPanelFilterMap(endPanelId, filterMap);
    });
  }

  handlePanelCloned(panel: PanelComponent, cloneConfig: { id: string }): void {
    const { links } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const cloneId = cloneConfig.id;
    if (panelId != null) {
      const linksToAdd = LinkerUtils.cloneLinksForPanel(
        links,
        panelId,
        cloneId
      );
      this.addLinks(linksToAdd);
    }
  }

  handlePanelDragging(componentId: string): void {
    const { links } = this.props;
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      const { start, end } = link;
      if (start.panelId === componentId || end?.panelId === componentId) {
        this.setState({ isDraggingPanel: true });
        return;
      }
    }
  }

  handlePanelDropped(): void {
    this.setState({ isDraggingPanel: false });
  }

  handlePanelClosed(panelId: string): void {
    // Delete links on PanelEvent.CLOSE and PanelEvent.CLOSED instead of UNMOUNT
    // because the panels can get unmounted on errors and we want to keep the links if that happens
    log.debug(`Panel ${panelId} closed, deleting links.`);
    this.deleteLinksForPanelId(panelId);
  }

  handleLinkSelected(linkId: string): void {
    this.setState({ selectedIds: new Set<string>([linkId]) });
  }

  handleLinksUpdated(newLinks: Link[]): void {
    const { localDashboardId, setDashboardLinks } = this.props;
    setDashboardLinks(localDashboardId, newLinks);
  }

  handleLayoutStateChanged(): void {
    this.forceUpdate();
  }

  handleStateChange(): void {
    this.forceUpdate();
  }

  handleExited(): void {
    // Has to be done after linker exit animation to avoid flashing non-isolated links
    const { localDashboardId, setDashboardIsolatedLinkerPanelId } = this.props;
    setDashboardIsolatedLinkerPanelId(localDashboardId, undefined);
  }

  /**
   * Delete all links for a provided panel ID. Needs to be done whenever a panel is closed or unmounted.
   * @param panelId The panel ID to delete links for
   */
  deleteLinksForPanelId(panelId: string): void {
    const { links } = this.props;
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      const { start, end, id } = link;
      if (start.panelId === panelId || end?.panelId === panelId) {
        this.handleLinkDeleted(id);
      }
    }
  }

  getCachedLinks = memoize(
    (
      links: Link[],
      linkInProgress: Link | undefined,
      isolateForPanelId: string | undefined
    ) => {
      const combinedLinks = [...links];

      if (linkInProgress != null && linkInProgress.start != null) {
        combinedLinks.push(linkInProgress);
      }

      if (isolateForPanelId !== undefined) {
        return combinedLinks.filter(
          link =>
            link?.start?.panelId === isolateForPanelId ||
            link?.end?.panelId === isolateForPanelId ||
            link?.end == null
        );
      }
      // Show all links in regular linker mode -- both isolated and not
      return combinedLinks;
    }
  );

  isOverlayShown(): boolean {
    const { activeTool } = this.props;
    return activeTool === ToolType.LINKER;
  }

  updateSelectionValidators(): void {
    const {
      activeTool,
      setDashboardColumnSelectionValidator,
      localDashboardId,
    } = this.props;
    switch (activeTool) {
      case ToolType.LINKER:
        setDashboardColumnSelectionValidator(
          localDashboardId,
          this.isColumnSelectionValid
        );
        break;
      default:
        setDashboardColumnSelectionValidator(localDashboardId, undefined);
        break;
    }
  }

  updateLinkInProgressType(type: LinkType = 'invalid'): void {
    this.setState(({ linkInProgress }) => {
      if (linkInProgress !== undefined) {
        return {
          linkInProgress: {
            ...linkInProgress,
            type,
          },
        };
      }
      return null;
    });
  }

  isColumnSelectionValid(
    panelOrId: PanelComponent | string,
    tableColumn: LinkColumn | undefined,
    options: LinkPointOptions
  ): boolean {
    const { linkInProgress } = this.state;
    const { isolatedLinkerPanelId } = this.props;
    // This is backwards compatibility for Grizzly Enterprise panels
    // IrisGridPanel is the only allowed start point for a link
    // The enterprise panels will not call this method with options
    // They are also JS and removed in sanluis, so figure this is best for now
    const isAlwaysEnd =
      typeof panelOrId === 'string'
        ? options.type === 'filterSource' || options.type === 'chartLink'
        : LayoutUtils.getComponentNameFromPanel(panelOrId) !== 'IrisGridPanel';

    if (tableColumn == null) {
      if (linkInProgress?.start != null) {
        // Link started, end point is not a valid target
        this.updateLinkInProgressType('invalid');
      }
      return false;
    }

    // TODO: Use preview/original type property when core/#3358 is completed
    if (!isLinkableColumn(tableColumn)) {
      log.debug2('Column is not filterable', tableColumn.description);
      if (linkInProgress?.start != null) {
        this.updateLinkInProgressType('invalid');
      }
      return false;
    }

    // Link not started yet - no need to update type
    if (linkInProgress?.start == null) {
      return true;
    }

    const { isReversed = false, start } = linkInProgress;
    const panelId =
      typeof panelOrId === 'string'
        ? panelOrId
        : LayoutUtils.getIdFromPanel(panelOrId);
    if (panelId == null) {
      return false;
    }

    // We've already selected an end point, so we can't select another one
    if (isReversed && isAlwaysEnd) {
      this.updateLinkInProgressType('invalid');
      return false;
    }

    const end = {
      panelId,
      columnName: tableColumn.name,
      columnType: tableColumn.type,
    };

    const isValid = isReversed
      ? LinkerUtils.isLinkValid(end, start, isolatedLinkerPanelId)
      : LinkerUtils.isLinkValid(start, end, isolatedLinkerPanelId);

    this.updateLinkInProgressType(
      isValid ? linkInProgress.endType ?? options.type : 'invalid'
    );

    return isValid;
  }

  render(): JSX.Element | null {
    const { links, isolatedLinkerPanelId, panelManager } = this.props;
    const { linkInProgress, selectedIds, isDraggingPanel } = this.state;

    const isLinkOverlayShown = this.isOverlayShown();
    const disabled = linkInProgress != null && linkInProgress.start != null;
    const linkerOverlayMessage =
      isolatedLinkerPanelId === undefined
        ? 'Click a column source, then click a column target to create a filter link. The filter comparison operator used by a selected link can be changed. Delete a filter link by clicking the delete button or with alt+click. Click done when finished.'
        : 'Create a link between the source column button and a table column by clicking on one, then the other. Delete a filter link by clicking the delete button or with alt+click. Click done when finished.';

    return !isDraggingPanel ? (
      <FadeTransition
        in={isLinkOverlayShown}
        mountOnEnter
        unmountOnExit
        onExited={this.handleExited}
      >
        <LinkerOverlayContent
          disabled={disabled}
          panelManager={panelManager}
          links={this.getCachedLinks(
            links,
            linkInProgress,
            isolatedLinkerPanelId
          )}
          selectedIds={selectedIds}
          messageText={linkerOverlayMessage}
          onLinkSelected={this.handleLinkSelected}
          onLinkDeleted={this.handleLinkDeleted}
          onAllLinksDeleted={this.handleAllLinksDeleted}
          onLinksUpdated={this.handleLinksUpdated}
          onDone={this.handleDone}
          onCancel={this.handleCancel}
          linkTargetPropMap={this.linkTargetPropMap}
        />
      </FadeTransition>
    ) : null;
  }
}

const ConnectedLinker = connector(Linker);

export default ConnectedLinker;
