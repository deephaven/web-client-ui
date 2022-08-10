import React, {
  ChangeEvent,
  Component,
  DragEvent,
  MouseEvent,
  ReactElement,
  RefObject,
} from 'react';
import memoize from 'memoize-one';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextAction,
  ContextActions,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import {
  dhFileCsv,
  dhFileDownload,
  dhFileSpreadsheet,
  IconDefinition,
  vsClippy,
  vsFileZip,
  vsTrash,
  vsWarning,
} from '@deephaven/icons';
import './CsvOverlay.scss';
import { assertNotNull, TextUtils } from '@deephaven/utils';

interface CsvOverlayProps {
  allowZip: boolean;
  onFileOpened: (file: File) => void;
  onCancel: () => void;
  onPaste: (clipText: string) => void;
  clearDragError: () => void;
  dragError: string | null;
  onError: (e: unknown) => void;
  uploadInProgress: boolean;
}

interface CsvOverlayState {
  selectedFileName: string;
  dropError?: string;
}

const PASTED_VALUES = 'pasted values';

const INVALID_MIME_TYPES = [/^audio.*/, /^font.*/, /^image.*/, /^video.*/];

const VALID_EXTENSIONS = ['.csv', '.tsv', '.tab', '.psv', '.dsv', '.txt'];

const ZIP_EXTENSIONS = ['.zip'];

/**
 * Overlay that is displayed when uploading a CSV file.
 */
class CsvOverlay extends Component<CsvOverlayProps, CsvOverlayState> {
  static defaultProps = {
    allowZip: false,
    dragError: null,
  };

  static MULTIPLE_FILE_ERROR = 'Please select only one file';

  static FILE_TYPE_ERROR = 'Filetype not supported.';

  static isValidDropItem(item: DataTransferItem): boolean {
    return (
      item &&
      item.kind === 'file' &&
      !INVALID_MIME_TYPES.find(invalid => invalid.test(item.type))
    );
  }

  static isValidExtension(name: string, allowZip = false): boolean {
    return (
      VALID_EXTENSIONS.some(ext => name.endsWith(ext)) ||
      (allowZip && ZIP_EXTENSIONS.some(ext => name.endsWith(ext)))
    );
  }

  static handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  static getIcon(fileName: string): IconDefinition {
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

  constructor(props: CsvOverlayProps) {
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
    };
  }

  componentDidMount(): void {
    this.divElem.current?.addEventListener('paste', this.handlePasteEvent);
    this.divElem.current?.focus();
  }

  componentWillUnmount(): void {
    this.divElem.current?.removeEventListener('paste', this.handlePasteEvent);
  }

  fileElem: RefObject<HTMLInputElement>;

  divElem: RefObject<HTMLDivElement>;

  handleSelectFile(): void {
    if (this.fileElem.current) {
      this.fileElem.current.value = '';
      this.fileElem.current?.click();
    }
  }

  handleFiles(event: ChangeEvent<HTMLInputElement>): void {
    event.stopPropagation();
    event.preventDefault();
    const { files } = event.target;
    if (files != null) {
      this.handleFile(files[0]);
    }
  }

  handleDrop(e: DragEvent<HTMLDivElement>): void {
    const { allowZip, clearDragError, dragError } = this.props;
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
    assertNotNull(file);
    if (CsvOverlay.isValidExtension(file.name, allowZip)) {
      this.handleFile(file);
    } else {
      this.setState({
        dropError: CsvOverlay.FILE_TYPE_ERROR,
      });
    }
  }

  unstageFile(event: MouseEvent<HTMLButtonElement>): void {
    const { onCancel } = this.props;
    event.stopPropagation();
    event.preventDefault();
    onCancel();
    this.setState({
      selectedFileName: '',
      dropError: undefined,
    });
  }

  handleFile(file: File): void {
    const { onFileOpened } = this.props;
    onFileOpened(file);
    this.setState({
      selectedFileName: file.name,
      dropError: undefined,
    });
  }

  handleMenuPaste(): void {
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
          dropError: undefined,
        });
      })
      .catch((e: unknown) => onError(e));
  }

  handlePasteEvent(event: ClipboardEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.handleMenuPaste();
  }

  makeContextMenuItems(): ContextAction[] {
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

  getValidExtensions = memoize(allowZip =>
    allowZip ? [...VALID_EXTENSIONS, ...ZIP_EXTENSIONS] : [...VALID_EXTENSIONS]
  );

  getAcceptString = memoize(allowZip =>
    this.getValidExtensions(allowZip).join(', ')
  );

  getFileTypeErrorString = memoize(allowZip =>
    TextUtils.join(this.getValidExtensions(allowZip), 'or')
  );

  render(): ReactElement {
    const { allowZip, dragError, uploadInProgress } = this.props;
    const { selectedFileName, dropError } = this.state;
    const error = dragError || dropError;
    const contextActions = this.makeContextMenuItems();
    return (
      <div
        ref={this.divElem}
        className="csv-overlay fill-parent-absolute"
        onDragOver={CsvOverlay.handleDragOver}
        onDrop={this.handleDrop}
        tabIndex={-1}
      >
        <ContextActions actions={contextActions} />
        <input
          ref={this.fileElem}
          type="file"
          id="fileElem"
          accept={this.getAcceptString(allowZip)}
          style={{ display: 'none' }}
          onChange={this.handleFiles}
          data-testid="fileElem"
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
                <label>{this.getFileTypeErrorString(allowZip)}</label>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default CsvOverlay;
