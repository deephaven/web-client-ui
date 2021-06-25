import React, { ChangeEvent, KeyboardEvent, PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { BasicModal } from '@deephaven/components';
import {
  CancelablePromise,
  Pending,
  PromiseUtils,
  ValidationError,
} from '@deephaven/utils';
import Log from '@deephaven/log';
import FileExplorer, { FileInfo, FileType } from './FileExplorer';
import FileStorage from './FileStorage';
import FileUtils from './FileUtils';

import './NewItemModal.scss';

const log = Log.module('NewItemModal');

export type NewItemModalProps = typeof NewItemModal.defaultProps & {
  isOpen: boolean;
  title: string;
  defaultPath: string;
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
  disableSubmit: boolean;
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
    defaultValue: '',
    notifyOnExtensionChange: false,
    placeholder: '',
    onSubmit: (name: string): void => undefined,
    onCancel: (): void => undefined,
  };

  static handleError(err: Error): void {
    if (!PromiseUtils.isCanceled(err)) {
      log.error(err);
    }
  }

  constructor(props: NewItemModalProps) {
    super(props);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
    this.handleModalOpened = this.handleModalOpened.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
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

    const { defaultValue } = props;

    this.state = {
      disableSubmit: false,
      path: FileUtils.getPath(defaultValue),
      prevExtension: FileUtils.getExtension(defaultValue),
      showExtensionChangeModal: false,
      showOverwriteModal: false,
      value: FileUtils.getFileName(defaultValue),
    };
  }

  componentDidUpdate(
    prevProps: NewItemModalProps,
    prevState: NewItemModalState
  ): void {
    const { isOpen } = this.props;
    const { isOpen: prevIsOpen } = prevProps;
    const { value, path } = this.state;
    log.debug('update modal', isOpen, prevIsOpen);
    if (!prevIsOpen && isOpen) {
      this.resetValue();
    }
    if (path !== prevState.path || value !== prevState.value) {
      this.updateValidationStatus(path, value);
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

  private cancelableExistingItemPromise?: CancelablePromise<FileInfo | null>;

  private pending = new Pending();

  private pathMap = new Map();

  resetValue(): void {
    const { defaultValue } = this.props as NewItemModalProps;
    this.setState({
      path: FileUtils.getPath(defaultValue),
      value: FileUtils.getFileName(defaultValue),
      validationError: undefined,
      prevExtension: FileUtils.getExtension(defaultValue),
    });
  }

  getValidationPromise(
    path: string,
    newName: string
  ): CancelablePromise<string> {
    if (this.cancelableValidatePromise) {
      this.cancelableValidatePromise.cancel();
    }
    // TODO: Re-enable validation
    // const { fileStorage, type } = this.props;
    // const isFolder = type === 'directory';
    // // Don't allow using existing names for folders
    // const allowExistingName = !isFolder;
    this.cancelableValidatePromise = PromiseUtils.makeCancelable(
      Promise.resolve(newName)
    );
    return this.cancelableValidatePromise;
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

  handleItemSelect(item: FileInfo): void {
    log.debug('handleItemSelect', item);
    if (item.type === 'directory') {
      this.setState({ path: item.name });
    } else {
      // Use selected item name and folder and focus the input
      const value = FileUtils.getFileName(item.name);
      const path = FileUtils.getPath(item.name);
      this.setState({ value, path }, () => {
        this.focusRenameInput();
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleKeyDown(e: KeyboardEvent): void {
    const { key } = e;
    log.debug(key);

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
      disableSubmit: false,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleOverwriteConfirm(): void {
    // TODO: Make this overwrite correctly
    // this.setState({ showOverwriteModal: false });
    // const { onSubmit } = this.props;
    // const { path, value: newItemName } = this.state;
    // log.debug('handleOverwriteConfirm', path, newItemName);
    // onSubmit(path, newItemName);
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

  checkForExistingItem(fileName: string): Promise<FileInfo | null> {
    const { type } = this.props;
    const { path } = this.state;
    const isFolder = type === 'directory';
    log.debug('checkForExistingItem', path, fileName, isFolder);
    // TODO: Actually check for an existing item
    return Promise.resolve(null);
  }

  focusRenameInput(): void {
    const input = this.inputRef.current;
    if (input) {
      const { type } = this.props;
      FileUtils.focusRenameInput(input, type === 'directory');
    }
  }

  submitModal(skipExtensionCheck = false): void {
    this.setState(({ prevExtension, value, path }) => {
      const { notifyOnExtensionChange } = this.props;
      log.debug('submitModal', prevExtension, value);
      const newExtension = FileUtils.getExtension(value);
      if (
        notifyOnExtensionChange &&
        !skipExtensionCheck &&
        prevExtension !== null &&
        prevExtension !== newExtension
      ) {
        return {
          disableSubmit: false,
          showExtensionChangeModal: true,
          newExtension,
        };
      }

      this.getValidationPromise(path, value)
        .then(newItemName => {
          if (this.cancelableExistingItemPromise) {
            this.cancelableExistingItemPromise.cancel();
          }
          this.cancelableExistingItemPromise = PromiseUtils.makeCancelable(
            this.checkForExistingItem(newItemName)
          );
          return this.cancelableExistingItemPromise.then(existingFile => {
            if (!existingFile) {
              const { onSubmit } = this.props;
              onSubmit(`${path}${value}`);
            } else {
              this.setState({ showOverwriteModal: true });
            }
          });
        })
        .catch(e => {
          if (!PromiseUtils.isCanceled(e)) {
            this.setState({ disableSubmit: false });
          }
          throw e;
        })
        .catch(this.handleValidationError)
        .catch(NewItemModal.handleError);

      return {
        disableSubmit: true,
        showExtensionChangeModal: false,
        newExtension: undefined,
      };
    });
  }

  render(): React.ReactNode {
    const { storage, isOpen, onCancel, placeholder, title, type } = this.props;
    const {
      disableSubmit,
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
                    <div className="invalid-feedback">{validationError}</div>
                  )}
                </div>
                <div className="flex-grow-0">
                  <label>
                    Directory: <span className="new-item-parentId">{path}</span>
                  </label>
                </div>
                <div className="flex-grow-1 file-explorer-container">
                  <FileExplorer
                    onSelect={this.handleItemSelect}
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
              disabled={disableSubmit}
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
          bodyText="File or folder with this name already exists, are you sure you want to overwrite it?"
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
