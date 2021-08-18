import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import shortid from 'shortid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  Tooltip,
  ThemeExport,
  GLOBAL_SHORTCUTS,
  Popper,
} from '@deephaven/components';
import { SHORTCUTS as IRIS_GRID_SHORTCUTS } from '@deephaven/iris-grid';
import { vsGear, dhShapes, dhPanels } from '@deephaven/icons';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getWorkspace,
  getUser,
  setActiveTool as setActiveToolAction,
  updateWorkspaceData as updateWorkspaceDataAction,
} from '@deephaven/redux';
import { PromiseUtils } from '@deephaven/utils';
import SettingsMenu from '../settings/SettingsMenu';
import {
  ChartEvent,
  ControlEvent,
  InputFilterEvent,
  IrisGridEvent,
} from '../dashboard/events';
import ToolType from '../tools/ToolType';
import { IrisPropTypes } from '../include/prop-types';
import AppControlsMenu from './AppControlsMenu';
import DashboardContainer from '../dashboard/DashboardContainer';
import ControlType from '../controls/ControlType';
import { getLayoutStorage, getSessionWrapper } from '../redux';
import Logo from '../settings/LogoMiniDark.svg';
import './AppMainContainer.scss';
import WidgetList from './WidgetList';
import { createGridModel } from './WidgetUtils';
import EmptyDashboard from './EmptyDashboard';
import UserLayoutUtils from './UserLayoutUtils';

const log = Log.module('AppMainContainer');

export class AppMainContainer extends Component {
  static handleWindowBeforeUnload(event) {
    event.preventDefault();
    // returnValue is required for beforeReload event prompt
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
    // eslint-disable-next-line no-param-reassign
    event.returnValue = '';
  }

  constructor(props) {
    super(props);
    this.handleSettingsMenuHide = this.handleSettingsMenuHide.bind(this);
    this.handleSettingsMenuShow = this.handleSettingsMenuShow.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleControlSelect = this.handleControlSelect.bind(this);
    this.handleToolSelect = this.handleToolSelect.bind(this);
    this.handleClearFilter = this.handleClearFilter.bind(this);
    this.handleDataChange = this.handleDataChange.bind(this);
    this.handleAutoFillClick = this.handleAutoFillClick.bind(this);
    this.handleGoldenLayoutChange = this.handleGoldenLayoutChange.bind(this);
    this.handleLayoutConfigChange = this.handleLayoutConfigChange.bind(this);
    this.handleExportLayoutClick = this.handleExportLayoutClick.bind(this);
    this.handleImportLayoutClick = this.handleImportLayoutClick.bind(this);
    this.handleImportLayoutFiles = this.handleImportLayoutFiles.bind(this);
    this.handleResetLayoutClick = this.handleResetLayoutClick.bind(this);
    this.handleWidgetMenuClick = this.handleWidgetMenuClick.bind(this);
    this.handleWidgetsMenuClose = this.handleWidgetsMenuClose.bind(this);
    this.handleWidgetSelect = this.handleWidgetSelect.bind(this);
    this.handlePaste = this.handlePaste.bind(this);

    this.goldenLayout = null;
    this.importElement = React.createRef();
    this.widgetListenerRemover = null;

    this.state = {
      isPanelsMenuShown: false,
      isSettingsMenuShown: false,
      widgets: [],
    };
  }

  componentDidMount() {
    this.initWidgets();

    window.addEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  componentWillUnmount() {
    this.deinitWidgets();

    window.removeEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  initWidgets() {
    const { session } = this.props;
    this.widgetListenerRemover = session.connection.subscribeToFieldUpdates(
      updates => {
        log.debug('Got updates', updates);
        this.setState(({ widgets }) => {
          const { updated, created, removed } = updates;

          // Remove from the array if it's been removed OR modified. We'll add it back after if it was modified.
          const fieldsToRemove = [...updated, ...removed];
          const newWidgets = widgets.filter(
            widget =>
              !fieldsToRemove.some(
                field => field.definition.name === widget.name
              )
          );

          // Now add all the modified and updated fields back in
          const fieldsToAdd = [...updated, ...created];
          fieldsToAdd.forEach(field => {
            const { definition } = field;
            if (definition.name) {
              newWidgets.push(definition);
            }
          });

          return { widgets: newWidgets };
        });
      }
    );
  }

  deinitWidgets() {
    this.widgetListenerRemover?.();
  }

  sendClearFilter() {
    this.emitLayoutEvent(InputFilterEvent.CLEAR_ALL_FILTERS);
  }

  emitLayoutEvent(event, ...args) {
    this.goldenLayout?.eventHub.emit(event, ...args);
  }

  // eslint-disable-next-line class-methods-use-this
  handleError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  handleSettingsMenuHide() {
    this.setState({ isSettingsMenuShown: false });
  }

  handleSettingsMenuShow() {
    this.setState({ isSettingsMenuShown: true });
  }

  handleControlSelect(type, dragEvent = null) {
    log.debug('handleControlSelect', type);

    switch (type) {
      case ControlType.DROPDOWN_FILTER:
        this.emitLayoutEvent(ControlEvent.OPEN, {
          title: 'DropdownFilter',
          type,
          createNewStack: true,
          dragEvent,
        });
        break;
      case ControlType.INPUT_FILTER:
        this.emitLayoutEvent(ControlEvent.OPEN, {
          title: 'InputFilter',
          type,
          createNewStack: true,
          dragEvent,
        });
        break;
      case ControlType.MARKDOWN:
        this.emitLayoutEvent(ControlEvent.OPEN, {
          title: 'Markdown',
          type,
          dragEvent,
        });
        break;
      default:
        break;
    }
  }

  handleToolSelect(toolType) {
    log.debug('handleToolSelect', toolType);

    const { activeTool, setActiveTool } = this.props;
    if (activeTool === toolType) {
      setActiveTool(ToolType.DEFAULT);
    } else {
      setActiveTool(toolType);
    }
  }

  handleClearFilter() {
    this.sendClearFilter();
  }

  handleDataChange(data) {
    const { updateWorkspaceData } = this.props;
    updateWorkspaceData({ data });
  }

  handleGoldenLayoutChange(goldenLayout) {
    this.goldenLayout = goldenLayout;
  }

  handleLayoutConfigChange(layoutConfig) {
    const { updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
  }

  handleWidgetMenuClick() {
    this.setState(({ isPanelsMenuShown }) => ({
      isPanelsMenuShown: !isPanelsMenuShown,
    }));
  }

  handleWidgetSelect(widget, dragEvent) {
    this.setState({ isPanelsMenuShown: false });

    log.debug('handleWidgetSelect', widget, dragEvent);

    this.openWidget(widget, dragEvent);
  }

  handleWidgetsMenuClose() {
    this.setState({ isPanelsMenuShown: false });
  }

  handleAutoFillClick() {
    const { widgets } = this.state;

    log.debug('handleAutoFillClick', widgets);

    for (let i = 0; i < widgets.length; i += 1) {
      this.openWidget(widgets[i]);
    }
  }

  handleExportLayoutClick() {
    log.info('handleExportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    try {
      const { workspace } = this.props;
      const { data } = workspace;
      const { layoutConfig = [] } = data;

      log.info('Exporting layoutConfig', layoutConfig);

      const blob = new Blob([JSON.stringify(layoutConfig)], {
        mimeType: 'application/json',
      });
      const timestamp = dh.i18n.DateTimeFormat.format(
        'yyyy-MM-dd-HHmmss',
        new Date()
      );
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `deephaven-app-layout-${timestamp}.json`;
      link.click();
    } catch (e) {
      log.error('Unable to export layout', e);
    }
  }

  handleImportLayoutClick() {
    log.info('handleImportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    // Reset the file list on the import element, otherwise user won't be prompted again
    this.importElement.current.value = '';
    this.importElement.current.click();
  }

  handleResetLayoutClick() {
    log.info('handleResetLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    this.resetLayout();
  }

  handleImportLayoutFiles(event) {
    event.stopPropagation();
    event.preventDefault();

    this.importLayoutFile(event.target.files[0]);
  }

  /**
   * Import the provided file and set it in the workspace data (which should then load it in the dashboard)
   * @param {File} file JSON file to import
   */
  async importLayoutFile(file) {
    try {
      const fileText = await file.text();
      const layoutConfig = JSON.parse(fileText);

      const { updateWorkspaceData } = this.props;
      updateWorkspaceData({ layoutConfig });
    } catch (e) {
      log.error('Unable to export layout', e);
    }
  }

  /**
   * Resets the users layout to the default layout
   */
  async resetLayout() {
    const { layoutStorage } = this.props;
    const layoutConfig = await UserLayoutUtils.getDefaultLayout(layoutStorage);

    const { updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
  }

  // eslint-disable-next-line class-methods-use-this
  handlePaste(event) {
    let element = event.target.parentElement;

    while (element != null) {
      if (element.classList.contains('monaco-editor')) {
        return;
      }
      element = element.parentElement;
    }

    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    const replacedChars = /“|”/g;
    if (replacedChars.test(pastedData)) {
      event.preventDefault();
      event.stopPropagation();

      document.execCommand(
        'insertText',
        false,
        pastedData.replace(replacedChars, '"')
      );
    }
  }

  /**
   * Open a widget up, using a drag event if specified.
   * @param {WidgetDefinition} widget The widget to
   * @param {DragEvent} dragEvent The mouse drag event that trigger it, undefined if it was not triggered by a drag
   */
  openWidget(widget, dragEvent) {
    switch (widget.type) {
      case dh.VariableType.TABLE: {
        const metadata = { table: widget.name };
        this.emitLayoutEvent(
          IrisGridEvent.OPEN_GRID,
          widget.name,
          () => {
            const { session } = this.props;
            return createGridModel(session, metadata);
          },
          metadata,
          shortid.generate(),
          dragEvent
        );
        break;
      }
      case dh.VariableType.FIGURE: {
        const metadata = { table: widget.name };
        this.emitLayoutEvent(
          ChartEvent.OPEN,
          widget.name,
          () => {
            const { session } = this.props;
            return createGridModel(session, metadata);
          },
          metadata,
          shortid.generate(),
          dragEvent
        );
        break;
      }
      default:
        log.error('Unexpected widget type', widget);
    }
  }

  render() {
    const { activeTool, user, workspace } = this.props;
    const { data: workspaceData = {} } = workspace;
    const { data = {}, layoutConfig } = workspaceData;
    const { isPanelsMenuShown, isSettingsMenuShown, widgets } = this.state;
    const contextActions = [
      {
        action: () => {
          this.handleToolSelect(ToolType.LINKER);
        },
        shortcut: GLOBAL_SHORTCUTS.LINKER,
        isGlobal: true,
      },
      {
        action: () => {
          // triggers clear all filters tab event, which in turn triggers a glEventhub event
          // widget panels can subscribe to his event, and execute their own clearing logic
          this.sendClearFilter();
        },
        order: 50,
        shortcut: IRIS_GRID_SHORTCUTS.TABLE.CLEAR_ALL_FILTERS,
      },
      {
        action: () => {
          log.debug('Consume unhandled save shortcut');
        },
        shortcut: GLOBAL_SHORTCUTS.SAVE,
      },
    ];

    const tabBarMenu = (
      <div>
        <button type="button" className="btn btn-link btn-panels-menu">
          <FontAwesomeIcon icon={dhShapes} />
          Controls
          <AppControlsMenu
            handleControlSelect={this.handleControlSelect}
            handleToolSelect={this.handleToolSelect}
            onClearFilter={this.handleClearFilter}
          />
        </button>
        <button
          type="button"
          className="btn btn-link btn-panels-menu btn-show-panels"
          data-testid="app-main-panels-button"
          onClick={this.handleWidgetMenuClick}
        >
          <FontAwesomeIcon icon={dhPanels} />
          Panels
          <Popper
            isShown={isPanelsMenuShown}
            className="panels-menu-popper"
            onExited={this.handleWidgetsMenuClose}
            closeOnBlur
            interactive
          >
            <WidgetList
              widgets={widgets}
              onExportLayout={this.handleExportLayoutClick}
              onImportLayout={this.handleImportLayoutClick}
              onResetLayout={this.handleResetLayoutClick}
              onSelect={this.handleWidgetSelect}
            />
          </Popper>
        </button>
        <button
          type="button"
          className={classNames(
            'btn btn-link btn-link-icon btn-settings-menu',
            { 'text-warning': user.operateAs !== user.name }
          )}
          onClick={this.handleSettingsMenuShow}
        >
          <FontAwesomeIcon icon={vsGear} transform="grow-3 right-1 down-1" />
          <Tooltip>User Settings</Tooltip>
        </button>
      </div>
    );

    const toolClassName = activeTool
      ? `active-tool-${activeTool.toLowerCase()}`
      : '';

    return (
      <div
        className={classNames(
          'app-main-tabs',
          'w-100',
          'h-100',
          'd-flex',
          'flex-column',
          toolClassName
        )}
        onPaste={this.handlePaste}
        tabIndex={-1}
      >
        <nav className="nav-container">
          <div className="app-main-top-nav-menus">
            <img src={Logo} alt="Deephaven Data Labs" width="152px" />
            {tabBarMenu}
          </div>
        </nav>
        <DashboardContainer
          data={data}
          emptyDashboard={
            <EmptyDashboard onAutoFillClick={this.handleAutoFillClick} />
          }
          layoutConfig={layoutConfig}
          onDataChange={this.handleDataChange}
          onGoldenLayoutChange={this.handleGoldenLayoutChange}
          onLayoutConfigChange={this.handleLayoutConfigChange}
        />
        <CSSTransition
          in={isSettingsMenuShown}
          timeout={ThemeExport.transitionMidMs}
          classNames="slide-left"
          mountOnEnter
          unmountOnExit
        >
          <SettingsMenu onDone={this.handleSettingsMenuHide} />
        </CSSTransition>
        <ContextActions actions={contextActions} />
        <input
          ref={this.importElement}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={this.handleImportLayoutFiles}
        />
      </div>
    );
  }
}

AppMainContainer.propTypes = {
  activeTool: PropTypes.string.isRequired,
  layoutStorage: PropTypes.shape({}).isRequired,
  session: APIPropTypes.IdeSession.isRequired,
  setActiveTool: PropTypes.func.isRequired,
  updateWorkspaceData: PropTypes.func.isRequired,
  user: IrisPropTypes.User.isRequired,
  workspace: PropTypes.shape({
    data: PropTypes.shape({
      data: PropTypes.shape({}),
      layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
    }),
  }).isRequired,
};

const mapStateToProps = state => ({
  activeTool: getActiveTool(state),
  layoutStorage: getLayoutStorage(state),
  session: getSessionWrapper(state).session,
  user: getUser(state),
  workspace: getWorkspace(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  updateWorkspaceData: updateWorkspaceDataAction,
})(AppMainContainer);
