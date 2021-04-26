import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsCheck, dhSort } from '@deephaven/icons';
import { TimeUtils } from '@deephaven/utils';
import classNames from 'classnames';
import TimeInput from './TimeInput';
import DropdownMenu from './menu-actions/DropdownMenu';
import './CustomTimeSelect.scss';
import './context-actions/ContextActions.scss';

const CUSTOM_OPTION = -1;

class CustomTimeSelect extends Component {
  static MENU_NAVIGATION_DIRECTION = { UP: 'UP', DOWN: 'DOWN' };

  static DROP_DOWN_MENU_HEIGHT = 125;

  constructor(props) {
    super(props);

    const { value, valueToTime } = props;

    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleMenuKeyDown = this.handleMenuKeyDown.bind(this);
    this.closeMenu = this.closeMenu.bind(this);

    this.handleOptionClick = this.handleOptionClick.bind(this);
    this.handleOptionFocus = this.handleOptionFocus.bind(this);

    this.handleMenuOpened = this.handleMenuOpened.bind(this);
    this.handleMenuExited = this.handleMenuExited.bind(this);
    this.handleCustomInput = this.handleCustomInput.bind(this);

    this.csContainer = React.createRef();
    this.menuContainer = React.createRef();
    this.button = React.createRef();
    this.input = React.createRef();

    this.state = {
      keyboardOptionIndex: 0,
      menuIsOpen: false,
      inputWidth: 100,
      customTime: valueToTime(value),
      inputFocused: false,
    };
  }

  getSelectedText() {
    const { options, value, placeholder } = this.props;
    const { customTime } = this.state;

    if (value === null) {
      return placeholder;
    }

    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      if (option.value === value) {
        return option.title;
      }
    }

    return TimeUtils.formatTime(customTime);
  }

  setInputWidth() {
    if (this.csContainer.current) {
      this.setState({
        inputWidth: this.csContainer.current.getBoundingClientRect().width,
      });
    }
  }

  focus() {
    if (this.button.current) {
      this.button.current.focus();
    }
  }

  updateInputValue(value) {
    const { onChange } = this.props;
    onChange(value);
  }

  handleResize() {
    this.setInputWidth();
  }

  handleMenuKeyDown(event) {
    const { keyboardOptionIndex, inputFocused } = this.state;
    const { options } = this.props;

    switch (event.key) {
      case 'Enter':
      case ' ': // Space Bar
        if (inputFocused) {
          this.updateFromCustom();
        } else {
          this.updateInputValue(options[keyboardOptionIndex].value);
        }
        this.closeMenu();
        this.button.current.focus();
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Tab':
        if (event.shiftKey) {
          this.handleMenuNavigation(
            CustomTimeSelect.MENU_NAVIGATION_DIRECTION.UP
          );
        } else {
          this.handleMenuNavigation(
            CustomTimeSelect.MENU_NAVIGATION_DIRECTION.DOWN
          );
        }
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.handleMenuNavigation(
          CustomTimeSelect.MENU_NAVIGATION_DIRECTION.UP
        );
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.handleMenuNavigation(
          CustomTimeSelect.MENU_NAVIGATION_DIRECTION.DOWN
        );
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.closeMenu();
        break;
      default:
        break;
    }
  }

  handleMenuNavigation(direction) {
    const { keyboardOptionIndex, inputFocused } = this.state;
    const { options } = this.props;
    const menuOptionsLength = options.length;
    let newKeyboardOptionIndex = keyboardOptionIndex;
    switch (direction) {
      case CustomTimeSelect.MENU_NAVIGATION_DIRECTION.UP:
        if (!inputFocused && keyboardOptionIndex === 0) {
          this.focusInput();
          break;
        } else if (inputFocused) {
          this.focusOption(keyboardOptionIndex);
        }

        if (keyboardOptionIndex > 0 && !inputFocused) {
          newKeyboardOptionIndex =
            (newKeyboardOptionIndex - 1) % menuOptionsLength;
          this.setState({
            keyboardOptionIndex: newKeyboardOptionIndex,
          });
        } else if (keyboardOptionIndex === 0) {
          newKeyboardOptionIndex = menuOptionsLength - 1;
          this.setState({
            keyboardOptionIndex: newKeyboardOptionIndex,
          });
        }
        this.scrollOptionIntoView(newKeyboardOptionIndex);
        break;
      case CustomTimeSelect.MENU_NAVIGATION_DIRECTION.DOWN:
        if (!inputFocused && keyboardOptionIndex === menuOptionsLength - 1) {
          this.focusInput();
          break;
        } else if (inputFocused) {
          this.focusOption(keyboardOptionIndex);
        }

        if (
          keyboardOptionIndex < menuOptionsLength &&
          !(inputFocused && keyboardOptionIndex === 0)
        ) {
          newKeyboardOptionIndex =
            (newKeyboardOptionIndex + 1) % menuOptionsLength;
          this.setState({
            keyboardOptionIndex: newKeyboardOptionIndex,
          });
        }
        this.scrollOptionIntoView(newKeyboardOptionIndex);
        break;
      default:
        break;
    }
  }

  handleOptionClick(event) {
    const optionIndex = Number(event.target.value);
    const { options, timeToValue } = this.props;
    const { customTime } = this.state;

    if (optionIndex === CUSTOM_OPTION) {
      const update = timeToValue(customTime);
      this.updateAndClose(update);
    } else {
      this.updateAndClose(options[optionIndex].value);
    }
  }

  updateAndClose(update) {
    this.updateInputValue(update);
    this.closeMenu();
    this.button.current.focus();
  }

  handleOptionFocus(event) {
    this.setState({ keyboardOptionIndex: Number(event.target.value) });
  }

  handleMenuOpened() {
    const { options, value } = this.props;
    const { keyboardOptionIndex } = this.state;
    this.scrollOptionIntoView(keyboardOptionIndex);
    const activeOption = this.menuContainer.current.querySelector(
      '.cs-option-btn.keyboard-active'
    );
    if (activeOption) {
      activeOption.focus();
    }
    const valueIndex = options.map(option => option.value).indexOf(value);
    if (valueIndex < 0 && value !== null) {
      // The custom option should be selected
      this.focusInput();
    }
  }

  focusInput() {
    if (this.input.current) {
      this.input.current.focus();
    }
  }

  focusOption(index) {
    const options = this.menuContainer.current.querySelector('.cs-options');
    if (options && options.children) {
      const option = options.children.item(index);
      if (option) {
        option.focus();
      }
    }
  }

  handleMenuExited() {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
    }
  }

  handleCustomInput(value) {
    const { timeToValue } = this.props;

    const update = timeToValue(value);
    this.updateInputValue(update);
    this.setState({
      customTime: value,
    });
  }

  updateFromCustom() {
    const { timeToValue } = this.props;
    const { customTime } = this.state;

    const update = timeToValue(customTime);
    this.updateInputValue(update);
  }

  toggleMenu(event) {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
    event.stopPropagation();
  }

  openMenu() {
    this.updateKeyboardIndex();
    this.setInputWidth();
    this.setState({ menuIsOpen: true });
  }

  closeMenu(focusButton = true) {
    this.setState({ menuIsOpen: false });
    if (focusButton) {
      this.button.current.focus();
    }
  }

  updateKeyboardIndex() {
    const { options, value } = this.props;
    const valueIndex = options.map(option => option.value).indexOf(value);
    if (valueIndex > 0) {
      this.setState({ keyboardOptionIndex: valueIndex });
    }
  }

  scrollOptionIntoView(index) {
    const options = this.menuContainer.current.querySelector('.cs-options');
    if (options && options.children) {
      const activeOption = options.children.item(index);
      if (
        activeOption &&
        activeOption.offsetTop > CustomTimeSelect.DROP_DOWN_MENU_HEIGHT
      ) {
        options.scrollTop =
          activeOption.offsetTop - CustomTimeSelect.DROP_DOWN_MENU_HEIGHT;
      } else if ((activeOption && activeOption.offsetTop < 0) || index === 0) {
        options.scrollTop = 0;
      }
    }
  }

  renderMenuElement() {
    const { inputWidth } = this.state;
    return (
      <div
        className="cs-menu-container"
        ref={this.menuContainer}
        role="presentation"
        onKeyDown={this.handleMenuKeyDown}
        onClick={event => {
          event.stopPropagation();
        }}
        style={{ width: inputWidth }}
      >
        <div className="cs-options-container">
          <div className="cs-options">{this.renderOptions()}</div>
        </div>
      </div>
    );
  }

  renderOptions() {
    const { options, value, icon, customText } = this.props;
    const { keyboardOptionIndex, customTime, inputFocused } = this.state;

    let matchFound = false;
    const optionArray = [];
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const key = `option-${index}-${option.value}`;
      matchFound = matchFound || option.value === value;
      optionArray.push(
        <button
          key={key}
          type="button"
          value={index}
          className={classNames('cs-option-btn', {
            'keyboard-active': keyboardOptionIndex === index && !inputFocused,
          })}
          onClick={this.handleOptionClick}
          onFocus={this.handleOptionFocus}
        >
          {option.value === value && (
            <FontAwesomeIcon icon={icon} className="mr-2" />
          )}
          {option.value !== value && <span className="mr-4" />}
          {option.title}
        </button>
      );
    }

    optionArray.push(<hr className="cs-divider" key="option-divider" />);

    optionArray.push(
      <button
        key="option-custom-label"
        type="button"
        value={CUSTOM_OPTION}
        className={classNames('cs-option-btn', {
          'keyboard-active': inputFocused,
        })}
        onClick={this.handleOptionClick}
        onFocus={this.handleOptionFocus}
      >
        {!matchFound && value !== null ? (
          <FontAwesomeIcon icon={icon} className="mr-2" />
        ) : (
          <span className="mr-4" />
        )}
        {customText}
      </button>
    );

    optionArray.push(
      <div key="cs-custom-container" className="cs-custom-container">
        <span className="mr-2" />
        <TimeInput
          key="option-input"
          ref={this.input}
          onChange={this.handleCustomInput}
          value={customTime}
          onFocus={() => this.setState({ inputFocused: true })}
          onBlur={() => this.setState({ inputFocused: false })}
        />
        <span className="ml-2" />
      </div>
    );

    optionArray.push(<hr key="option-end" className="mb-2" />);

    return optionArray;
  }

  render() {
    const { disabled, invalid, value } = this.props;
    const { menuIsOpen } = this.state;
    let { popperOptions } = this.props;
    popperOptions = {
      placement: 'bottom-end',
      modifiers: {
        preventOverflow: { enabled: false },
      },
      ...popperOptions,
    };

    return (
      <div
        className="input-group cs-container context-menu"
        ref={this.csContainer}
      >
        <div
          className={classNames('input-group-append cs-dropdown', {
            'cs-dropdown-invalid': invalid,
          })}
        >
          <button
            type="button"
            className={classNames('btn cs-btn form-control', {
              'cs-btn-invalid': invalid,
            })}
            ref={this.button}
            onClick={this.toggleMenu}
            disabled={disabled}
          >
            <span
              className={classNames({
                'text-muted': value === null,
              })}
            >
              {this.getSelectedText()}
            </span>
            <span>
              <FontAwesomeIcon icon={dhSort} className="cs-caret" />
            </span>
            <DropdownMenu
              isShown={menuIsOpen}
              actions={{ menuElement: this.renderMenuElement() }}
              popperOptions={popperOptions}
              popperClassName="CustomTimeSelect"
              onMenuOpened={this.handleMenuOpened}
              onMenuClosed={this.handleMenuExited}
              menuStyle={{ maxWidth: '100rem' }}
            />
          </button>
        </div>
      </div>
    );
  }
}

CustomTimeSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    })
  ).isRequired,
  popperOptions: PropTypes.shape({
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }),
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  icon: PropTypes.shape({}),
  placeholder: PropTypes.string,
  customText: PropTypes.string,
  valueToTime: PropTypes.func,
  timeToValue: PropTypes.func,
  invalid: PropTypes.bool,
};

CustomTimeSelect.defaultProps = {
  onChange: () => {},
  value: null,
  disabled: false,
  popperOptions: null,
  icon: vsCheck,
  customText: 'Custom',
  placeholder: 'Select a time',
  valueToTime: value => value,
  timeToValue: time => time,
  invalid: false,
};
export default CustomTimeSelect;
