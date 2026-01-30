import React, {
  Component,
  Fragment,
  type ReactElement,
  type RefObject,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  vsClose,
  vsWatch,
  vsRecordKeys,
  vsLayers,
  vsPaintcan,
  dhUserIncognito,
  dhUser,
  vsTools,
  vsFileCode,
} from '@deephaven/icons';
import {
  Button,
  ContextualHelp,
  Heading,
  Content,
  CopyButton,
  GLOBAL_SHORTCUTS,
  Logo,
} from '@deephaven/components';
import { type ServerConfigValues, type User, store } from '@deephaven/redux';
import {
  BROADCAST_CHANNEL_NAME,
  BROADCAST_LOGOUT_MESSAGE,
} from '@deephaven/jsapi-utils';
import { type PluginModuleMap } from '@deephaven/plugin';
import { exportLogs, logHistory } from '@deephaven/log';
import { makeMessage } from '@deephaven/utils';
import FormattingSectionContent from './FormattingSectionContent';
import LegalNotice from './LegalNotice';
import SettingsMenuSection from './SettingsMenuSection';
import ShortcutSectionContent from './ShortcutsSectionContent';
import './SettingsMenu.scss';
import ColumnSpecificSectionContent from './ColumnSpecificSectionContent';
import {
  getFormattedPluginInfo,
  getFormattedVersionInfo,
} from './SettingsUtils';
import AdvancedSectionContent from './AdvancedSectionContent';
import ThemeSectionContent from './ThemeSectionContent';
import EditorSectionContent from './EditorSectionContent';

interface SettingsMenuProps {
  serverConfigValues: ServerConfigValues;
  pluginData: PluginModuleMap;
  user: User;
  onDone: () => void;
}

interface SettingsMenuState {
  expandedSectionKey?: string;
}

export class SettingsMenu extends Component<
  SettingsMenuProps,
  SettingsMenuState
> {
  static defaultProps = {
    onDone: (): void => undefined,
  };

  static FORMATTING_SECTION_KEY = 'SettingsMenu.formatting';

  static COLUMN_SPECIFIC_SECTION_KEY = 'SettingsMenu.columnFormatting';

  static APPLICATION_SECTION_KEY = 'ApplicationMenu.settings';

  static SHORTCUT_SECTION_KEY = 'SettingsMenu.shortcuts';

  static THEME_SECTION_KEY = 'SettingsMenu.theme';

  static ADVANCED_SECTION_KEY = 'SettingsMenu.advanced';

  static EDITOR_SECTION_KEY = 'SettingsMenu.editor';

  static focusFirstInputInContainer(container: HTMLDivElement | null): void {
    const input = container?.querySelector('input, select, textarea');
    if (input) {
      (input as HTMLElement).focus();
    }
  }

  constructor(props: SettingsMenuProps) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
    this.handleScrollTo = this.handleScrollTo.bind(this);
    this.handleSectionToggle = this.handleSectionToggle.bind(this);
    this.handleExportSupportLogs = this.handleExportSupportLogs.bind(this);
    this.handleLogout = this.handleLogout.bind(this);

    this.menuContentRef = React.createRef();
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    this.state = {
      expandedSectionKey: SettingsMenu.FORMATTING_SECTION_KEY,
    };
  }

  componentDidMount(): void {
    SettingsMenu.focusFirstInputInContainer(this.menuContentRef.current);
  }

  componentWillUnmount(): void {
    this.broadcastChannel.close();
  }

  menuContentRef: RefObject<HTMLDivElement>;

  broadcastChannel: BroadcastChannel;

  isSectionExpanded(sectionKey: string): boolean {
    const { expandedSectionKey } = this.state;
    return expandedSectionKey === sectionKey;
  }

  handleLogout(): void {
    this.broadcastChannel.postMessage(makeMessage(BROADCAST_LOGOUT_MESSAGE));
  }

  handleScrollTo(x: number, y: number): void {
    this.menuContentRef.current?.scrollTo(x, y);
  }

  handleSectionToggle(sectionKey: string): void {
    this.setState(state => ({
      expandedSectionKey:
        state.expandedSectionKey === sectionKey ? undefined : sectionKey,
    }));
  }

  handleClose(): void {
    const { onDone } = this.props;
    onDone();
  }

  handleExportSupportLogs(): void {
    const { serverConfigValues, pluginData } = this.props;
    const pluginInfo = getFormattedPluginInfo(pluginData);
    exportLogs(
      logHistory,
      {
        uiVersion: import.meta.env.npm_package_version,
        userAgent: navigator.userAgent,
        ...Object.fromEntries(serverConfigValues),
        pluginInfo,
      },
      store.getState()
    );
  }

  render(): ReactElement {
    const supportLink = import.meta.env.VITE_SUPPORT_LINK;
    const docsLink = import.meta.env.VITE_DOCS_LINK;

    const { serverConfigValues, pluginData, user } = this.props;
    const versionInfo = getFormattedVersionInfo(serverConfigValues);
    const pluginInfo = getFormattedPluginInfo(pluginData);
    const deephavenVersion = serverConfigValues.get('deephaven.version');
    const copyShortcut = GLOBAL_SHORTCUTS.COPY_VERSION_INFO.getDisplayText();

    const getRow = (text: string, ver?: string): JSX.Element => (
      <Fragment key={text}>
        <div>{text}</div>
        <div>{ver}</div>
      </Fragment>
    );

    const userDisplayName = user.displayName ?? user.name;
    const hasUserImage = user.image != null && user.image !== '';
    const showUserName = userDisplayName !== '';

    return (
      <div className="app-settings-menu">
        <header className="app-settings-menu-header">
          <div className="user-info">
            <div className="user-image">
              {!hasUserImage && (
                <FontAwesomeIcon icon={dhUser} transform="grow-8" />
              )}
              {hasUserImage && <img src={user.image} alt={userDisplayName} />}
            </div>
            <div className="user-details">
              {showUserName && (
                <div className="user-name">
                  {userDisplayName}
                  {user.operateAs != null && user.name !== user.operateAs && (
                    <>
                      <span className="font-weight-light font-italic">
                        {' '}
                        as{' '}
                      </span>
                      <span className="operating-as-user">
                        <FontAwesomeIcon
                          icon={dhUserIncognito}
                          className="mr-1"
                        />
                        {user.operateAs}
                      </span>
                    </>
                  )}
                </div>
              )}
              {user.permissions.canLogout && (
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={this.handleLogout}
                >
                  logout
                </button>
              )}
            </div>
          </div>
          <Button
            kind="ghost"
            className="btn-close-settings-menu"
            onClick={this.handleClose}
            icon={<FontAwesomeIcon icon={vsClose} transform="grow-4" />}
            tooltip="Close"
          />
        </header>
        <div className="app-settings-menu-content" ref={this.menuContentRef}>
          <h5>Settings</h5>

          <hr className="my-0" />

          <SettingsMenuSection
            sectionKey={SettingsMenu.FORMATTING_SECTION_KEY}
            isExpanded={this.isSectionExpanded(
              SettingsMenu.FORMATTING_SECTION_KEY
            )}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsWatch}
                  transform="grow-4"
                  className="mr-2"
                />
                Default Format &amp; Time zone
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <FormattingSectionContent />
          </SettingsMenuSection>

          <SettingsMenuSection
            sectionKey={SettingsMenu.COLUMN_SPECIFIC_SECTION_KEY}
            isExpanded={this.isSectionExpanded(
              SettingsMenu.COLUMN_SPECIFIC_SECTION_KEY
            )}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsLayers}
                  transform="grow-4"
                  className="mr-2"
                />
                Format by Column Name &amp; Type
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <ColumnSpecificSectionContent scrollTo={this.handleScrollTo} />
          </SettingsMenuSection>

          <SettingsMenuSection
            sectionKey={SettingsMenu.THEME_SECTION_KEY}
            isExpanded={this.isSectionExpanded(SettingsMenu.THEME_SECTION_KEY)}
            onToggle={this.handleSectionToggle}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsPaintcan}
                  transform="grow-4"
                  className="mr-2"
                />
                Theme
              </>
            }
          >
            <ThemeSectionContent />
          </SettingsMenuSection>

          <SettingsMenuSection
            sectionKey={SettingsMenu.EDITOR_SECTION_KEY}
            isExpanded={this.isSectionExpanded(SettingsMenu.EDITOR_SECTION_KEY)}
            onToggle={this.handleSectionToggle}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsFileCode}
                  transform="grow-4"
                  className="mr-2"
                />
                Editor
              </>
            }
          >
            <EditorSectionContent />
          </SettingsMenuSection>

          <SettingsMenuSection
            sectionKey={SettingsMenu.SHORTCUT_SECTION_KEY}
            isExpanded={this.isSectionExpanded(
              SettingsMenu.SHORTCUT_SECTION_KEY
            )}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsRecordKeys}
                  transform="grow-4"
                  className="mr-2"
                />
                Keyboard Shortcuts
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <ShortcutSectionContent />
          </SettingsMenuSection>
          <SettingsMenuSection
            sectionKey={SettingsMenu.ADVANCED_SECTION_KEY}
            isExpanded={this.isSectionExpanded(
              SettingsMenu.ADVANCED_SECTION_KEY
            )}
            title={
              <>
                <FontAwesomeIcon
                  icon={vsTools}
                  transform="grow-4"
                  className="mr-2"
                />
                Advanced
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <AdvancedSectionContent />
          </SettingsMenuSection>

          <div className="app-settings-footer">
            <div className="app-settings-footer-section">
              <div className="app-settings-footer-item">
                <div className="font-weight-bold">Support</div>
                <div>
                  GitHub:&nbsp;
                  <a
                    href={supportLink}
                    className="custom-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {supportLink}
                  </a>
                </div>
                <Button
                  kind="tertiary"
                  className="mt-2 py-2"
                  onClick={this.handleExportSupportLogs}
                >
                  Export Logs
                </Button>
              </div>
              <div className="app-settings-footer-item">
                <div className="font-weight-bold">Documentation</div>
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href={docsLink}
                  className="custom-link"
                >
                  {docsLink}
                </a>
              </div>
              <div className="app-settings-footer-item">
                <div className="font-weight-bold">Version</div>
                <span className="d-inline-block text-muted">
                  {deephavenVersion}
                  <ContextualHelp variant="info">
                    <Heading>Version Info</Heading>
                    <Content>
                      <div className="detailed-server-config">
                        {Object.entries(versionInfo).map(([key, value]) =>
                          getRow(key, value)
                        )}
                      </div>
                      <CopyButton
                        copy={Object.entries({
                          ...versionInfo,
                          ...pluginInfo,
                        })
                          .map(([key, value]) => `${key}: ${value}`)
                          .join('\n')}
                      >
                        Copy Versions{' '}
                        <small className="text-muted">({copyShortcut})</small>
                      </CopyButton>
                    </Content>
                  </ContextualHelp>
                </span>
              </div>
              <div className="app-settings-footer-item">
                <div className="font-weight-bold">Plugins</div>
                <div className="container">
                  {Array.from(pluginData.entries())
                    .filter(plugin => plugin[1].version !== undefined)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="row justify-content-start align-items-center"
                      >
                        <div className="col pl-0">
                          <span className="my-0 text-truncate">{key}</span>
                        </div>
                        <div className="col-auto">
                          <span>{value?.version}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="app-settings-footer-item">
                <LegalNotice />
              </div>
            </div>
            <div className="app-settings-footer-section">
              <a
                target="_blank"
                rel="noreferrer noopener"
                href="https://deephaven.io"
                style={{
                  display: 'block',
                  width: '61.8%',
                }}
              >
                <Logo />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingsMenu;
