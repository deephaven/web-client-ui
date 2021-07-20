import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGear, dhShapes } from '@deephaven/icons';
import {
  ContextActions,
  Tooltip,
  ThemeExport,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
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
import { ControlEvent, InputFilterEvent } from '../dashboard/events';
import ToolType from '../tools/ToolType';
import { IrisPropTypes } from '../include/prop-types';
import AppControlsMenu from './AppControlsMenu';
import { CommandHistoryPanel, ConsolePanel } from '../dashboard/panels';
import DashboardContainer from '../dashboard/DashboardContainer';
import ControlType from '../controls/ControlType';
import Logo from '../settings/LogoMiniDark.svg';
import './AppMainContainer.scss';
import FileExplorerPanel from '../dashboard/panels/FileExplorerPanel';

const log = Log.module('AppMainContainer');

const DEFAULT_LAYOUT_CONFIG = [
  {
    type: 'column',
    content: [
      {
        type: 'row',
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'react-component',
                component: ConsolePanel.COMPONENT,
                title: ConsolePanel.TITLE,
                isClosable: false,
              },
            ],
          },
          {
            type: 'stack',
            width: 25,
            content: [
              {
                type: 'react-component',
                component: CommandHistoryPanel.COMPONENT,
                title: CommandHistoryPanel.TITLE,
                isClosable: false,
              },
              {
                type: 'react-component',
                component: FileExplorerPanel.COMPONENT,
                title: FileExplorerPanel.TITLE,
                isClosable: false,
              },
            ],
          },
        ],
      },
      {
        type: 'row',
        content: [
          {
            type: 'stack',
            title: 'Notebooks',
            content: [],
          },
        ],
      },
    ],
  },
];

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
    this.handleGoldenLayoutChange = this.handleGoldenLayoutChange.bind(this);
    this.handleLayoutConfigChange = this.handleLayoutConfigChange.bind(this);
    this.handlePaste = this.handlePaste.bind(this);

    this.goldenLayout = null;

    this.state = { showSettingsMenu: false };
  }

  componentDidMount() {
    window.addEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  sendClearFilter() {
    this.emitLayoutEvent(InputFilterEvent.CLEAR_ALL_FILTERS);
  }

  emitLayoutEvent(event, data = undefined) {
    this.goldenLayout?.eventHub.emit(event, data);
  }

  // eslint-disable-next-line class-methods-use-this
  handleError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  handleSettingsMenuHide() {
    this.setState({ showSettingsMenu: false });
  }

  handleSettingsMenuShow() {
    this.setState({ showSettingsMenu: true });
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

  render() {
    const { activeTool, user, workspace } = this.props;
    const { data: workspaceData = {} } = workspace;
    const { data = {}, layoutConfig = DEFAULT_LAYOUT_CONFIG } = workspaceData;
    const { showSettingsMenu } = this.state;
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
        shortcut: GLOBAL_SHORTCUTS.CLEAR_ALL_FILTERS,
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
          layoutConfig={layoutConfig}
          onDataChange={this.handleDataChange}
          onGoldenLayoutChange={this.handleGoldenLayoutChange}
          onLayoutConfigChange={this.handleLayoutConfigChange}
        />
        <CSSTransition
          in={showSettingsMenu}
          timeout={ThemeExport.transitionMidMs}
          classNames="slide-left"
          mountOnEnter
          unmountOnExit
        >
          <SettingsMenu onDone={this.handleSettingsMenuHide} />
        </CSSTransition>
        <ContextActions actions={contextActions} />
      </div>
    );
  }
}

AppMainContainer.propTypes = {
  activeTool: PropTypes.string.isRequired,
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
  user: getUser(state),
  workspace: getWorkspace(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  updateWorkspaceData: updateWorkspaceDataAction,
})(AppMainContainer);
