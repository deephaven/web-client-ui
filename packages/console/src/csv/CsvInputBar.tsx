import React, {
  ChangeEvent,
  Component,
  FormEvent,
  ReactElement,
  RefObject,
} from 'react';
import classNames from 'classnames';
import type { JSZipObject } from 'jszip';
import { Button, Checkbox } from '@deephaven/components';
import { IdeSession, Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
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

interface CsvInputBarProps {
  session: IdeSession;
  onOpenTable: (name: string) => void;
  onClose: () => void;
  onUpdate: (update: string) => void;
  onError: (e: unknown) => void;
  file: File;
  paste?: string;
  onInProgress: (boolean: boolean) => void;
  timeZone: string;
  unzip?: (zipFile: File) => Promise<JSZipObject[]>;
}

interface CsvInputBarState {
  tableName: string;
  tableNameSet: boolean;
  isFirstRowHeaders: boolean;
  showProgress: boolean;
  progressValue: number;
  type: keyof typeof CsvFormats.TYPES;
  parser: CsvParser | null;
}
/**
 * Input controls for CSV upload.
 */
class CsvInputBar extends Component<CsvInputBarProps, CsvInputBarState> {
  static defaultProps = {
    file: null,
    paste: null,
    unzip: null,
  };

  constructor(props: CsvInputBarProps) {
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
  componentDidUpdate(prevProps: CsvInputBarProps): void {
    const { file, paste } = this.props;
    const { tableName, tableNameSet } = this.state;
    // Set the table name from a file
    if (!tableNameSet && file != null && !tableName) {
      const dotIndex = file.name.lastIndexOf('.');
      const fileTableName = DbNameValidator.legalizeTableName(
        file.name.substring(0, dotIndex)
      );
      this.setState({
        tableName: fileTableName,
        tableNameSet: true,
      });
      this.inputRef.current?.focus();
    } else if (
      (file == null && prevProps.file != null) ||
      (paste == null && prevProps.paste != null)
    ) {
      // The file or paste was unstaged
      this.setState({
        tableName: '',
        tableNameSet: false,
      });
    }

    // Focus the name input field on paste
    if (paste != null && paste !== '' && !tableName && this.inputRef.current) {
      this.inputRef.current.focus();
    }

    // Determine parser type by file extension
    if (file != null && file !== prevProps.file) {
      this.setState({
        type: CsvFormats.fromExtension(file.name),
      });
    } else if (
      paste != null &&
      paste !== '' &&
      (prevProps.paste === undefined || prevProps.paste === '')
    ) {
      this.setState({
        type: CsvFormats.AUTO,
      });
    }
  }

  componentWillUnmount(): void {
    const { parser } = this.state;
    if (parser) {
      parser.cancel();
    }
  }

  inputRef: RefObject<HTMLInputElement>;

  handleCancel(): void {
    const { onClose } = this.props;
    onClose();
  }

  handleError(e: unknown): void {
    const { onClose, onError } = this.props;
    log.error(e);
    onError(e);
    onClose();
  }

  handleTableName(event: ChangeEvent<HTMLInputElement>): void {
    this.setState({ tableName: event.target.value, tableNameSet: true });
  }

  toggleFirstRowHeaders(): void {
    const { isFirstRowHeaders } = this.state;
    this.setState({ isFirstRowHeaders: !isFirstRowHeaders });
  }

  handleUpload(event: FormEvent<HTMLFormElement>): void {
    event.stopPropagation();
    event.preventDefault();
    const { file, paste } = this.props;
    if (file != null) {
      if (file.name.endsWith('.zip')) {
        this.handleZipFile(file);
      } else {
        this.handleFile(file);
      }
    } else if (paste !== undefined && paste !== '') {
      this.handleFile(
        new Blob([paste], {
          type: 'text/plain',
        })
      );
    }
  }

  handleFile(file: Blob | JSZipObject, isZip = false): void {
    log.info(
      `Starting CSV parser for ${
        file instanceof File ? file.name : 'pasted values'
      } ${isZip ? '' : (file as Blob).size} bytes`
    );
    const { session, timeZone, onInProgress } = this.props;
    const { tableName, isFirstRowHeaders, type } = this.state;
    const handleParseDone = (tables: Table[]) => {
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

  handleZipFile(zipFile: File): void {
    const { onUpdate, unzip } = this.props;
    if (unzip == null) {
      this.handleError(new Error('No support for zip files available.'));
      return;
    }

    unzip(zipFile)
      .then(files => {
        let csvFound = false;
        // Find the first Csv file in the zip and use that
        for (let i = 0; i < files.length; i += 1) {
          const f = files[i];
          if (CsvOverlay.isValidExtension(f.name)) {
            onUpdate(`Loading ${f.name} as csv from ${zipFile.name}`);
            csvFound = true;
            this.handleFile(f, true);
            break;
          }
        }
        if (!csvFound) {
          throw new Error(`No csv file found in ${zipFile.name}`);
        }
      })
      .catch(e => this.handleError(e));
  }

  handleProgress(progressValue: number): boolean {
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
  handleCancelInProgress(): void {
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

  openTable(): void {
    const { onOpenTable, onClose } = this.props;
    const { tableName } = this.state;
    onOpenTable(tableName);
    onClose();
  }

  handleQueryTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    this.setState({
      type: event.target.value as keyof typeof CsvFormats.TYPES,
    });
  }

  render(): ReactElement {
    const { file, paste } = this.props;
    const {
      tableName,
      isFirstRowHeaders,
      showProgress,
      progressValue,
      type,
    } = this.state;
    // A blank table name is invalid for pasted values
    const isNameInvalid = Boolean(paste) && !tableName;
    return (
      <div className="csv-input-bar">
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
                disabled={
                  !(file !== null || (paste !== undefined && paste !== '')) ||
                  !tableName
                }
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
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <label>{progressValue}%</label>
            <Button kind="secondary" onClick={this.handleCancelInProgress}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }
}

export default CsvInputBar;
