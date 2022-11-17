import React, { Component, ErrorInfo } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import shortid from 'shortid';
import memoize from 'memoize-one';
import { CSSTransition } from 'react-transition-group';
import { ThemeExport } from '@deephaven/components';
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
  TableUtils,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  getSymbolForNumberOrDateFilter,
  getSymbolForTextFilter,
  Type as FilterType,
  Type,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import {
  getActiveTool,
  getTimeZone,
  setActiveTool as setActiveToolAction,
  RootState,
} from '@deephaven/redux';
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
import { ChartEvent, IrisGridEvent, InputFilterEvent } from '../events';
import LinkerOverlayContent from './LinkerOverlayContent';
import LinkerUtils, {
  isLinkablePanel,
  Link,
  LinkColumn,
  LinkDataMap,
  LinkFilterMap,
  LinkType,
} from './LinkerUtils';

const log = Log.module('Linker');

interface StateProps {
  activeTool: string;
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
  setDashboardColumnSelectionValidator: setDashboardColumnSelectionValidatorAction,
});

export type LinkerProps = OwnProps &
  StateProps &
  ConnectedProps<typeof connector>;

export type LinkerState = {
  linkInProgress?: Link;
};

export class Linker extends Component<LinkerProps, LinkerState> {
  constructor(props: LinkerProps) {
    super(props);

    this.handleCancel = this.handleCancel.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handlePanelCloned = this.handlePanelCloned.bind(this);
    this.handleFilterColumnSelect = this.handleFilterColumnSelect.bind(this);
    this.handleColumnsChanged = this.handleColumnsChanged.bind(this);
    this.handlePanelClosed = this.handlePanelClosed.bind(this);
    this.handleLayoutStateChanged = this.handleLayoutStateChanged.bind(this);
    this.handleAllLinksDeleted = this.handleAllLinksDeleted.bind(this);
    this.handleLinkDeleted = this.handleLinkDeleted.bind(this);
    this.handleChartColumnSelect = this.handleChartColumnSelect.bind(this);
    this.handleGridColumnSelect = this.handleGridColumnSelect.bind(this);
    this.handleUpdateValues = this.handleUpdateValues.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleExited = this.handleExited.bind(this);
    this.handleLinkSelected = this.handleLinkSelected.bind(this);
    this.isColumnSelectionValid = this.isColumnSelectionValid.bind(this);

    this.state = { linkInProgress: undefined };
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
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    const { layout } = this.props;
    this.stopListening(layout);
  }

  startListening(layout: GoldenLayout): void {
    layout.on('stateChanged', this.handleLayoutStateChanged);

    const { eventHub } = layout;
    eventHub.on(IrisGridEvent.COLUMN_SELECTED, this.handleGridColumnSelect);
    eventHub.on(IrisGridEvent.DATA_SELECTED, this.handleUpdateValues);
    eventHub.on(IrisGridEvent.STATE_CHANGED, this.handleStateChange);
    eventHub.on(ChartEvent.COLUMN_SELECTED, this.handleChartColumnSelect);
    eventHub.on(PanelEvent.CLONED, this.handlePanelCloned);
    eventHub.on(
      InputFilterEvent.COLUMN_SELECTED,
      this.handleFilterColumnSelect
    );
    eventHub.on(InputFilterEvent.COLUMNS_CHANGED, this.handleColumnsChanged);
    eventHub.on(PanelEvent.CLOSED, this.handlePanelClosed);
  }

  stopListening(layout: GoldenLayout): void {
    layout.off('stateChanged', this.handleLayoutStateChanged);

    const { eventHub } = layout;
    eventHub.off(IrisGridEvent.COLUMN_SELECTED, this.handleGridColumnSelect);
    eventHub.off(IrisGridEvent.DATA_SELECTED, this.handleUpdateValues);
    eventHub.off(IrisGridEvent.STATE_CHANGED, this.handleStateChange);
    eventHub.off(ChartEvent.COLUMN_SELECTED, this.handleChartColumnSelect);
    eventHub.off(PanelEvent.CLONED, this.handlePanelCloned);
    eventHub.off(
      InputFilterEvent.COLUMN_SELECTED,
      this.handleFilterColumnSelect
    );
    eventHub.off(InputFilterEvent.COLUMNS_CHANGED, this.handleColumnsChanged);
    eventHub.off(PanelEvent.CLOSED, this.handlePanelClosed);
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
    const { setActiveTool, links } = this.props;
    for (let i = 0; i < links.length; i += 1) {
      links[i].isSelected = false;
    }
    setActiveTool(ToolType.DEFAULT);
    this.setState({ linkInProgress: undefined });
  }

  handleChartColumnSelect(panel: PanelComponent, column: LinkColumn): void {
    this.columnSelected(panel, column, true);
  }

  handleFilterColumnSelect(panel: PanelComponent, column: LinkColumn): void {
    log.debug('handleFilterColumnSelect', this.isOverlayShown());
    const {
      links,
      localDashboardId,
      setActiveTool,
      setDashboardIsolatedLinkerPanelId,
    } = this.props;

    const panelId = LayoutUtils.getIdFromPanel(panel);
    const panelLinks = links.filter(
      link => link.start?.panelId === panelId || link.end?.panelId === panelId
    );

    if (!this.isOverlayShown() && panelId != null) {
      // Initial click on the filter source button with linker inactive
      // Show linker in isolated mode for panel
      setActiveTool(ToolType.LINKER);
      setDashboardIsolatedLinkerPanelId(localDashboardId, panelId);

      if (panelLinks.length === 0) {
        // Source not linked - start new link in isolated linker mode
        // Need to pass panelId for overrideIsolatedLinkerPanelId
        // as redux prop update at this point not yet propagated
        this.columnSelected(panel, column, true, panelId);
      }
      return;
    }

    // Filter source clicked with linker active
    this.columnSelected(panel, column, true);
  }

  handleColumnsChanged(panel: PanelComponent, columns: LinkColumn[]): void {
    log.debug('handleColumnsChanged', panel, columns);
    const { links } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
      log.error('Invalid panelId', panel);
      return;
    }
    // Delete links that start or end on non-existent column in the updated panel
    const linksToDelete = links.filter(
      ({ start, end }) =>
        (start.panelId === panelId &&
          LinkerUtils.findColumn(columns, start) == null) ||
        (end != null &&
          end.panelId === panelId &&
          LinkerUtils.findColumn(columns, end) == null)
    );
    this.deleteLinks(linksToDelete);
  }

  handleGridColumnSelect(panel: PanelComponent, column: LinkColumn): void {
    this.columnSelected(panel, column);
  }

  /**
   * Track a column selection and build the link from it.
   * @param panel The panel component that is the source for the column selection
   * @param column The column that was selected
   * @param isAlwaysEndPoint True if the selection is always the end point, even if it's the first column selected. Defaults to false.
   * @param overrideIsolatedLinkerPanelId isolatedLinkerPanelId to use when method is called before prop changes propagate
   */
  columnSelected(
    panel: PanelComponent,
    column: LinkColumn,
    isAlwaysEndPoint = false,
    overrideIsolatedLinkerPanelId?: string | string[]
  ): void {
    if (overrideIsolatedLinkerPanelId === undefined && !this.isOverlayShown()) {
      return;
    }
    const { isolatedLinkerPanelId } = this.props;
    const { linkInProgress } = this.state;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
      return;
    }
    const panelComponent = LayoutUtils.getComponentNameFromPanel(panel);
    const { name: columnName, type: columnType } = column;
    if (linkInProgress == null || linkInProgress.start == null) {
      const newLink: Link = {
        id: shortid.generate(),
        start: {
          panelId,
          panelComponent,
          columnName,
          columnType,
        },
        // Link starts with type Invalid as linking a source to itself is not allowed
        type: 'invalid',
        isReversed: isAlwaysEndPoint,
      };

      log.debug('starting link', newLink);

      this.setState({ linkInProgress: newLink });
    } else {
      const { start, id, isReversed } = linkInProgress;
      const end = {
        panelId,
        panelComponent,
        columnName,
        columnType,
      };

      const type = LinkerUtils.getLinkType(
        isReversed !== undefined && isReversed ? end : start,
        isReversed !== undefined && isReversed ? start : end,
        overrideIsolatedLinkerPanelId ?? isolatedLinkerPanelId
      );

      switch (type) {
        case 'invalid':
          log.debug('Ignore invalid link connection', linkInProgress, end);
          return;
        case 'filterSource': {
          // filterSource links have a limit of 1 link per target
          // New link validation passed, delete existing links before adding the new one
          const { links } = this.props;
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
        case 'tableLink':
          // No-op
          break;
      }

      // Create a completed link from link in progress
      const newLink = {
        start: isReversed !== undefined && isReversed ? end : start,
        end: isReversed !== undefined && isReversed ? start : end,
        id,
        type,
        isSelected: false,
        comparisonOperator: FilterType.eq as FilterTypeValue,
      };
      log.info('creating link', newLink);

      this.setState({ linkInProgress: undefined }, () => {
        // Adding link after updating state
        // otherwise both new link and linkInProgress could be rendered at the same time
        // resulting in "multiple children with same key" error
        this.addLinks([newLink]);
      });
    }
  }

  unsetFilterValueForLink(link: Link): void {
    const { panelManager } = this.props;
    if (link.end) {
      const { end } = link;
      const { panelId, columnName, columnType } = end;
      const endPanel = panelManager.getOpenedPanelById(panelId);
      if (!endPanel) {
        log.debug(
          'endPanel no longer exists, ignoring unsetFilterValue',
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
    const panel = panelManager.getOpenedPanelById(panelId);
    if (!panel) {
      log.debug('panel no longer exists, ignoring setFilterMap', panelId);
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
    this.setState({ linkInProgress: undefined });
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

  handleUpdateValues(panel: PanelComponent, dataMap: LinkDataMap): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const { links, timeZone } = this.props;
    // Map of panel ID to filterMap
    const panelFilterMap = new Map();
    // Instead of setting filters one by one for each link,
    // combine them so they could be set in a single call per target panel
    for (let i = 0; i < links.length; i += 1) {
      const { start, end, comparisonOperator } = links[i];
      if (start.panelId === panelId && end != null) {
        const { panelId: endPanelId, columnName, columnType } = end;
        // Map of column name to column type and filter value
        const filterMap = panelFilterMap.has(endPanelId)
          ? panelFilterMap.get(endPanelId)
          : new Map();
        const { value } = dataMap[start.columnName];
        const operator =
          columnType != null && TableUtils.isStringType(columnType)
            ? getSymbolForTextFilter(comparisonOperator ?? Type.eq)
            : getSymbolForNumberOrDateFilter(comparisonOperator ?? Type.eq);

        let text = `${operator}${value}`;
        if (comparisonOperator === 'startsWith') {
          text = `${value}${operator}`;
        }
        if (columnType != null && TableUtils.isCharType(columnType)) {
          text = `${operator}${String.fromCharCode(parseInt(value, 10))}`;
        }
        if (columnType != null && TableUtils.isDateType(columnType)) {
          const dateFilterFormatter = new DateTimeColumnFormatter({
            timeZone,
            showTimeZone: false,
            showTSeparator: true,
            defaultDateTimeFormatString: DateUtils.FULL_DATE_FORMAT,
          });
          // The values are Dates for dateType values, not string like everything else
          text = `${operator}${dateFilterFormatter.format(
            (value as unknown) as Date
          )}`;
        }
        filterMap.set(columnName, {
          columnType,
          text,
          value,
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

  handlePanelClosed(panelId: string): void {
    // Delete links on PanelEvent.CLOSED instead of UNMOUNT
    // because the panels can get unmounted on errors and we want to keep the links if that happens
    log.debug(`Panel ${panelId} closed, deleting links.`);
    this.deleteLinksForPanelId(panelId);
  }

  handleLinkSelected(linkId: string, deleteLink = false): void {
    const { links } = this.props;
    const link = links.find(l => l.id === linkId);
    if (link) {
      if (deleteLink) {
        this.deleteLinks([link]);
      } else if (link.isSelected !== undefined && link.isSelected) {
        link.isSelected = false;
      } else {
        for (let i = 0; i < links.length; i += 1) {
          links[i].isSelected = false;
        }
        link.isSelected = true;
      }
    } else {
      log.error('Unable to find link to select or delete', linkId);
    }
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

  updateLinkInProgressType(
    linkInProgress: Link,
    type: LinkType = 'invalid'
  ): void {
    this.setState({
      linkInProgress: {
        ...linkInProgress,
        type,
      },
    });
  }

  isColumnSelectionValid(
    panel: PanelComponent,
    tableColumn?: LinkColumn
  ): boolean {
    const { linkInProgress } = this.state;
    const { isolatedLinkerPanelId } = this.props;

    // Link not started yet - no need to update type
    if (linkInProgress?.start == null) {
      return true;
    }

    if (tableColumn == null) {
      // Link started, end point is not a valid target
      this.updateLinkInProgressType(linkInProgress);
      return false;
    }

    const { isReversed, start } = linkInProgress;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
      return false;
    }

    const end = {
      panelId,
      panelComponent: LayoutUtils.getComponentNameFromPanel(panel),
      columnName: tableColumn.name,
      columnType: tableColumn.type,
    };

    const type =
      isReversed !== undefined && isReversed
        ? LinkerUtils.getLinkType(end, start, isolatedLinkerPanelId)
        : LinkerUtils.getLinkType(start, end, isolatedLinkerPanelId);

    this.updateLinkInProgressType(linkInProgress, type);

    return type !== 'invalid';
  }

  render(): JSX.Element {
    const { links, isolatedLinkerPanelId, panelManager } = this.props;
    const { linkInProgress } = this.state;

    const isLinkOverlayShown = this.isOverlayShown();
    const disabled = linkInProgress != null && linkInProgress.start != null;
    const linkerOverlayMessage =
      isolatedLinkerPanelId === undefined
        ? 'Click a column source, then click a column target to create a filter link. Remove a filter link by clicking again to erase. Click done when finished.'
        : 'Create a link between the source column button and a table column by clicking on one, then the other. Remove the link by clicking it directly. Click done when finished.';

    return (
      <>
        <CSSTransition
          in={isLinkOverlayShown}
          timeout={ThemeExport.transitionMs}
          classNames="fade"
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
            messageText={linkerOverlayMessage}
            onLinkSelected={this.handleLinkSelected}
            onSingleLinkDeleted={this.handleLinkDeleted}
            onAllLinksDeleted={this.handleAllLinksDeleted}
            onDone={this.handleDone}
            onCancel={this.handleCancel}
          />
        </CSSTransition>
      </>
    );
  }
}

export default connector(Linker);
