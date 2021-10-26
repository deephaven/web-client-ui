import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import JSZip from 'jszip';
import { Button, Checkbox } from '@deephaven/components';
import Log from '@deephaven/log';
import { getTimeZone } from '@deephaven/redux';
import { DbNameValidator } from '@deephaven/utils';
import CsvOverlay from './CsvOverlay';
import CsvParser from './CsvParser';
import CsvFormats from './CsvFormats';
import './CsvInputBar.scss';

const log = Log.module('CsvInputBar');

const TYPE_OPTIONS = Object.entries(CsvFormats.TYPES).map(([key, value]) => (
  <option key={key} value={key}>
    {value.name}
  </option>
));

/**
 * Input controls for CSV upload.
 */
class CsvInputBar extends Component {
  constructor(props) {
    super(props);

    this.handleUpload = this.handleUpload.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleTableName = this.handleTableName.bind(this);
    this.toggleFirstRowHeaders = this.toggleFirstRowHeaders.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handleCancelInProgress = this.handleCancelInProgress.bind(this);
    this.handleQueryTypeChange = this.handleQueryTypeChange.bind(this);

    this.inputRef = React.createRef();

    this.state = {
      tableName: '',
      tableNameSet: false,
      isFirstRowHeaders: true,
      showProgress: false,
      progressValue: 0,
      type: CsvFormats.DEFAULT_TYPE,
      parser: null,
    };
  }

  // React documentation says it is fine to update state inside an if statment
  /* eslint-disable react/no-did-update-set-state */
  componentDidUpdate(prevProps) {
    const { file, paste } = this.props;
    const { tableName, tableNameSet } = this.state;
    // Set the table name from a file
    if (!tableNameSet && file && !tableName) {
      const dotIndex = file.name.lastIndexOf('.');
      const fileTableName = DbNameValidator.legalizeTableName(
        file.name.substring(0, dotIndex)
      );
      this.setState({
        tableName: fileTableName,
        tableNameSet: true,
      });
      this.inputRef.current.focus();
    } else if ((!file && prevProps.file) || (!paste && prevProps.paste)) {
      // The file or paste was unstaged
      this.setState({
        tableName: '',
        tableNameSet: false,
      });
    }

    // Focus the name input field on paste
    if (paste && !tableName && this.inputRef.current) {
      this.inputRef.current.focus();
    }

    // Determine parser type by file extension
    if (file && file !== prevProps.file) {
      this.setState({
        type: CsvFormats.fromExtension(file.name),
      });
    } else if (paste && !prevProps.paste) {
      this.setState({
        type: CsvFormats.AUTO,
      });
    }
  }

  componentWillUnmount() {
    const { parser } = this.state;
    if (parser) {
      parser.cancel();
    }
  }

  handleCancel() {
    const { onClose } = this.props;
    onClose();
  }

  handleError(e) {
    const { onClose, onError } = this.props;
    log.error(e);
    onError(e);
    onClose();
  }

  handleTableName(event) {
    this.setState({ tableName: event.target.value, tableNameSet: true });
  }

  toggleFirstRowHeaders() {
    const { isFirstRowHeaders } = this.state;
    this.setState({ isFirstRowHeaders: !isFirstRowHeaders });
  }

  handleUpload(event) {
    event.stopPropagation();
    event.preventDefault();
    const { file, paste, onUpdate } = this.props;
    if (file) {
      if (file.name.endsWith('.zip')) {
        JSZip.loadAsync(file)
          .then(zip => {
            const { files } = zip;
            let csvFound = false;
            // Using a for loop instead of forEach in order to break
            const values = Object.values(files);
            for (let i = 0; i < values.length; i += 1) {
              const f = values[i];
              if (CsvOverlay.isValidExtension(f.name)) {
                onUpdate(`Loading ${f.name} as csv from ${file.name}`);
                csvFound = true;
                this.handleFile(f, true);
                break;
              }
            }
            if (!csvFound) {
              throw new Error(`No csv file found in ${file.name}`);
            }
          })
          .catch(e => this.handleError(e));
      } else {
        this.handleFile(file);
      }
    } else if (paste) {
      this.handleFile(
        new Blob([paste], {
          type: 'text/plain',
        })
      );
    }
  }

  handleFile(file, isZip = false) {
    log.info(
      `Starting CSV parser for ${file.name} ${
        isZip ? '' : `${file.size} bytes`
      }`
    );
    const { session, timeZone, onInProgress } = this.props;
    const { tableName, isFirstRowHeaders, type } = this.state;
    const handleParseDone = tables => {
      // Do not bother merging just one table
      if (tables.length === 1) {
        session
          .bindTableToVariable(tables[0], tableName)
          .then(() => this.openTable())
          .catch(e => this.handleError(e));
      } else {
        session
          .mergeTables(tables)
          .then(table => {
            session
              .bindTableToVariable(table, tableName)
              .then(() => this.openTable())
              .catch(e => this.handleError(e));
            tables.forEach(t => t.close());
          })
          .catch(e => this.handleError(e));
      }
    };
    const parser = new CsvParser({
      onFileCompleted: handleParseDone,
      session,
      file,
      type: CsvFormats.TYPES[type],
      readHeaders: isFirstRowHeaders,
      onProgress: this.handleProgress,
      onError: this.handleError,
      timeZone,
      isZip,
    });
    parser.parse();
    this.setState({
      showProgress: true,
      parser,
    });
    // Note that calling onClose will set in progress to false
    onInProgress(true);
  }

  handleProgress(progressValue) {
    const { showProgress } = this.state;
    if (showProgress) {
      this.setState({
        progressValue,
      });
    }
    // Indicates to the caller that the upload has been cancelled
    return !showProgress;
  }

  // Cancels an in progress upload
  handleCancelInProgress() {
    const { onInProgress } = this.props;
    const { parser } = this.state;
    if (parser) {
      parser.cancel();
    }
    this.setState({
      showProgress: false,
      progressValue: 0,
    });
    onInProgress(false);
  }

  openTable() {
    const { onOpenTable, onClose } = this.props;
    const { tableName } = this.state;
    onOpenTable(tableName);
    onClose();
  }

  handleQueryTypeChange(event) {
    this.setState({
      type: event.target.value,
    });
  }

  render() {
    const { file, paste } = this.props;
    const {
      tableName,
      isFirstRowHeaders,
      showProgress,
      progressValue,
      type,
    } = this.state;
    // A blank table name is invalid for pasted values
    const isNameInvalid = paste && !tableName;
    return (
      <div>
        {!showProgress && (
          <form
            onSubmit={this.handleUpload}
            className="csv-input-bar-container form-inline"
          >
            <div className="form-group">
              <label htmlFor="tableNameInput">Table name</label>
              <input
                ref={this.inputRef}
                id="tableNameInput"
                type="text"
                className={classNames('form-control', {
                  'is-invalid': isNameInvalid,
                })}
                value={tableName}
                onChange={this.handleTableName}
              />
            </div>
            <div className="form-group">
              <label htmlFor="formatSelect">File format</label>
              <select
                id="formatSelect"
                className="custom-select"
                value={type}
                onChange={this.handleQueryTypeChange}
              >
                {TYPE_OPTIONS}
              </select>
            </div>
            <Checkbox
              className="firstRowHeaders"
              checked={isFirstRowHeaders}
              onChange={this.toggleFirstRowHeaders}
            >
              First row is column headers
            </Checkbox>
            <div className="csv-input-buttons form-group">
              <Button kind="secondary" onClick={this.handleCancel}>
                Cancel
              </Button>
              <Button
                kind="primary"
                type="submit"
                disabled={!(file || paste) || !tableName}
              >
                Upload
              </Button>
            </div>
          </form>
        )}
        {showProgress && (
          <div className="csv-progress-container">
            <label>Uploading Table</label>
            <div className="progress">
              <div
                className="progress-bar bg-primary"
                style={{ width: `${progressValue}%` }}
                aria-valuenow={progressValue}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <label>{progressValue}%</label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleCancelInProgress}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }
}

CsvInputBar.propTypes = {
  session: PropTypes.shape({
    bindTableToVariable: PropTypes.func.isRequired,
    mergeTables: PropTypes.func.isRequired,
  }).isRequired,
  onOpenTable: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  file: PropTypes.instanceOf(File),
  paste: PropTypes.string,
  onInProgress: PropTypes.func.isRequired,
  timeZone: PropTypes.string.isRequired,
};

CsvInputBar.defaultProps = {
  file: null,
  paste: null,
};

const mapStateToProps = state => ({
  timeZone: getTimeZone(state),
});

export default connect(mapStateToProps)(CsvInputBar);
