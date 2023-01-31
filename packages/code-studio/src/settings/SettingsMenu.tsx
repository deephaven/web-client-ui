import React, { Component, ReactElement, RefObject } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  vsClose,
  vsWatch,
  vsRecordKeys,
  vsInfo,
  vsLayers,
} from '@deephaven/icons';
import { Button, CopyButton, Tooltip } from '@deephaven/components';
import { ServerConfigValues } from '@deephaven/redux';
import Logo from './community-wordmark-app.svg';
import FormattingSectionContent from './FormattingSectionContent';
import LegalNotice from './LegalNotice';
import SettingsMenuSection from './SettingsMenuSection';
import ShortcutSectionContent from './ShortcutsSectionContent';
import { exportLogs } from '../log/LogExport';
import './SettingsMenu.scss';
import ColumnSpecificSectionContent from './ColumnSpecificSectionContent';

interface SettingsMenuProps {
  serverConfigValues: ServerConfigValues;
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

    this.menuContentRef = React.createRef();

    this.state = {
      expandedSectionKey: SettingsMenu.FORMATTING_SECTION_KEY,
    };
  }

  componentDidMount(): void {
    SettingsMenu.focusFirstInputInContainer(this.menuContentRef.current);
  }

  menuContentRef: RefObject<HTMLDivElement>;

  isSectionExpanded(sectionKey: string): boolean {
    const { expandedSectionKey } = this.state;
    return expandedSectionKey === sectionKey;
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
    const { serverConfigValues } = this.props;
    exportLogs(undefined, Object.fromEntries(serverConfigValues));
  }

  render(): ReactElement {
    const uiVersion = import.meta.env.npm_package_version;
    const supportLink = import.meta.env.VITE_SUPPORT_LINK;
    const docsLink = import.meta.env.VITE_DOCS_LINK;

    const { serverConfigValues } = this.props;
    const barrageVersion = serverConfigValues.get('barrage.version');
    const javaVersion = serverConfigValues.get('java.version');
    const deephavenVersion = serverConfigValues.get('deephaven.version');

    const getRow = (text: string, ver?: string) => (
      <>
        <div>{text}</div>
        <div>{ver}</div>
      </>
    );

    return (
      <div className="app-settings-menu">
        <header className="app-settings-menu-header">
          <div className="flex-spacer" />
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
                Default Formatting &amp; Time zone
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
                Column Specific Formatting Rules
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <ColumnSpecificSectionContent scrollTo={this.handleScrollTo} />
          </SettingsMenuSection>

          <SettingsMenuSection
            sectionKey={SettingsMenu.SHORTCUT_SECTION_KEY}
            isExpanded={this.isSectionExpanded(
              SettingsMenu.SHORTCUT_SECTION_KEY
            )}
            title={
              <>
                <FontAwesomeIcon icon={vsRecordKeys} transform="grow-2" />{' '}
                Keyboard Shortcuts
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <ShortcutSectionContent />
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
                  {deephavenVersion} <FontAwesomeIcon icon={vsInfo} />
                  <Tooltip interactive>
                    <div className="detailed-server-config">
                      {getRow('Engine Version', deephavenVersion)}
                      {getRow('Web UI Version', uiVersion)}
                      {getRow('Java Version', javaVersion)}
                      {getRow('Barrage Version', barrageVersion)}
                    </div>
                    <CopyButton
                      tooltip="Copy version numbers"
                      copy={`Engine Version: ${deephavenVersion}\nWeb UI Version: ${uiVersion}\nJava Version: ${javaVersion}\nBarrage Version: ${barrageVersion}`}
                    >
                      Copy Versions
                    </CopyButton>
                  </Tooltip>
                </span>
              </div>
              <div className="app-settings-footer-item">
                <LegalNotice />
              </div>
            </div>
            <div className="app-settings-footer-section">
              <div className="logo">
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://deephaven.io"
                  className="d-inline-block custom-link p-1"
                >
                  <img src={Logo} alt="Deephaven Data Labs" width="230px" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingsMenu;
