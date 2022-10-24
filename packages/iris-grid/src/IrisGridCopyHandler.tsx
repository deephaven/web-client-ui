import React, { Component } from 'react';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import {
  ContextActionUtils,
  LoadingSpinner,
  ThemeExport,
} from '@deephaven/components';
import {
  GridRange,
  GridUtils,
  ModelSizeMap,
  MoveOperation,
} from '@deephaven/grid';
import {
  CancelablePromise,
  CanceledPromiseError,
  PromiseUtils,
} from '@deephaven/utils';
import Log from '@deephaven/log';
import { Column } from '@deephaven/jsapi-shim';
import IrisGridUtils from './IrisGridUtils';
import IrisGridBottomBar from './IrisGridBottomBar';
import './IrisGridCopyHandler.scss';
import IrisGridModel from './IrisGridModel';

const log = Log.module('IrisGridCopyHandler');

type Values<T> = T[keyof T];

type ButtonStateType = Values<typeof IrisGridCopyHandler.BUTTON_STATES>;

export type CopyOperation = {
  ranges: GridRange[];
  includeHeaders: boolean;
  formatValues?: boolean;
  movedColumns: MoveOperation[];
  userColumnWidths: ModelSizeMap;
  error?: string;
};

interface IrisGridCopyHandlerProps {
  model: IrisGridModel;
  copyOperation: CopyOperation;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;
}

interface IrisGridCopyHandlerState {
  error?: string;
  copyState: string;
  buttonState: string;
  isShown: boolean;
  rowCount: number;
}
/**
 * Component for handling copying of data from the Iris Grid.
 * - Prompts if necessary (large amount of rows copied)
 * - Tries to async copy, falls back to showing a "Click to Copy" button if that fails
 */
class IrisGridCopyHandler extends Component<
  IrisGridCopyHandlerProps,
  IrisGridCopyHandlerState
> {
  static NO_PROMPT_THRESHOLD = 10000;

  static HIDE_TIMEOUT = 3000;

  /**
   * Different states for the current copy operation
   */
  static COPY_STATES = {
    // No copy operation in progress
    IDLE: 'IDLE',

    // Large copy operation, confirmation required
    CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',

    // Fetch is currently in progress
    FETCH_IN_PROGRESS: 'FETCH_IN_PROGRESS',

    // There was an error fetching the data
    FETCH_ERROR: 'FETCH_ERROR',

    // Click is required to copy
    CLICK_REQUIRED: 'CLICK_REQUIRED',

    // The copy operation is completed and successfully copied to the clipboard
    DONE: 'DONE',
  };

  static BUTTON_STATES = {
    COPY: 'COPY',
    FETCH_IN_PROGRESS: 'FETCH_IN_PROGRESS',
    CLICK_TO_COPY: 'CLICK_TO_COPY',
    RETRY: 'RETRY',
  };

  static defaultProps = {
    copyOperation: null,
    onEntering: (): void => undefined,
    onEntered: (): void => undefined,
    onExiting: (): void => undefined,
    onExited: (): void => undefined,
  };

  static getStatusMessageText(copyState: string, rowCount: number): string {
    switch (copyState) {
      case IrisGridCopyHandler.COPY_STATES.CONFIRMATION_REQUIRED:
        return `Are you sure you want to copy ${rowCount.toLocaleString()} rows to your clipboard?`;
      case IrisGridCopyHandler.COPY_STATES.CLICK_REQUIRED:
        return `Fetched ${rowCount.toLocaleString()} rows!`;
      case IrisGridCopyHandler.COPY_STATES.FETCH_ERROR:
        return 'Unable to copy data.';
      case IrisGridCopyHandler.COPY_STATES.FETCH_IN_PROGRESS:
        return `Fetching ${rowCount.toLocaleString()} rows for clipboard...`;
      case IrisGridCopyHandler.COPY_STATES.DONE:
        return 'Copied to Clipboard!';
      default:
        return '';
    }
  }

  static getCopyButtonText(buttonState: ButtonStateType): string {
    switch (buttonState) {
      case IrisGridCopyHandler.BUTTON_STATES.FETCH_IN_PROGRESS:
        return 'Fetching';
      case IrisGridCopyHandler.BUTTON_STATES.CLICK_TO_COPY:
        return 'Click to Copy';
      case IrisGridCopyHandler.BUTTON_STATES.RETRY:
        return 'Retry';
      default:
        return 'Copy';
    }
  }

  constructor(props: IrisGridCopyHandlerProps) {
    super(props);

    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
    this.handleHideTimeout = this.handleHideTimeout.bind(this);

    this.state = {
      error: undefined,
      copyState: IrisGridCopyHandler.COPY_STATES.IDLE,
      buttonState: IrisGridCopyHandler.BUTTON_STATES.COPY,
      isShown: false,
      rowCount: 0,
    };
  }

  componentDidMount(): void {
    const { copyOperation } = this.props;
    if (copyOperation != null) {
      this.startCopy();
    }
  }

  componentDidUpdate(prevProps: IrisGridCopyHandlerProps): void {
    const { copyOperation } = this.props;
    if (prevProps.copyOperation !== copyOperation) {
      this.startCopy();
    }
  }

  componentWillUnmount(): void {
    this.stopCopy();
  }

  textData?: string;

  hideTimer?: ReturnType<typeof setTimeout>;

  fetchPromise?: CancelablePromise<string>;

  startCopy(): void {
    log.debug2('startCopy');

    this.stopCopy();

    const { copyOperation } = this.props;
    if (copyOperation == null) {
      log.debug2('No copy operation set, cancelling out');
      this.setState({ isShown: false });
      return;
    }

    const { ranges, error } = copyOperation;
    if (error != null) {
      log.debug('Showing copy error', error);
      this.setState({
        isShown: true,
        copyState: IrisGridCopyHandler.COPY_STATES.DONE,
        error,
      });
      this.startHideTimer();
      return;
    }

    const rowCount = GridRange.rowCount(ranges);

    this.setState({ rowCount, isShown: true, error: undefined });

    if (rowCount > IrisGridCopyHandler.NO_PROMPT_THRESHOLD) {
      this.setState({
        buttonState: IrisGridCopyHandler.BUTTON_STATES.COPY,
        copyState: IrisGridCopyHandler.COPY_STATES.CONFIRMATION_REQUIRED,
      });
    } else {
      this.startFetch();
    }
  }

  stopCopy(): void {
    this.textData = undefined;
    this.stopFetch();
    this.stopHideTimer();
  }

  handleBackgroundClick(): void {
    log.debug2('handleBackgroundClick');

    const { copyState } = this.state;
    if (copyState === IrisGridCopyHandler.COPY_STATES.DONE) {
      this.setState({ isShown: false });
    }
  }

  handleCancelClick(): void {
    log.debug2('handleCancelClick');

    this.stopFetch();
    this.setState({ isShown: false });
  }

  handleCopyClick(): void {
    log.debug2('handleCopyClick');

    if (this.textData != null) {
      this.copyText(this.textData);
    } else {
      this.startFetch();
    }
  }

  handleHideTimeout(): void {
    log.debug2('handleHideTimeout');

    this.stopHideTimer();

    this.setState({ isShown: false });
  }

  copyText(text: string): void {
    log.debug2('copyText', text);

    this.textData = text;

    ContextActionUtils.copyToClipboard(text).then(
      () => {
        this.setState({ copyState: IrisGridCopyHandler.COPY_STATES.DONE });
        this.startHideTimer();
      },
      error => {
        log.error('copyText error', error);
        this.setState({
          buttonState: IrisGridCopyHandler.BUTTON_STATES.CLICK_TO_COPY,
          copyState: IrisGridCopyHandler.COPY_STATES.CLICK_REQUIRED,
        });
      }
    );
  }

  startFetch(): void {
    this.stopFetch();

    this.setState({
      buttonState: IrisGridCopyHandler.BUTTON_STATES.FETCH_IN_PROGRESS,
      copyState: IrisGridCopyHandler.COPY_STATES.FETCH_IN_PROGRESS,
    });

    const { model, copyOperation } = this.props;
    const {
      ranges,
      includeHeaders,
      userColumnWidths,
      movedColumns,
      formatValues,
    } = copyOperation;
    log.debug('startFetch', ranges);

    const hiddenColumns = IrisGridUtils.getHiddenColumns(userColumnWidths);
    let modelRanges = GridUtils.getModelRanges(ranges, movedColumns);
    if (hiddenColumns.length > 0) {
      const subtractRanges = hiddenColumns.map(GridRange.makeColumn);
      modelRanges = GridRange.subtractRangesFromRanges(
        modelRanges,
        subtractRanges
      );
    }

    // Remove the hidden columns from the snapshot
    const formatValue =
      formatValues != null && formatValues
        ? (value: unknown, column: Column) =>
            model.displayString(value, column.type, column.name)
        : (value: unknown) => `${value}`;

    this.fetchPromise = PromiseUtils.makeCancelable(
      model.textSnapshot(modelRanges, includeHeaders, formatValue)
    );
    this.fetchPromise
      .then((text: string) => {
        this.fetchPromise = undefined;
        this.copyText(text);
      })
      .catch((error: unknown) => {
        if (error instanceof CanceledPromiseError) {
          log.debug('User cancelled copy.');
        } else {
          log.error('Error fetching contents', error);
          this.fetchPromise = undefined;
          this.setState({
            buttonState: IrisGridCopyHandler.BUTTON_STATES.RETRY,
            copyState: IrisGridCopyHandler.COPY_STATES.FETCH_ERROR,
          });
        }
      });
  }

  stopFetch(): void {
    if (this.fetchPromise) {
      log.debug2('stopFetch');
      this.fetchPromise.cancel();
      this.fetchPromise = undefined;
    }
  }

  startHideTimer(): void {
    this.stopHideTimer();

    this.hideTimer = setTimeout(
      this.handleHideTimeout,
      IrisGridCopyHandler.HIDE_TIMEOUT
    );
  }

  stopHideTimer(): void {
    if (this.hideTimer != null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  render(): JSX.Element {
    const { onEntering, onEntered, onExiting, onExited } = this.props;
    const { buttonState, copyState, isShown, rowCount, error } = this.state;

    const animation =
      copyState === IrisGridCopyHandler.COPY_STATES.DONE
        ? 'fade'
        : 'copy-slide-up';
    const copyButtonText = IrisGridCopyHandler.getCopyButtonText(buttonState);
    const statusMessageText =
      error ?? IrisGridCopyHandler.getStatusMessageText(copyState, rowCount);
    const isButtonContainerVisible =
      copyState !== IrisGridCopyHandler.COPY_STATES.DONE;
    const isFetching =
      buttonState === IrisGridCopyHandler.BUTTON_STATES.FETCH_IN_PROGRESS;
    const isDone = copyState === IrisGridCopyHandler.COPY_STATES.DONE;

    return (
      <IrisGridBottomBar
        animation={animation}
        isShown={isShown}
        className={classNames('iris-grid-copy-handler', {
          'copy-done': isDone,
        })}
        onClick={this.handleBackgroundClick}
        onEntering={onEntering}
        onEntered={onEntered}
        onExiting={onExiting}
        onExited={onExited}
      >
        <div className="status-message">
          <span>{statusMessageText}</span>
        </div>
        <CSSTransition
          in={isButtonContainerVisible}
          timeout={ThemeExport.transitionMs}
          classNames="fade"
          mountOnEnter
          unmountOnExit
        >
          <div className="buttons-container">
            <button
              type="button"
              className="btn btn-outline-secondary btn-cancel"
              onClick={this.handleCancelClick}
            >
              Cancel
            </button>
            <button
              type="button"
              className={classNames('btn', 'btn-copy', {
                'btn-primary': !isFetching,
                'btn-secondary': isFetching,
                'btn-spinner': isFetching,
              })}
              onClick={this.handleCopyClick}
              disabled={isFetching}
            >
              {isFetching && <LoadingSpinner />}
              {copyButtonText}
            </button>
          </div>
        </CSSTransition>
      </IrisGridBottomBar>
    );
  }
}

export default IrisGridCopyHandler;
