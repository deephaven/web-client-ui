import React, { Component } from 'react';
import { PopperOptions } from 'popper.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsCheck, dhSort, IconDefinition } from '@deephaven/icons';
import { TimeUtils } from '@deephaven/utils';
import classNames from 'classnames';
import TimeInput, { TimeInputElement } from './TimeInput';
import DropdownMenu from './menu-actions/DropdownMenu';
import './CustomTimeSelect.scss';

const CUSTOM_OPTION = -1;

enum MENU_NAVIGATION_DIRECTION {
  UP = 'UP',
  DOWN = 'DOWN',
}

type CustomTimeSelectProps = {
  options: { title: string; value: number }[];
  popperOptions: PopperOptions;
  value: number | null;
  onChange(value: number): void;
  disabled: boolean;
  icon: IconDefinition;
  placeholder: string;
  customText: string;
  // Defaults to converting the value in milliseconds to time in seconds
  valueToTime(val: number | null): number;
  // Defaults to converting the time in seconds to value in milliseconds
  timeToValue(time: number): number;
  invalid: boolean;
  'data-testid'?: string;
};

type TimeInSeconds = number;

type CustomTimeSelectState = {
  keyboardOptionIndex: number;
  menuIsOpen: boolean;
  inputWidth: number;
  customTime: TimeInSeconds;
  inputFocused: boolean;
};

class CustomTimeSelect extends Component<
  CustomTimeSelectProps,
  CustomTimeSelectState
> {
  static MENU_NAVIGATION_DIRECTION = MENU_NAVIGATION_DIRECTION;

  static DROP_DOWN_MENU_HEIGHT = 125;

  static defaultProps: Partial<CustomTimeSelectProps> = {
    onChange(): void {
      // no-op
    },
    value: null,
    disabled: false,
    popperOptions: {},
    icon: vsCheck,
    customText: 'Custom',
    placeholder: 'Select a time',
    valueToTime: value => (value === null ? 0 : Math.round(value / 1000)),
    timeToValue: time => time * 1000,
    invalid: false,
    'data-testid': undefined,
  };

  constructor(props: CustomTimeSelectProps) {
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

  csContainer: React.RefObject<HTMLDivElement>;

  menuContainer: React.RefObject<HTMLDivElement>;

  button: React.RefObject<HTMLButtonElement>;

  input: React.RefObject<TimeInputElement>;

  getSelectedText(): string {
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

  setInputWidth(): void {
    if (this.csContainer.current) {
      this.setState({
        inputWidth: this.csContainer.current.getBoundingClientRect().width,
      });
    }
  }

  focus(): void {
    this.button.current?.focus();
  }

  updateInputValue(value: number): void {
    const { onChange } = this.props;
    onChange(value);
  }

  handleResize(): void {
    this.setInputWidth();
  }

  handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
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
        this.button.current?.focus();
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

  handleMenuNavigation(direction: MENU_NAVIGATION_DIRECTION): void {
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

  handleOptionClick(event: React.MouseEvent<HTMLButtonElement>): void {
    const optionIndex = Number(event.currentTarget.value);
    const { options, timeToValue } = this.props;
    const { customTime } = this.state;

    if (optionIndex === CUSTOM_OPTION) {
      const update = timeToValue(customTime);
      this.updateAndClose(update);
    } else {
      this.updateAndClose(options[optionIndex].value);
    }
  }

  updateAndClose(update: number): void {
    this.updateInputValue(update);
    this.closeMenu();
    this.button.current?.focus();
  }

  handleOptionFocus(event: React.FocusEvent<HTMLButtonElement>): void {
    this.setState({ keyboardOptionIndex: Number(event.target.value) });
  }

  handleMenuOpened(): void {
    const { options, value } = this.props;
    const { keyboardOptionIndex } = this.state;
    this.scrollOptionIntoView(keyboardOptionIndex);
    const activeOption = this.menuContainer.current?.querySelector(
      '.cs-option-btn.keyboard-active'
    );
    if (activeOption instanceof HTMLElement) {
      activeOption.focus();
    }

    if (value === null) {
      return;
    }
    const valueIndex = options.map(option => option.value).indexOf(value);
    if (valueIndex < 0) {
      // The custom option should be selected
      this.focusInput();
    }
  }

  focusInput(): void {
    this.input.current?.focus();
  }

  focusOption(index: number): void {
    const options = this.menuContainer.current?.querySelector('.cs-options');
    if (options && options.children) {
      const option = options.children.item(index);
      if (option instanceof HTMLElement) {
        option.focus();
      }
    }
  }

  handleMenuExited(): void {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
    }
  }

  handleCustomInput(value: number): void {
    const { timeToValue } = this.props;

    const update = timeToValue(value);
    this.updateInputValue(update);
    this.setState({
      customTime: value,
    });
  }

  updateFromCustom(): void {
    const { timeToValue } = this.props;
    const { customTime } = this.state;

    const update = timeToValue(customTime);
    this.updateInputValue(update);
  }

  toggleMenu(event: React.MouseEvent<HTMLButtonElement>): void {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
    event.stopPropagation();
  }

  openMenu(): void {
    this.updateKeyboardIndex();
    this.setInputWidth();
    this.setState({ menuIsOpen: true });
  }

  closeMenu(focusButton = true): void {
    this.setState({ menuIsOpen: false });
    if (focusButton) {
      this.button.current?.focus();
    }
  }

  updateKeyboardIndex(): void {
    const { options, value } = this.props;
    if (value === null) {
      return;
    }
    const valueIndex = options.map(option => option.value).indexOf(value);
    if (valueIndex > 0) {
      this.setState({ keyboardOptionIndex: valueIndex });
    }
  }

  scrollOptionIntoView(index: number): void {
    const options = this.menuContainer.current?.querySelector('.cs-options');
    if (options && options.children) {
      const activeOption = options.children.item(index);
      if (
        activeOption instanceof HTMLElement &&
        activeOption.offsetTop > CustomTimeSelect.DROP_DOWN_MENU_HEIGHT
      ) {
        options.scrollTop =
          activeOption.offsetTop - CustomTimeSelect.DROP_DOWN_MENU_HEIGHT;
      } else if (
        (activeOption instanceof HTMLElement && activeOption.offsetTop < 0) ||
        index === 0
      ) {
        options.scrollTop = 0;
      }
    }
  }

  renderMenuElement(): JSX.Element {
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

  renderOptions(): React.ReactNode {
    const { options, value, icon, customText } = this.props;
    const { keyboardOptionIndex, customTime, inputFocused } = this.state;

    let matchFound = false;
    const optionArray: JSX.Element[] = [];
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

  render(): JSX.Element {
    const { disabled, invalid, value, 'data-testid': dataTestId } = this.props;
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
        data-testid={dataTestId}
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

export default CustomTimeSelect;
