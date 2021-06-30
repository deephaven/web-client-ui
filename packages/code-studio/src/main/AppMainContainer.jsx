import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGear, dhShapes } from '@deephaven/icons';
import { ContextActions, Tooltip, ThemeExport } from '@deephaven/components';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getUser,
  setActiveTool as setActiveToolAction,
} from '@deephaven/redux';
import { PromiseUtils } from '@deephaven/utils';
import SettingsMenu from '../settings/SettingsMenu';
import {
  ConsoleEvent,
  ControlEvent,
  InputFilterEvent,
} from '../dashboard/events';
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
  constructor(props) {
    super(props);
    this.handleSettingsMenuHide = this.handleSettingsMenuHide.bind(this);
    this.handleSettingsMenuShow = this.handleSettingsMenuShow.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleControlSelect = this.handleControlSelect.bind(this);
    this.handleToolSelect = this.handleToolSelect.bind(this);
    this.handleClearFilter = this.handleClearFilter.bind(this);
    this.handleGoldenLayoutChanged = this.handleGoldenLayoutChanged.bind(this);
    this.handlePaste = this.handlePaste.bind(this);

    this.goldenLayout = null;

    this.state = {
      showSettingsMenu: false,
      layoutConfig: DEFAULT_LAYOUT_CONFIG,
    };
  }

  sendClearFilter() {
    this.emitLayoutEvent(InputFilterEvent.CLEAR_ALL_FILTERS);
  }

  sendDisconnectSession() {
    this.emitLayoutEvent(ConsoleEvent.DISCONNECT_SESSION);
  }

  sendRestartSession() {
    this.emitLayoutEvent(ConsoleEvent.RESTART_SESSION);
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

  handleGoldenLayoutChanged(goldenLayout) {
    this.goldenLayout = goldenLayout;
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
    const { activeTool, user } = this.props;
    const { layoutConfig, showSettingsMenu } = this.state;
    const contextActions = [
      {
        action: () => {
          this.handleToolSelect(ToolType.LINKER);
        },
        shortcut: '⌃L',
        macShortcut: '⌘L',
        isGlobal: true,
      },
      {
        action: () => {
          // triggers clear all filters tab event, which in turn triggers a glEventhub event
          // widget panels can subscribe to his event, and execute their own clearing logic
          this.sendClearFilter();
        },
        order: 50,
        shortcut: '⌃E',
        macShortcut: '⌘E',
      },
      {
        action: () => {
          log.debug('Consume unhandled save shortcut');
        },
        shortcut: '⌃S',
        macShortcut: '⌘S',
      },
      {
        action: () => {
          this.sendRestartSession();
        },
        shortcut: '⌃D',
        macShortcut: '⌘D',
      },
      {
        action: () => {
          this.sendDisconnectSession();
        },
        shortcut: '⌃⇧D',
        macShortcut: '⌘⇧D',
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
          data={{}}
          layoutConfig={layoutConfig}
          onGoldenLayoutChange={this.handleGoldenLayoutChanged}
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
  user: IrisPropTypes.User.isRequired,
};

const mapStateToProps = state => ({
  activeTool: getActiveTool(state),
  user: getUser(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
})(AppMainContainer);
