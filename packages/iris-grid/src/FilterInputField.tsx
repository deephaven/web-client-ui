import React, { ChangeEvent, PureComponent, ReactElement } from 'react';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { vsFilter, dhFilterFilled } from '@deephaven/icons';
import './FilterInputField.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { DebouncedFunc } from 'lodash';

interface FilterInputFieldProps {
  className: string;
  style: React.CSSProperties;
  value: string;
  isAdvancedFilterSet: boolean;
  onAdvancedFiltersTriggered: React.MouseEventHandler<HTMLButtonElement>;
  onChange: (value: string) => void;
  onDone: (setGridFocus?: boolean, defocusInput?: boolean) => void;
  onTab: (backward: boolean) => void;
  onContextMenu: React.MouseEventHandler<HTMLInputElement | HTMLButtonElement>;
  debounceMs: number;
}
interface FilterInputFieldState {
  isChanged: boolean;
  value: string;
}
/**
 * An input field showing a input field and button.
 * Debounces changes.
 */
class FilterInputField extends PureComponent<
  FilterInputFieldProps,
  FilterInputFieldState
> {
  static defaultProps = {
    style: {},
    className: '',
    value: '',
    isAdvancedFilterSet: false,
    onAdvancedFiltersTriggered: (): void => undefined,
    onChange: (): void => undefined,
    onDone: (): void => undefined,
    onTab: (): void => undefined,
    onContextMenu: (): void => undefined,
    debounceMs: 150,
  };

  constructor(props: FilterInputFieldProps) {
    super(props);

    const { debounceMs } = props;

    this.debouncedSendUpdate = debounce(this.sendUpdate.bind(this), debounceMs);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    this.inputField = null;

    const { value } = props;
    this.initialValue = value;
    this.state = {
      isChanged: false,
      value,
    };
  }

  componentDidMount(): void {
    this.inputField?.focus();
  }

  componentDidUpdate(prevProps: FilterInputFieldProps): void {
    const { debounceMs } = this.props;
    if (prevProps.debounceMs !== debounceMs) {
      this.debouncedSendUpdate.flush();
      this.debouncedSendUpdate = debounce(
        this.sendUpdate.bind(this),
        debounceMs
      );
    }
  }

  componentWillUnmount(): void {
    this.debouncedSendUpdate.cancel();
  }

  inputField: HTMLInputElement | null;

  initialValue: string;

  debouncedSendUpdate: DebouncedFunc<(value: string) => void>;

  // clear filters needs to be able to reset the value externally
  // and due to the way this component handles its own debouncing
  // this was easier than moving state up.
  setValue(value: string): void {
    this.initialValue = value;
    this.setState({ value });
  }

  focus(): void {
    this.inputField?.focus();
  }

  handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { value } = event.target;
    this.setState({ value, isChanged: true });

    this.debouncedSendUpdate(value);
  }

  handleCancel(): void {
    this.debouncedSendUpdate.cancel();
    const { initialValue } = this;
    const { isChanged } = this.state;
    if (isChanged) {
      this.sendUpdate(initialValue);
    }

    const { onDone } = this.props;
    onDone();
  }

  handleCommit(setGridFocus = true, defocusInput = true): void {
    this.debouncedSendUpdate.flush();

    const { onDone } = this.props;
    onDone(setGridFocus, defocusInput);
  }

  handleFocus(): void {
    this.inputField?.select();
  }

  handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const { relatedTarget } = event;
    // handleCommit results in a call that steals focus
    if (
      relatedTarget != null &&
      relatedTarget.classList.contains('context-menu-container')
    ) {
      // input blurred by calling context-menu
      // don't set grid focus, but do null column focus
      this.handleCommit(false, true);
    } else if (
      relatedTarget != null &&
      relatedTarget.classList.contains('advanced-filter-button')
    ) {
      // blurred by clicking an advanced filter button
      // don't set grid focus, maintain focusedFilterBarColumn state
      this.handleCommit(false, false);
    } else {
      // clear both, blurred elsewhere
      this.handleCommit(true, true);
    }
  }

  handleTab(backward = false): void {
    this.debouncedSendUpdate.flush();

    const { onTab } = this.props;
    onTab(backward);
  }

  handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        event.preventDefault();
        this.handleCancel();
        break;
      case 'Enter':
        event.stopPropagation();
        event.preventDefault();
        this.handleCommit();
        break;
      case 'Tab':
        event.stopPropagation();
        event.preventDefault();
        this.handleTab(event.shiftKey);
        break;
      default:
        break;
    }
  }

  handleContextMenu(
    event: React.MouseEvent<HTMLInputElement | HTMLButtonElement>
  ): void {
    const { onContextMenu } = this.props;
    onContextMenu(event);
  }

  sendUpdate(value: string): void {
    const { onChange } = this.props;
    onChange(value);
  }

  render(): ReactElement {
    const {
      className,
      style,
      isAdvancedFilterSet,
      onAdvancedFiltersTriggered,
    } = this.props;
    const { value } = this.state;
    return (
      <div
        style={style}
        className="iris-grid-input-autosized-wrapper"
        data-value={value} // used by css based autosizer
      >
        <input
          ref={inputField => {
            this.inputField = inputField;
          }}
          className={classNames('iris-grid-input-field', className)}
          type="text"
          value={value}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onContextMenu={this.handleContextMenu}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div className="advanced-filter-button-container">
          <button
            type="button"
            className={classNames(
              'btn btn-link btn-link-icon advanced-filter-button',
              {
                'filter-set': isAdvancedFilterSet,
              }
            )}
            onClick={onAdvancedFiltersTriggered}
            onContextMenu={this.handleContextMenu}
          >
            <div className="fa-layers ">
              <FontAwesomeIcon icon={dhFilterFilled} className="filter-solid" />
              <FontAwesomeIcon icon={vsFilter} className="filter-light" />
            </div>
          </button>
        </div>
      </div>
    );
  }
}

export default FilterInputField;
