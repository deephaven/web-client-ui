import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ContextActions, GLOBAL_SHORTCUTS } from '@deephaven/components';
import {
  dhFileCsv,
  dhFileDownload,
  dhFileSpreadsheet,
  vsClippy,
  vsFileZip,
  vsTrash,
  vsWarning,
} from '@deephaven/icons';
import './CsvOverlay.scss';

const PASTED_VALUES = 'pasted values';

const INVALID_MIME_TYPES = [/^audio.*/, /^font.*/, /^image.*/, /^video.*/];

/**
 * Overlay that is displayed when uploading a CSV file.
 */
class CsvOverlay extends Component {
  static MULTIPLE_FILE_ERROR = 'Please select one file';

  static FILE_TYPE_ERROR = 'Filetype not supported.';

  static isValidDropItem(item) {
    return (
      item &&
      item.kind === 'file' &&
      !INVALID_MIME_TYPES.find(invalid => invalid.test(item.type))
    );
  }

  static isValidExtension(name) {
    return (
      name.endsWith('.csv') ||
      name.endsWith('.zip') ||
      name.endsWith('.tsv') ||
      name.endsWith('.tab') ||
      name.endsWith('.psv') ||
      name.endsWith('.dsv') ||
      name.endsWith('.txt')
    );
  }

  static handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  static getIcon(fileName) {
    if (fileName === PASTED_VALUES) {
      return vsClippy;
    }
    if (fileName.endsWith('.csv')) {
      return dhFileCsv;
    }
    if (fileName.endsWith('.zip')) {
      return vsFileZip;
    }
    return dhFileSpreadsheet;
  }

  constructor(props) {
    super(props);

    this.handleSelectFile = this.handleSelectFile.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.unstageFile = this.unstageFile.bind(this);
    this.handleMenuPaste = this.handleMenuPaste.bind(this);
    this.handlePasteEvent = this.handlePasteEvent.bind(this);

    this.fileElem = React.createRef();
    this.divElem = React.createRef();

    this.state = {
      selectedFileName: '',
      dropError: null,
    };
  }

  componentDidMount() {
    this.divElem.current.addEventListener('paste', this.handlePasteEvent);
    this.divElem.current.focus();
  }

  componentWillUnmount() {
    this.divElem.current.removeEventListener('paste', this.handlePasteEvent);
  }

  handleSelectFile() {
    this.fileElem.current.value = null;
    this.fileElem.current.click();
  }

  handleFiles(event) {
    event.stopPropagation();
    event.preventDefault();
    this.handleFile(event.target.files[0]);
  }

  handleDrop(e) {
    const { clearDragError, dragError } = this.props;
    e.preventDefault();
    e.stopPropagation();

    if (dragError) {
      clearDragError();
      return;
    }

    if (!e.dataTransfer || !e.dataTransfer.items) {
      return;
    }

    const file = e.dataTransfer.items[0].getAsFile();
    if (CsvOverlay.isValidExtension(file.name)) {
      this.handleFile(file);
    } else {
      this.setState({
        dropError: CsvOverlay.FILE_TYPE_ERROR,
      });
    }
  }

  unstageFile(event) {
    const { onFileOpened } = this.props;
    event.stopPropagation();
    event.preventDefault();
    onFileOpened(null);
    this.setState({
      selectedFileName: '',
      dropError: null,
    });
  }

  handleFile(file) {
    const { onFileOpened } = this.props;
    onFileOpened(file);
    this.setState({
      selectedFileName: file.name,
      dropError: null,
    });
  }

  handleMenuPaste() {
    const { onPaste, onError, uploadInProgress } = this.props;
    if (uploadInProgress) {
      return;
    }
    navigator.clipboard
      .readText()
      .then(clipText => {
        onPaste(clipText);
        this.setState({
          selectedFileName: PASTED_VALUES,
          dropError: null,
        });
      })
      .catch(e => onError(e));
  }

  handlePasteEvent(event) {
    event.stopPropagation();
    event.preventDefault();
    this.handleMenuPaste();
  }

  makeContextMenuItems() {
    const { uploadInProgress } = this.props;
    return [
      {
        title: 'Paste',
        icon: vsClippy,
        action: this.handleMenuPaste,
        shortcut: GLOBAL_SHORTCUTS.PASTE,
        disabled: uploadInProgress,
      },
    ];
  }

  render() {
    const { dragError, uploadInProgress } = this.props;
    const { selectedFileName, dropError } = this.state;
    const error = dragError || dropError;
    const contextActions = this.makeContextMenuItems();
    return (
      <div
        ref={this.divElem}
        className="csv-overlay fill-parent-absolute"
        onDragOver={CsvOverlay.handleDragOver}
        onDrop={this.handleDrop}
        tabIndex="-1"
      >
        <ContextActions actions={contextActions} />
        <input
          ref={this.fileElem}
          type="file"
          id="fileElem"
          accept=".csv, .tsv, .tab, .zip, .psv, .dsv, .txt"
          style={{ display: 'none' }}
          onChange={this.handleFiles}
        />
        {!selectedFileName && !error && (
          <div className="message-content">
            <div className="message-icon">
              <FontAwesomeIcon icon={dhFileDownload} />
            </div>
            <label>Drop file (or paste values) here to import</label>
            <div className="message-small">
              <label>or</label>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleSelectFile}
            >
              Select File...
            </button>
          </div>
        )}
        {selectedFileName && !error && (
          <div className="selected-content">
            <div className="selected-icon">
              <FontAwesomeIcon icon={CsvOverlay.getIcon(selectedFileName)} />
            </div>
            <div className="selected-text">
              <label>Selected File</label>
              <label className="selected-name">
                {selectedFileName}
                {!uploadInProgress && (
                  <button
                    type="button"
                    className="btn btn-link btn-link-icon ml-2"
                    onClick={this.unstageFile}
                  >
                    <FontAwesomeIcon icon={vsTrash} />
                  </button>
                )}
              </label>
            </div>
          </div>
        )}
        {error && (
          <div className="message-content">
            <div className="message-icon">
              <FontAwesomeIcon icon={vsWarning} />
            </div>
            <label>{error}</label>
            {error === CsvOverlay.FILE_TYPE_ERROR && (
              <div className="message-small">
                <label>
                  Please select a .csv, .tsv, .tab, .psv, .dsv, .txt or .zip
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

CsvOverlay.propTypes = {
  onFileOpened: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
  clearDragError: PropTypes.func.isRequired,
  dragError: PropTypes.string,
  onError: PropTypes.func.isRequired,
  uploadInProgress: PropTypes.bool.isRequired,
};

CsvOverlay.defaultProps = {
  dragError: null,
};

export default CsvOverlay;
