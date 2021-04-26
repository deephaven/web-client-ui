import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import memoize from 'memoize-one';
import { CSSTransition } from 'react-transition-group';
import { ThemeExport } from '@deephaven/components';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getTimeZone,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
} from '../../redux/selectors';
import {
  setActiveTool as setActiveToolAction,
  setDashboardLinks as setDashboardLinksAction,
  addDashboardLinks as addDashboardLinksAction,
  deleteDashboardLinks as deleteDashboardLinksAction,
  setDashboardIsolatedLinkerPanelId as setDashboardIsolatedLinkerPanelIdAction,
  setDashboardColumnSelectionValidator as setDashboardColumnSelectionValidatorAction,
} from '../../redux/actions';
import ToolType from '../../tools/ToolType';
import {
  ChartEvent,
  IrisGridEvent,
  PanelEvent,
  InputFilterEvent,
} from '../events';
import LayoutUtils from '../../layout/LayoutUtils';
import LinkerOverlayContent from './LinkerOverlayContent';
import LinkerUtils from './LinkerUtils';
import LinkType from './LinkType';
import { PanelManager } from '../panels';
import { UIPropTypes } from '../../include/prop-types';
import TableUtils from '../../iris-grid/TableUtils';
import { DateTimeColumnFormatter } from '../../iris-grid/formatters';
import DateUtils from '../../iris-grid/DateUtils';

const log = Log.module('Linker');

class Linker extends Component {
  constructor(props) {
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
    this.isColumnSelectionValid = this.isColumnSelectionValid.bind(this);

    this.state = { linkInProgress: null };
  }

  componentDidMount() {
    const { layout } = this.props;
    this.startListening(layout);
    this.updateSelectionValidators();
  }

  componentDidUpdate(prevProps) {
    const { activeTool, layout } = this.props;
    if (layout !== prevProps.layout) {
      this.stopListening(prevProps.layout);
      this.startListening(layout);
    }
    if (activeTool !== prevProps.activeTool) {
      this.updateSelectionValidators();
    }
  }

  componentDidCatch(error, info) {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount() {
    const { layout } = this.props;
    this.stopListening(layout);
  }

  startListening(layout) {
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

  stopListening(layout) {
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

  handleCancel() {
    const { linkInProgress } = this.state;
    if (linkInProgress == null) {
      const { setActiveTool } = this.props;
      setActiveTool(ToolType.DEFAULT);
    }
    this.setState({ linkInProgress: null });
  }

  handleDone() {
    const { setActiveTool } = this.props;
    setActiveTool(ToolType.DEFAULT);
    this.setState({ linkInProgress: null });
  }

  handleChartColumnSelect(panel, column) {
    this.columnSelected(panel, column, true);
  }

  handleFilterColumnSelect(panel, column) {
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

    if (!this.isOverlayShown()) {
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

  handleColumnsChanged(panel, columns) {
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
        (end.panelId === panelId &&
          LinkerUtils.findColumn(columns, end) == null)
    );
    this.deleteLinks(linksToDelete);
  }

  handleGridColumnSelect(panel, column) {
    this.columnSelected(panel, column);
  }

  /**
   * Track a column selection and build the link from it.
   * @param {React.Component} panel The panel component that is the source for the column selection
   * @param {dh.Column} column The column that was selected
   * @param {boolean} isAlwaysEndPoint True if the selection is always the end point, even if it's the first column selected. Defaults to false.
   * @param {string} overrideIsolatedLinkerPanelId isolatedLinkerPanelId to use when method is called before prop changes propagate
   */
  columnSelected(
    panel,
    column,
    isAlwaysEndPoint = false,
    overrideIsolatedLinkerPanelId = null
  ) {
    if (overrideIsolatedLinkerPanelId == null && !this.isOverlayShown()) {
      return;
    }
    const { isolatedLinkerPanelId } = this.props;
    const { linkInProgress } = this.state;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const panelComponent = LayoutUtils.getComponentNameFromPanel(panel);
    const { name: columnName, type: columnType } = column;
    if (linkInProgress == null || linkInProgress.start == null) {
      const newLink = {
        id: shortid.generate(),
        start: {
          panelId,
          panelComponent,
          columnName,
          columnType,
        },
        end: null,
        // Link starts with type Invalid as linking a source to itself is not allowed
        type: LinkType.INVALID,
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
        isReversed ? end : start,
        isReversed ? start : end,
        overrideIsolatedLinkerPanelId ?? isolatedLinkerPanelId
      );

      if (type === LinkType.INVALID) {
        log.debug('Ignore invalid link connection', linkInProgress, end);
        return;
      }

      // FILTER_SOURCE links have a limit of 1 link per target
      // New link validation passed, delete existing links before adding the new one
      if (type === LinkType.FILTER_SOURCE) {
        const { links } = this.props;
        const existingLinkPanelId = isReversed ? start.panelId : end.panelId;
        // In cases with multiple targets per panel (i.e. chart filters)
        // links would have to be filtered by panelId and columnName and columnType
        const linksToDelete = links.filter(
          ({ end: panelLinkEnd }) =>
            panelLinkEnd.panelId === existingLinkPanelId
        );
        this.deleteLinks(linksToDelete);
      }

      // Create a completed link from link in progress
      const newLink = {
        start: isReversed ? end : start,
        end: isReversed ? start : end,
        id,
        type,
      };
      log.info('creating link', newLink);

      this.setState({ linkInProgress: null }, () => {
        // Adding link after updating state
        // otherwise both new link and linkInProgress could be rendered at the same time
        // resulting in "multiple children with same key" error
        this.addLinks([newLink]);
      });
    }
  }

  unsetFilterValueForLink(link) {
    const { panelManager } = this.props;
    if (link.end) {
      const { end } = link;
      const { panelId, columnName, columnType } = end;
      const endPanel = panelManager.getOpenedPanelById(panelId);
      if (endPanel && endPanel.unsetFilterValue) {
        endPanel.unsetFilterValue(columnName, columnType);
      } else if (!endPanel) {
        log.debug(
          'endPanel no longer exists, ignoring unsetFilterValue',
          panelId
        );
      } else {
        log.debug('endPanel.unsetFilterValue not implemented', endPanel);
      }
    }
  }

  /**
   * Set filters for a given panel ID
   * @param {string} panelId ID of panel to set filters on
   * @param {Map<string, Object>} filterMap Map of column name to column type, text, and value
   */
  setPanelFilterMap(panelId, filterMap) {
    log.debug('Set filter data for panel:', panelId, filterMap);
    const { panelManager } = this.props;
    const panel = panelManager.getOpenedPanelById(panelId);
    if (panel && panel.setFilterMap) {
      panel.setFilterMap(filterMap);
    } else if (!panel) {
      log.debug('panel no longer exists, ignoring setFilterMap', panelId);
    } else {
      log.debug('panel.setFilterMap not implemented', panelId, panel);
    }
  }

  addLinks(links) {
    const { addDashboardLinks, localDashboardId } = this.props;
    addDashboardLinks(localDashboardId, links);
  }

  deleteLinks(links, clearAll = false) {
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

  handleAllLinksDeleted() {
    const { links, isolatedLinkerPanelId } = this.props;
    if (isolatedLinkerPanelId == null) {
      this.deleteLinks(links, true);
    } else {
      const isolatedLinks = links.filter(
        link =>
          link?.start?.panelId === isolatedLinkerPanelId ||
          link?.end?.panelId === isolatedLinkerPanelId
      );
      this.deleteLinks(isolatedLinks);
    }
    this.setState({ linkInProgress: null });
  }

  handleLinkDeleted(linkId) {
    const { links } = this.props;
    const link = links.find(l => l.id === linkId);
    if (link) {
      this.deleteLinks([link]);
    } else {
      log.error('Unable to find link to delete', linkId);
    }
  }

  handleUpdateValues(panel, dataMap) {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const { links, timeZone } = this.props;
    // Map of panel ID to filterMap
    const panelFilterMap = new Map();
    // Instead of setting filters one by one for each link,
    // combine them so they could be set in a single call per target panel
    for (let i = 0; i < links.length; i += 1) {
      const { start, end } = links[i];
      if (start.panelId === panelId) {
        const { panelId: endPanelId, columnName, columnType } = end;
        // Map of column name to column type and filter value
        const filterMap = panelFilterMap.has(endPanelId)
          ? panelFilterMap.get(endPanelId)
          : new Map();
        const { value } = dataMap[start.columnName];
        let text = `${value}`;
        if (TableUtils.isDateType(columnType)) {
          const dateFilterFormatter = new DateTimeColumnFormatter({
            timeZone,
            showTimeZone: false,
            showTSeparator: true,
            defaultDateTimeFormatString: DateUtils.FULL_DATE_FORMAT,
          });
          text = dateFilterFormatter.format(value);
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

  handlePanelCloned(panel, cloneConfig) {
    const { links } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const cloneId = cloneConfig.id;
    const linksToAdd = LinkerUtils.cloneLinksForPanel(links, panelId, cloneId);
    this.addLinks(linksToAdd);
  }

  handlePanelClosed(panelId) {
    // Delete links on PanelEvent.CLOSED instead of UNMOUNT
    // because the panels can get unmounted on errors and we want to keep the links if that happens
    log.debug(`Panel ${panelId} closed, deleting links.`);
    this.deleteLinksForPanelId(panelId);
  }

  handleLayoutStateChanged() {
    this.forceUpdate();
  }

  handleStateChange() {
    this.forceUpdate();
  }

  handleExited() {
    // Has to be done after linker exit animation to avoid flashing non-isolated links
    const { localDashboardId, setDashboardIsolatedLinkerPanelId } = this.props;
    setDashboardIsolatedLinkerPanelId(localDashboardId, null);
  }

  /**
   * Delete all links for a provided panel ID. Needs to be done whenever a panel is closed or unmounted.
   * @param {String} panelId The panel ID to delete links for
   */
  deleteLinksForPanelId(panelId) {
    const { links } = this.props;
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      const { start, end, id } = link;
      if (start.panelId === panelId || end.panelId === panelId) {
        this.handleLinkDeleted(id);
      }
    }
  }

  getCachedLinks = memoize((links, linkInProgress, isolateForPanelId) => {
    const combinedLinks = [...links];

    if (linkInProgress && linkInProgress.start) {
      combinedLinks.push(linkInProgress);
    }

    if (isolateForPanelId !== null) {
      return combinedLinks.filter(
        link =>
          link?.start?.panelId === isolateForPanelId ||
          link?.end?.panelId === isolateForPanelId ||
          link?.end == null
      );
    }
    // Show all links in regular linker mode -- both isolated and not
    return combinedLinks;
  });

  isOverlayShown() {
    const { activeTool } = this.props;
    return activeTool === ToolType.LINKER;
  }

  updateSelectionValidators() {
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
        setDashboardColumnSelectionValidator(localDashboardId, null);
        break;
    }
  }

  updateLinkInProgressType(linkInProgress, type = LinkType.INVALID) {
    this.setState({
      linkInProgress: {
        ...linkInProgress,
        type,
      },
    });
  }

  isColumnSelectionValid(panel, tableColumn = null) {
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

    const end = {
      panelId: LayoutUtils.getIdFromPanel(panel),
      panelComponent: LayoutUtils.getComponentNameFromPanel(panel),
      columnName: tableColumn.name,
      columnType: tableColumn.type,
    };

    const type = isReversed
      ? LinkerUtils.getLinkType(end, start, isolatedLinkerPanelId)
      : LinkerUtils.getLinkType(start, end, isolatedLinkerPanelId);

    this.updateLinkInProgressType(linkInProgress, type);

    return type !== LinkType.INVALID;
  }

  render() {
    const { links, isolatedLinkerPanelId, panelManager } = this.props;
    const { linkInProgress } = this.state;

    const isLinkOverlayShown = this.isOverlayShown();
    const disabled = linkInProgress != null && linkInProgress.start != null;
    const linkerOverlayMessage =
      isolatedLinkerPanelId === null
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
            onLinkDeleted={this.handleLinkDeleted}
            onAllLinksDeleted={this.handleAllLinksDeleted}
            onDone={this.handleDone}
            onCancel={this.handleCancel}
          />
        </CSSTransition>
      </>
    );
  }
}

Linker.propTypes = {
  layout: PropTypes.shape({
    eventHub: PropTypes.shape({
      on: PropTypes.func,
      off: PropTypes.func,
    }),
    on: PropTypes.func,
    off: PropTypes.func,
  }).isRequired,
  activeTool: PropTypes.string.isRequired,
  panelManager: PropTypes.instanceOf(PanelManager).isRequired,
  links: UIPropTypes.Links.isRequired,
  isolatedLinkerPanelId: PropTypes.string,
  localDashboardId: PropTypes.string.isRequired,
  setActiveTool: PropTypes.func.isRequired,
  setDashboardLinks: PropTypes.func.isRequired,
  addDashboardLinks: PropTypes.func.isRequired,
  deleteDashboardLinks: PropTypes.func.isRequired,
  setDashboardIsolatedLinkerPanelId: PropTypes.func.isRequired,
  setDashboardColumnSelectionValidator: PropTypes.func.isRequired,
  timeZone: PropTypes.string.isRequired,
};

Linker.defaultProps = {
  isolatedLinkerPanelId: null,
};

const mapStateToProps = (state, ownProps) => ({
  activeTool: getActiveTool(state),
  isolatedLinkerPanelId: getIsolatedLinkerPanelIdForDashboard(
    state,
    ownProps.localDashboardId
  ),
  links: getLinksForDashboard(state, ownProps.localDashboardId),
  timeZone: getTimeZone(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setDashboardLinks: setDashboardLinksAction,
  addDashboardLinks: addDashboardLinksAction,
  deleteDashboardLinks: deleteDashboardLinksAction,
  setDashboardIsolatedLinkerPanelId: setDashboardIsolatedLinkerPanelIdAction,
  setDashboardColumnSelectionValidator: setDashboardColumnSelectionValidatorAction,
})(Linker);
