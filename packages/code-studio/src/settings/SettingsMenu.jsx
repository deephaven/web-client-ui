import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Log from '@deephaven/log';
import { vsClose, vsWatch, vsRecordKeys } from '@deephaven/icons';
import dh from '@deephaven/jsapi-shim';
import {
  getWorkspace,
  updateWorkspaceData as updateWorkspaceDataAction,
} from '@deephaven/redux';
import Logo from './LogoDark.svg';
import FormattingSectionContent from './FormattingSectionContent';
import LegalNotice from './LegalNotice';
import SettingsMenuSection from './SettingsMenuSection';
import ShortcutSectionContent from './ShortcutsSectionContent';
import { exportLogs } from '../log/LogExport';
import './SettingsMenu.scss';

const log = Log.module('SettingsMenu');
export class SettingsMenu extends Component {
  static FORMATTING_SECTION_KEY = 'SettingsMenu.formatting';

  static APPLICATION_SECTION_KEY = 'ApplicationMenu.settings';

  static SHORTCUT_SECTION_KEY = 'SettingsMenu.shortcuts';

  static focusFirstInputInContainer(container) {
    const input = container.querySelector('input, select, textarea');
    if (input) {
      input.focus();
    }
  }

  static handleExportSupportLogs() {
    exportLogs();
  }

  constructor(props) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
    this.handleExportLayoutClick = this.handleExportLayoutClick.bind(this);
    this.handleImportLayoutClick = this.handleImportLayoutClick.bind(this);
    this.handleImportLayoutFiles = this.handleImportLayoutFiles.bind(this);
    this.handleScrollTo = this.handleScrollTo.bind(this);
    this.handleSectionToggle = this.handleSectionToggle.bind(this);

    this.menuContentRef = React.createRef();
    this.importElement = React.createRef();

    this.state = {
      expandedSectionKey: SettingsMenu.FORMATTING_SECTION_KEY,
    };
  }

  componentDidMount() {
    SettingsMenu.focusFirstInputInContainer(this.menuContentRef.current);
  }

  isSectionExpanded(sectionKey) {
    const { expandedSectionKey } = this.state;
    return expandedSectionKey === sectionKey;
  }

  handleScrollTo(x, y) {
    this.menuContentRef.current.scrollTo(x, y);
  }

  handleSectionToggle(sectionKey) {
    this.setState(state => ({
      expandedSectionKey:
        state.expandedSectionKey === sectionKey ? null : sectionKey,
    }));
  }

  handleClose() {
    const { onDone } = this.props;
    onDone();
  }

  handleExportLayoutClick() {
    try {
      const { workspace } = this.props;
      const { data } = workspace;
      const { layoutConfig } = data;

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
    this.importElement.current.value = null;
    this.importElement.current.click();
  }

  handleImportLayoutFiles(event) {
    event.stopPropagation();
    event.preventDefault();

    this.importLayoutFile(event.target.files[0]);
  }

  async importLayoutFile(file) {
    try {
      const fileText = await file.text();
      const newLayoutConfig = JSON.parse(fileText);

      const { updateWorkspaceData } = this.props;
      updateWorkspaceData({ layoutConfig: newLayoutConfig });
    } catch (e) {
      log.error('Unable to export layout', e);
    }
  }

  render() {
    const version = process.env.REACT_APP_VERSION;
    const supportLink = process.env.REACT_APP_SUPPORT_LINK;
    const docsLink = process.env.REACT_APP_DOCS_LINK;

    return (
      <div className="app-settings-menu">
        <header className="app-settings-menu-header">
          <div className="flex-spacer" />
          <button
            type="button"
            className="btn btn-link btn-link-icon btn-close-settings-menu"
            onClick={this.handleClose}
          >
            <FontAwesomeIcon icon={vsClose} transform="grow-4" />
          </button>
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
                Formatting &amp; Time zone
              </>
            }
            onToggle={this.handleSectionToggle}
          >
            <FormattingSectionContent scrollTo={this.handleScrollTo} />
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
                <button
                  type="button"
                  className="btn btn-secondary mt-2 py-2"
                  onClick={SettingsMenu.handleExportSupportLogs}
                >
                  Export Logs
                </button>
              </div>
              <div className="app-settings-footer-item">
                <div className="font-weight-bold">Layout</div>
                <button
                  type="button"
                  className="btn btn-secondary mt-2 py-2 mr-2"
                  onClick={this.handleExportLayoutClick}
                >
                  Export Layout
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-2 py-2"
                  onClick={this.handleImportLayoutClick}
                >
                  Import Layout
                </button>
                <input
                  ref={this.importElement}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={this.handleImportLayoutFiles}
                />
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
                <div className="text-muted">Version {version}</div>
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
                  <img src={Logo} alt="Deephaven Data Labs" width="225px" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SettingsMenu.propTypes = {
  onDone: PropTypes.func,
  updateWorkspaceData: PropTypes.func.isRequired,
  workspace: PropTypes.shape({
    data: PropTypes.shape({
      layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
    }),
  }).isRequired,
};

SettingsMenu.defaultProps = {
  onDone: () => {},
};

const mapState = state => ({
  workspace: getWorkspace(state),
});

export default connect(mapState, {
  updateWorkspaceData: updateWorkspaceDataAction,
})(SettingsMenu);
