import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsWatch, vsRecordKeys } from '@deephaven/icons';
import Logo from './community-wordmark-app.svg';
import FormattingSectionContent from './FormattingSectionContent';
import LegalNotice from './LegalNotice';
import SettingsMenuSection from './SettingsMenuSection';
import ShortcutSectionContent from './ShortcutsSectionContent';
import { exportLogs } from '../log/LogExport';
import './SettingsMenu.scss';

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
    this.handleScrollTo = this.handleScrollTo.bind(this);
    this.handleSectionToggle = this.handleSectionToggle.bind(this);

    this.menuContentRef = React.createRef();

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

SettingsMenu.propTypes = {
  onDone: PropTypes.func,
};

SettingsMenu.defaultProps = {
  onDone: () => {},
};

export default SettingsMenu;
