import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { vsFilter, dhFilterFilled } from '@deephaven/icons';
import './FilterInputField.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * An input field showing a input field and button.
 * Debounces changes.
 */
class FilterInputField extends PureComponent {
  constructor(props) {
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

  componentDidMount() {
    this.inputField.focus();
  }

  componentDidUpdate(prevProps) {
    const { debounceMs } = this.props;
    if (prevProps.debounceMs !== debounceMs) {
      this.debouncedSendUpdate.flush();
      this.debouncedSendUpdate = debounce(
        this.sendUpdate.bind(this),
        debounceMs
      );
    }
  }

  componentWillUnmount() {
    this.debouncedSendUpdate.cancel();
  }

  // clear filters needs to be able to reset the value externally
  // and due to the way this component handles its own debouncing
  // this was easier than moving state up.
  setValue(value) {
    this.initialValue = value;
    this.setState({ value });
  }

  focus() {
    this.inputField.focus();
  }

  handleChange(event) {
    const { value } = event.target;
    this.setState({ value, isChanged: true });

    this.debouncedSendUpdate(value);
  }

  handleCancel() {
    this.debouncedSendUpdate.cancel();
    const { initialValue } = this;
    const { isChanged } = this.state;
    if (isChanged) {
      this.sendUpdate(initialValue);
    }

    const { onDone } = this.props;
    onDone();
  }

  handleCommit(setGridFocus = true, defocusInput = true) {
    this.debouncedSendUpdate.flush();

    const { onDone } = this.props;
    onDone(setGridFocus, defocusInput);
  }

  handleFocus() {
    this.inputField.select();
  }

  handleBlur(event) {
    const { relatedTarget } = event;
    // handleCommit results in a call that steals focus
    if (relatedTarget?.classList.contains('context-menu-container')) {
      // input blurred by calling context-menu
      // don't set grid focus, but do null column focus
      this.handleCommit(false, true);
    } else if (relatedTarget?.classList.contains('advanced-filter-button')) {
      // blurred by clicking an advanced filter button
      // don't set grid focus, maintain focusedFilterBarColumn state
      this.handleCommit(false, false);
    } else {
      // clear both, blurred elsewhere
      this.handleCommit(true, true);
    }
  }

  handleTab(backward = false) {
    this.debouncedSendUpdate.flush();

    const { onTab } = this.props;
    onTab(backward);
  }

  handleKeyDown(event) {
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

  handleContextMenu(event) {
    const { onContextMenu } = this.props;
    onContextMenu(event);
  }

  sendUpdate(value) {
    const { onChange } = this.props;
    onChange(value);
  }

  render() {
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

FilterInputField.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  value: PropTypes.string,
  isAdvancedFilterSet: PropTypes.bool,
  onAdvancedFiltersTriggered: PropTypes.func,
  onChange: PropTypes.func,
  onDone: PropTypes.func,
  onTab: PropTypes.func,
  onContextMenu: PropTypes.func,
  debounceMs: PropTypes.number,
};

FilterInputField.defaultProps = {
  style: {},
  className: '',
  value: '',
  isAdvancedFilterSet: false,
  onAdvancedFiltersTriggered: () => {},
  onChange: () => {},
  onDone: () => {},
  onTab: () => {},
  onContextMenu: () => {},
  debounceMs: 150,
};

export default FilterInputField;
