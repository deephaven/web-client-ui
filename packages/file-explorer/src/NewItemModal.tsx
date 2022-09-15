import React, { ChangeEvent, KeyboardEvent, PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  BasicModal,
  Button,
} from '@deephaven/components';
import {
  CancelablePromise,
  Pending,
  PromiseUtils,
  ValidationError,
} from '@deephaven/utils';
import Log from '@deephaven/log';
import FileExplorer from './FileExplorer';
import FileStorage, { FileStorageItem, FileType } from './FileStorage';
import FileUtils from './FileUtils';

import './NewItemModal.scss';
import FileExistsError from './FileExistsError';
import FileNotFoundError from './FileNotFoundError';

const log = Log.module('NewItemModal');

export type NewItemModalProps = typeof NewItemModal.defaultProps & {
  isOpen: boolean;
  title: string;
  defaultValue: string;
  type: FileType;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  placeholder: string;
  storage: FileStorage;
  notifyOnExtensionChange?: boolean;
};

export type NewItemModalState = {
  path: string;
  isSubmitting: boolean;
  showExtensionChangeModal: boolean;
  showOverwriteModal: boolean;
  validationError?: ValidationError;
  value: string;
  prevExtension?: string;
  newExtension?: string;
};

class NewItemModal extends PureComponent<NewItemModalProps, NewItemModalState> {
  static propTypes = {
    isOpen: PropTypes.bool,
    title: PropTypes.string.isRequired,
    defaultValue: PropTypes.string,
    type: PropTypes.oneOf(['file', 'directory']).isRequired,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    placeholder: PropTypes.string,
    storage: PropTypes.shape({}).isRequired,
    notifyOnExtensionChange: PropTypes.bool,
  };

  static defaultProps = {
    isOpen: false,
    defaultValue: '/',
    notifyOnExtensionChange: false,
    placeholder: '',
    onSubmit: (name: string): void => undefined,
    onCancel: (): void => undefined,
  };

  static getValidationMessage(err: Error): string {
    if (err instanceof FileExistsError && err.info.type === 'directory') {
      return 'Error: Cannot overwrite existing directory';
    }
    return `${err}`;
  }

  static handleError(err: Error): void {
    if (!PromiseUtils.isCanceled(err)) {
      log.error(err);
    }
  }

  constructor(props: NewItemModalProps) {
    super(props);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
    this.handleModalOpened = this.handleModalOpened.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleValidationError = this.handleValidationError.bind(this);
    this.handleOverwriteCancel = this.handleOverwriteCancel.bind(this);
    this.handleOverwriteConfirm = this.handleOverwriteConfirm.bind(this);
    this.handleExtensionChangeCancel = this.handleExtensionChangeCancel.bind(
      this
    );
    this.handleExtensionChangeConfirm = this.handleExtensionChangeConfirm.bind(
      this
    );
    this.handleBreadcrumbSelect = this.handleBreadcrumbSelect.bind(this);

    const { defaultValue } = props;

    const path = FileUtils.hasPath(defaultValue)
      ? FileUtils.getPath(defaultValue)
      : '/';

    this.state = {
      isSubmitting: false,
      path,
      prevExtension: FileUtils.getExtension(defaultValue),
      showExtensionChangeModal: false,
      showOverwriteModal: false,
      value: FileUtils.getBaseName(defaultValue),
    };
  }

  componentDidUpdate(
    prevProps: NewItemModalProps,
    prevState: NewItemModalState
  ): void {
    const { isOpen } = this.props;
    const { isOpen: prevIsOpen } = prevProps;
    const { value, path } = this.state;
    if (!prevIsOpen && isOpen) {
      this.resetValue();
    }
    if (path !== prevState.path || value !== prevState.value) {
      this.updateValidationStatus(path, value);
    }
  }

  componentWillUnmount(): void {
    this.pending.cancel();
    if (this.cancelableValidatePromise) {
      this.cancelableValidatePromise.cancel();
    }
    if (this.cancelableExistingItemPromise) {
      this.cancelableExistingItemPromise.cancel();
    }
  }

  private inputRef = React.createRef<HTMLInputElement>();

  private cancelableValidatePromise?: CancelablePromise<string>;

  private cancelableExistingItemPromise?: CancelablePromise<FileStorageItem | null>;

  private pending = new Pending();

  private pathMap = new Map();

  resetValue(): void {
    const { defaultValue } = this.props as NewItemModalProps;
    const path = FileUtils.hasPath(defaultValue)
      ? FileUtils.getPath(defaultValue)
      : '/';
    this.setState({
      path,
      value: FileUtils.getBaseName(defaultValue),
      validationError: undefined,
      prevExtension: FileUtils.getExtension(defaultValue),
      isSubmitting: false,
    });
  }

  getValidationPromise(
    path: string,
    name: string,
    checkExisting = false
  ): CancelablePromise<string> {
    if (this.cancelableValidatePromise) {
      this.cancelableValidatePromise.cancel();
    }
    this.cancelableValidatePromise = PromiseUtils.makeCancelable(
      this.validateName(path, name, checkExisting)
    );
    return this.cancelableValidatePromise;
  }

  async validateName(
    path: string,
    name: string,
    checkExisting: boolean
  ): Promise<string> {
    FileUtils.validateName(name);

    const { defaultValue, storage } = this.props;
    if (checkExisting) {
      const value = `${path}${name}`;
      if (value !== defaultValue) {
        try {
          const existingFile = await storage.info(value);
          throw new FileExistsError(existingFile);
        } catch (e) {
          if (!(e instanceof FileNotFoundError)) {
            throw e;
          }
          // There is no existing file, ignore
        }
      }
    }

    return name;
  }

  updateValidationStatus(path: string, newName: string): void {
    this.getValidationPromise(path, newName)
      .then(() => {
        this.setState({ validationError: undefined });
      })
      .catch(this.handleValidationError)
      .catch(NewItemModal.handleError);
  }

  handleModalOpened(): void {
    this.focusRenameInput();
  }

  handleModalSubmit(): void {
    this.submitModal();
  }

  handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { value } = event.target;
    this.setState({ value });
  }

  handleSelect(item: FileStorageItem): void {
    log.debug('handleSelect', item);
    if (item.type === 'directory') {
      this.setState({ path: FileUtils.makePath(item.filename) });
    } else {
      // Use selected item name and folder and focus the input
      const value = item.basename;
      const path = FileUtils.getPath(item.filename);
      this.setState({ value, path }, () => {
        this.focusRenameInput();
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleKeyDown(e: KeyboardEvent): void {
    const { key } = e;
    e.stopPropagation();

    switch (key) {
      case 'Enter': {
        // Prevent form submit event
        e.preventDefault();
        this.submitModal();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        const { onCancel } = this.props;
        onCancel();
        break;
      }
      default:
    }
  }

  handleValidationError(err: Error): void {
    if (!(err instanceof ValidationError)) {
      throw err;
    }
    log.debug('Validation error', err);
    this.setState({ validationError: err });
  }

  handleOverwriteCancel(): void {
    this.setState({
      showOverwriteModal: false,
      isSubmitting: false,
    });
  }

  handleOverwriteConfirm(): void {
    this.setState({ showOverwriteModal: false });
    const { onSubmit } = this.props;
    const { path, value } = this.state;
    log.debug('handleOverwriteConfirm', path, value);
    onSubmit(`${path}${value}`);
  }

  handleExtensionChangeCancel(): void {
    log.debug('handleExtensionChangeCancel');
    this.setState(({ value, prevExtension }) => {
      const newValue = FileUtils.replaceExtension(value, prevExtension);
      return {
        showExtensionChangeModal: false,
        value: newValue,
      };
    });

    this.submitModal(true);
  }

  handleExtensionChangeConfirm(): void {
    log.debug('handleExtensionChangeConfirm');
    this.setState({ showExtensionChangeModal: false });
    this.submitModal(true);
  }

  /**
   * Focus rename input and select name part for files, select all text for folders
   */
  focusRenameInput(): void {
    const input = this.inputRef.current;
    if (input) {
      const { type } = this.props;
      const { value } = input;
      const selectionEnd =
        type === 'directory' ? value.length : value.lastIndexOf('.');
      input.focus();
      input.setSelectionRange(
        0,
        selectionEnd > 0 ? selectionEnd : value.length
      );
    }
  }

  submitModal(skipExtensionCheck = false): void {
    this.setState(({ prevExtension, value, path }) => {
      const { notifyOnExtensionChange, type } = this.props;
      log.debug('submitModal', prevExtension, value);
      const newExtension = FileUtils.getExtension(value);
      if (
        notifyOnExtensionChange &&
        !skipExtensionCheck &&
        prevExtension !== null &&
        prevExtension !== newExtension
      ) {
        return {
          isSubmitting: false,
          showExtensionChangeModal: true,
          newExtension,
        };
      }

      this.getValidationPromise(path, value, true)
        .then((newItemName: string) => {
          const { onSubmit } = this.props;
          onSubmit(`${path}${value}`);
        })
        .catch(e => {
          // Don't allow using existing names for folders
          // For files, prompt if they want to overwrite existing file
          if (e instanceof FileExistsError) {
            if (type !== 'directory' && e.info.type !== 'directory') {
              this.setState({ showOverwriteModal: true });
              return;
            }
          }
          throw e;
        })
        .catch(e => {
          if (PromiseUtils.isCanceled(e)) {
            this.setState({ isSubmitting: false });
          }
          throw e;
        })
        .catch(this.handleValidationError)
        .catch(NewItemModal.handleError);

      return {
        isSubmitting: true,
        showExtensionChangeModal: false,
        newExtension: undefined,
      };
    });
  }

  handleBreadcrumbSelect(directoryPath: string): void {
    this.setState({ path: directoryPath.slice(4) });
  }

  renderPathButtons(path: string): React.ReactNode {
    const pathAsList = path.split('/');
    pathAsList[0] = 'root';
    pathAsList.pop();
    return pathAsList.map((basename, index) => {
      let directoryPath = '';
      for (let i = 0; i < index; i += 1) {
        directoryPath += `${pathAsList[i]}/`;
      }
      directoryPath += `${basename}/`;

      return (
        <React.Fragment key={directoryPath}>
          <Button
            kind="ghost"
            className="directory-breadcrumbs"
            onClick={() => this.handleBreadcrumbSelect(directoryPath)}
          >
            {basename}
          </Button>
          /
        </React.Fragment>
      );
    });
  }

  render(): React.ReactNode {
    const { storage, isOpen, onCancel, placeholder, title, type } = this.props;
    const {
      isSubmitting,
      path,
      showExtensionChangeModal,
      showOverwriteModal,
      validationError,
      value,
      prevExtension,
      newExtension,
    } = this.state;

    const isDirectory = type === 'directory';
    const prevExtensionText = FileUtils.fileExtensionToString(prevExtension);
    const newExtensionText = FileUtils.fileExtensionToString(newExtension);
    const submitBtnLabel = isDirectory ? 'Create' : 'Save';
    const nameInputLabel = isDirectory ? 'New folder name' : 'Save file as';

    return (
      <>
        <Modal
          isOpen={isOpen}
          toggle={onCancel}
          onOpened={this.handleModalOpened}
          className="modal-dialog-centered new-file-modal theme-bg-dark"
        >
          <ModalHeader toggle={onCancel}>{title}</ModalHeader>
          <ModalBody>
            <form>
              <div className="d-flex flex-column new-file-modal-content">
                <div className="flex-grow-0 mb-4">
                  <label htmlFor="file-name-input">{nameInputLabel}</label>
                  <input
                    id="file-name-input"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className={classNames('form-control', {
                      'is-invalid': validationError,
                    })}
                    value={value}
                    placeholder={placeholder}
                    ref={this.inputRef}
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                  />
                  {validationError && (
                    <div className="invalid-feedback">
                      {NewItemModal.getValidationMessage(validationError)}
                    </div>
                  )}
                </div>
                <div className="flex-grow-0">
                  <label>Directory: /</label>
                  {this.renderPathButtons(path)}
                </div>
                <div className="flex-grow-1 file-explorer-container">
                  <FileExplorer
                    onSelect={this.handleSelect}
                    storage={storage}
                  />
                </div>
              </div>
            </form>
          </ModalBody>

          <ModalFooter>
            <button
              className="btn btn-outline-primary"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={this.handleModalSubmit}
              type="button"
            >
              {submitBtnLabel}
            </button>
          </ModalFooter>
        </Modal>
        <BasicModal
          isOpen={showOverwriteModal}
          headerText="Confirm overwrite"
          bodyText="File with this name already exists, are you sure you want to overwrite it?"
          onCancel={this.handleOverwriteCancel}
          onConfirm={this.handleOverwriteConfirm}
          cancelButtonText="Cancel"
          confirmButtonText="Overwrite"
        />
        <BasicModal
          isOpen={showExtensionChangeModal}
          headerText="Confirm extension change"
          bodyText={`Are you sure you want to change extension from "${prevExtensionText}" to "${newExtensionText}"?`}
          onCancel={this.handleExtensionChangeCancel}
          onConfirm={this.handleExtensionChangeConfirm}
          cancelButtonText={`Keep "${prevExtensionText}"`}
          confirmButtonText={`Use "${newExtensionText}"`}
        />
      </>
    );
  }
}

export default NewItemModal;
