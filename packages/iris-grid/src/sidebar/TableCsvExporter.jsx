import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingSpinner, RadioGroup, RadioItem } from '@deephaven/components';
import { GridRange } from '@deephaven/grid';
import { vsIssues } from '@deephaven/icons';
import dh from '@deephaven/jsapi-shim';
import { TimeUtils } from '@deephaven/utils';
import shortid from 'shortid';
import IrisGridModel from '../IrisGridModel';
import './TableCsvExporter.scss';

class TableCsvExporter extends Component {
  static FILENAME_DATE_FORMAT = 'yyyy-MM-dd-HHmmss';

  static DOWNLOAD_STATUS = {
    INITIATING: 'INITIATING',
    DOWNLOADING: 'DOWNLOADING',
    FINISHED: 'FINISHED',
    CANCELED: 'CANCELED',
  };

  static DOWNLOAD_OPTIONS = {
    ALL_ROWS: 'ALL_ROWS',
    SELECTED_ROWS: 'SELECTED_ROWS',
    CUSTOMIZED_ROWS: 'CUSTOMIZED_ROWS',
  };

  static CUSTOMIZED_ROWS_OPTIONS = {
    FIRST: 'FIRST',
    LAST: 'LAST',
  };

  static DEFAULT_DOWNLOAD_ROWS = 100;

  static getDateString() {
    return dh.i18n.DateTimeFormat.format(
      TableCsvExporter.FILENAME_DATE_FORMAT,
      new Date()
    );
  }

  constructor(props) {
    super(props);

    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handleDownloadOptionChanged = this.handleDownloadOptionChanged.bind(
      this
    );
    this.handleCustomizedDownloadOptionChanged = this.handleCustomizedDownloadOptionChanged.bind(
      this
    );
    this.handleCustomizedDownloadRowsChanged = this.handleCustomizedDownloadRowsChanged.bind(
      this
    );

    const { name } = props;
    this.state = {
      fileName: `${name}-${TableCsvExporter.getDateString()}.csv`,

      downloadOption: TableCsvExporter.DOWNLOAD_OPTIONS.ALL_ROWS,
      customizedDownloadOption: TableCsvExporter.CUSTOMIZED_ROWS_OPTIONS.FIRST,
      customizedDownloadRows: TableCsvExporter.DEFAULT_DOWNLOAD_ROWS,

      errorMessage: null,
      id: shortid.generate(),
    };
  }

  getSnapshotRanges() {
    const { model, selectedRanges } = this.props;
    const {
      downloadOption,
      customizedDownloadOption,
      customizedDownloadRows,
    } = this.state;
    const { rowCount } = model;
    let snapshotRanges = [];
    switch (downloadOption) {
      case TableCsvExporter.DOWNLOAD_OPTIONS.ALL_ROWS:
        snapshotRanges.push(new GridRange(null, 0, null, rowCount - 1));
        break;
      case TableCsvExporter.DOWNLOAD_OPTIONS.SELECTED_ROWS:
        snapshotRanges = [...selectedRanges].sort(
          (rangeA, rangeB) => rangeA.startRow - rangeB.startRow
        );
        break;
      case TableCsvExporter.DOWNLOAD_OPTIONS.CUSTOMIZED_ROWS:
        switch (customizedDownloadOption) {
          case TableCsvExporter.CUSTOMIZED_ROWS_OPTIONS.FIRST:
            snapshotRanges.push(
              new GridRange(
                null,
                0,
                null,
                Math.min(customizedDownloadRows - 1, rowCount - 1)
              )
            );
            break;
          case TableCsvExporter.CUSTOMIZED_ROWS_OPTIONS.LAST:
            snapshotRanges.push(
              new GridRange(
                null,
                Math.max(0, rowCount - customizedDownloadRows),
                null,
                rowCount - 1
              )
            );
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    return snapshotRanges;
  }

  resetDownloadState() {
    this.setState({ errorMessage: null });
  }

  handleDownloadClick() {
    const {
      model,
      isDownloading,
      onDownloadStart,
      onDownload,
      onCancel,
    } = this.props;
    const { fileName } = this.state;

    if (isDownloading) {
      onCancel();
      return;
    }

    this.resetDownloadState();

    const snapshotRanges = this.getSnapshotRanges();
    if (this.validateOptionInput()) {
      onDownloadStart();
      model.export().then(frozenTable => {
        const tableSubscription = frozenTable.setViewport(0, 0);
        tableSubscription.getViewportData().then(() => {
          onDownload(fileName, frozenTable, tableSubscription, snapshotRanges);
        });
      });
    }
  }

  handleDownloadOptionChanged(event) {
    this.setState({ downloadOption: event.target.value });
  }

  handleCustomizedDownloadOptionChanged(event) {
    this.setState({ customizedDownloadOption: event.target.value });
  }

  handleCustomizedDownloadRowsChanged(event) {
    this.setState({ customizedDownloadRows: event.target.value });
  }

  validateOptionInput() {
    const { selectedRanges } = this.props;
    const { downloadOption, customizedDownloadRows } = this.state;

    if (
      downloadOption === TableCsvExporter.DOWNLOAD_OPTIONS.SELECTED_ROWS &&
      selectedRanges.length === 0
    ) {
      this.setState({
        errorMessage: (
          <p>
            <FontAwesomeIcon icon={vsIssues} /> No rows selected. Please select
            some rows in the table.
          </p>
        ),
      });
      return false;
    }

    if (
      downloadOption === TableCsvExporter.DOWNLOAD_OPTIONS.CUSTOMIZED_ROWS &&
      customizedDownloadRows <= 0
    ) {
      this.setState({
        errorMessage: (
          <p>
            <FontAwesomeIcon icon={vsIssues} /> Number of rows to output must be
            greater than 0
          </p>
        ),
      });
      return false;
    }
    return true;
  }

  render() {
    const {
      model,
      isDownloading,
      tableDownloadProgress,
      tableDownloadEstimatedTime,
      selectedRanges,
      tableDownloadStatus,
    } = this.props;
    const {
      fileName,
      downloadOption,
      customizedDownloadOption,
      customizedDownloadRows,
      errorMessage,
      id,
    } = this.state;
    const { rowCount } = model;
    return (
      <div className="table-csv-exporter">
        <div className="section-title">Download Rows</div>
        <div className="form-group">
          <RadioGroup
            onChange={this.handleDownloadOptionChanged}
            value={downloadOption}
            disabled={isDownloading}
          >
            <RadioItem
              value={TableCsvExporter.DOWNLOAD_OPTIONS.ALL_ROWS}
              dataTestid="csv-exporter-download-all-radio"
            >
              All Rows
              <span className="text-muted ml-2">
                {`(${rowCount
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} rows)`}
              </span>
            </RadioItem>
            <RadioItem
              value={TableCsvExporter.DOWNLOAD_OPTIONS.SELECTED_ROWS}
              dataTestid="csv-exporter-only-selected-radio"
            >
              Only Selected Rows
              <span className="text-muted ml-2">
                {selectedRanges.length > 0
                  ? `(${GridRange.rowCount(selectedRanges)
                      .toString()
                      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} rows)`
                  : null}
              </span>
            </RadioItem>
            <RadioItem
              value={TableCsvExporter.DOWNLOAD_OPTIONS.CUSTOMIZED_ROWS}
              dataTestid="csv-exporter-customized-rows-radio"
            >
              <div
                className="radio-input-row"
                role="presentation"
                onClick={() => {
                  this.setState({
                    downloadOption:
                      TableCsvExporter.DOWNLOAD_OPTIONS.CUSTOMIZED_ROWS,
                  });
                }}
              >
                <select
                  defaultValue={TableCsvExporter.DOWNLOAD_OPTIONS.FIRST}
                  value={customizedDownloadOption}
                  data-testid="csv-exporter-customized-rows-select"
                  className="custom-select"
                  disabled={isDownloading}
                  onChange={this.handleCustomizedDownloadOptionChanged}
                >
                  <option value="FIRST">First</option>
                  <option value="LAST">Last</option>
                </select>
                <input
                  type="number"
                  className="form-control"
                  id={`customizedRows-${id}`}
                  data-testid="csv-exporter-customized-rows-input"
                  name={`customizedRows-${id}`}
                  placeholder="100"
                  value={customizedDownloadRows}
                  disabled={isDownloading}
                  onChange={this.handleCustomizedDownloadRowsChanged}
                />
                <div>Rows</div>
              </div>
            </RadioItem>
          </RadioGroup>
        </div>
        <div className="form-group">
          <label htmlFor={`customizedRows-${id}`}>File Name</label>
          <input
            type="text"
            className="form-control"
            id={`filename-${id}`}
            data-testid="csv-exporter-file-name-input"
            name={`filename-${id}`}
            value={fileName}
            onChange={event => {
              this.setState({ fileName: event.target.value });
            }}
            disabled={isDownloading}
          />
        </div>
        <div className="section-footer flex-column">
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          {tableDownloadStatus && (
            <div className="download-status">
              {(tableDownloadStatus ===
                TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING ||
                tableDownloadStatus ===
                  TableCsvExporter.DOWNLOAD_STATUS.INITIATING) && (
                <>
                  {tableDownloadStatus ===
                    TableCsvExporter.DOWNLOAD_STATUS.INITIATING && (
                    <div className="text-muted">Starting Download...</div>
                  )}
                  {tableDownloadStatus ===
                    TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING && (
                    <div className="text-muted d-flex justify-content-between">
                      <span>
                        {tableDownloadEstimatedTime ||
                        tableDownloadEstimatedTime === 0
                          ? `Estimated time: ${TimeUtils.formatElapsedTime(
                              tableDownloadEstimatedTime
                            )}`
                          : null}
                      </span>
                      <span>{`${tableDownloadProgress}%`}</span>
                    </div>
                  )}
                </>
              )}
              {tableDownloadStatus ===
                TableCsvExporter.DOWNLOAD_STATUS.FINISHED && (
                <div className="text-muted text-right">Download Completed</div>
              )}
              {tableDownloadStatus ===
                TableCsvExporter.DOWNLOAD_STATUS.CANCELED && (
                <div className="text-muted">Download Canceled</div>
              )}

              {(tableDownloadStatus ===
                TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING ||
                tableDownloadStatus ===
                  TableCsvExporter.DOWNLOAD_STATUS.INITIATING) && (
                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${tableDownloadProgress}%` }}
                  />
                </div>
              )}
              {tableDownloadStatus ===
                TableCsvExporter.DOWNLOAD_STATUS.FINISHED && (
                <div className="progress">
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${tableDownloadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            data-testid="csv-exporter-download-button"
            className={ClassNames('btn btn-primary btn-downloading', {
              'btn-spinner btn-cancelable': isDownloading,
            })}
            onClick={this.handleDownloadClick}
          >
            {isDownloading && (
              <span>
                <LoadingSpinner />
                <span className="btn-normal-content">Downloading</span>
                <span className="btn-hover-content">Cancel</span>
              </span>
            )}
            {!isDownloading && 'Download'}
          </button>
        </div>
      </div>
    );
  }
}

TableCsvExporter.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  name: PropTypes.string.isRequired,
  isDownloading: PropTypes.bool,
  tableDownloadStatus: PropTypes.string,
  tableDownloadProgress: PropTypes.number,
  tableDownloadEstimatedTime: PropTypes.number,
  onDownloadStart: PropTypes.func,
  onDownload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  selectedRanges: PropTypes.arrayOf(PropTypes.instanceOf(GridRange)),
};

TableCsvExporter.defaultProps = {
  onDownloadStart: () => {},
  isDownloading: false,
  tableDownloadStatus: '',
  tableDownloadProgress: 0,
  tableDownloadEstimatedTime: null,
  selectedRanges: [],
};
export default TableCsvExporter;
