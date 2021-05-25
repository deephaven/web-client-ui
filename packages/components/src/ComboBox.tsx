/**
 * Combobox that combines a input box with a searchable dropdown menu
 *
 * props:
 * @param {array} options :[{
 *    title: 'option title for display',
 *    value: 'option value' //option value
 * }]
 * @param {string} inputPlaceholder place holder for the input box
 * @param {string} searchPlaceholder place holder for the search box in drop down search box
 * @param {boolean} disabled disable both input & drop down
 *
 *
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsTriangleDown } from '@deephaven/icons';
import memoize from 'memoizee';
import classNames from 'classnames';
import { PopperOptions } from 'popper.js';
import SearchInput from './SearchInput';
import { Popper } from './popper';

import './ComboBox.scss';

interface ComboBoxOption {
  title: string;
  value: string;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  popperOptions: PopperOptions;
  onChange(value: string): void;
  inputPlaceholder: string;
  searchPlaceholder: string;
  disabled: boolean;
  className: string;
  defaultValue: string;
  spellCheck: boolean;
  onEnter(): void;
}

interface ComboBoxState {
  value: string;
  filter: string;
  filteredOptions: ComboBoxOption[];
  keyboardOptionIndex: number;
  menuIsOpen: boolean;
  inputWidth: number;
}

enum MENU_NAVIGATION_DIRECTION {
  UP = 'UP',
  DOWN = 'DOWN',
}

class ComboBox extends Component<ComboBoxProps, ComboBoxState> {
  static MENU_NAVIGATION_DIRECTION = MENU_NAVIGATION_DIRECTION;

  static DROP_DOWN_MENU_HEIGHT = 200;

  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ).isRequired,
    popperOptions: PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
    onChange: PropTypes.func,
    inputPlaceholder: PropTypes.string,
    searchPlaceholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    defaultValue: PropTypes.string,
    spellCheck: PropTypes.bool,
    onEnter: PropTypes.func,
  };

  static defaultProps = {
    onChange(): void {
      // no-op
    },
    inputPlaceholder: '',
    searchPlaceholder: 'Search',
    disabled: false,
    className: '',
    defaultValue: '',
    popperOptions: null,
    spellCheck: true,
    onEnter(): void {
      // no-op
    },
  };

  constructor(props: ComboBoxProps) {
    super(props);
    this.state = {
      value: '',
      filter: '',
      filteredOptions: props.options,
      keyboardOptionIndex: -1,
      menuIsOpen: false,
      inputWidth: 100,
    };

    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleMenuKeyDown = this.handleMenuKeyDown.bind(this);
    this.handleMenuBlur = this.handleMenuBlur.bind(this);
    this.closeMenu = this.closeMenu.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);

    this.handleOptionClick = this.handleOptionClick.bind(this);
    this.handleOptionFocus = this.handleOptionFocus.bind(this);

    this.handleMenuOpened = this.handleMenuOpened.bind(this);
    this.handleMenuExited = this.handleMenuExited.bind(this);

    this.popper = React.createRef();
    this.cbContainer = React.createRef();
    this.toggleButton = React.createRef();
    this.menuContainer = React.createRef();
    this.input = React.createRef();
    this.searchInput = React.createRef();
  }

  componentDidUpdate(): void {
    const { menuIsOpen, keyboardOptionIndex } = this.state;
    if (menuIsOpen && keyboardOptionIndex >= 0) {
      this.scrollOptionIntoView();
    }
  }

  popper: React.RefObject<Popper>;

  cbContainer: React.RefObject<HTMLDivElement>;

  toggleButton: React.RefObject<HTMLButtonElement>;

  menuContainer: React.RefObject<HTMLDivElement>;

  input: React.RefObject<HTMLInputElement>;

  searchInput: React.RefObject<SearchInput>;

  setInputWidth(): void {
    if (this.cbContainer.current) {
      this.setState({
        inputWidth: this.cbContainer.current.getBoundingClientRect().width,
      });
    }
  }

  getCachedFilteredOptions = memoize(
    (options: ComboBoxOption[], input: string) =>
      options.filter(
        option =>
          option.title.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
          option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
  );

  focus(): void {
    this.input.current?.focus();
  }

  resetValue(): void {
    this.setState({ value: '' });
  }

  updateInputValue(value: string): void {
    const { onChange } = this.props;
    this.setState({ value });
    onChange(value);
  }

  handleResize(): void {
    this.setInputWidth();
  }

  handleMenuKeyDown(event: React.KeyboardEvent): void {
    const { filter, filteredOptions, keyboardOptionIndex } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;

    switch (event.key) {
      case 'Enter':
        if (menuOptions[keyboardOptionIndex]?.value) {
          this.updateInputValue(menuOptions[keyboardOptionIndex].value);
        }
        this.closeMenu();
        this.input.current?.focus();
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.handleMenuNavigation(ComboBox.MENU_NAVIGATION_DIRECTION.UP);
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.handleMenuNavigation(ComboBox.MENU_NAVIGATION_DIRECTION.DOWN);
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        if (filter !== '') {
          this.setState({ filter: '' });
          event.stopPropagation(); // Don't trigger blur on input element
        } else {
          this.closeMenu();
        }
        break;
      case 'Tab':
        if (!event.shiftKey && keyboardOptionIndex === menuOptions.length - 1) {
          this.closeMenu();
        }
        break;
      default:
        break;
    }
  }

  handleMenuNavigation(direction: MENU_NAVIGATION_DIRECTION): void {
    const { filter, filteredOptions, keyboardOptionIndex } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;
    const menuOptionsLength = menuOptions.length;
    let newKeyboardOptionIndex = keyboardOptionIndex;
    switch (direction) {
      case ComboBox.MENU_NAVIGATION_DIRECTION.UP:
        if (keyboardOptionIndex > 0) {
          this.setState({
            keyboardOptionIndex: keyboardOptionIndex - 1,
          });
        } else {
          this.setState({ keyboardOptionIndex: menuOptionsLength - 1 });
        }
        break;
      case ComboBox.MENU_NAVIGATION_DIRECTION.DOWN:
        newKeyboardOptionIndex =
          (newKeyboardOptionIndex + 1) % menuOptionsLength;
        this.setState({
          keyboardOptionIndex: newKeyboardOptionIndex,
        });
        break;
      default:
        break;
    }
  }

  handleInputKeyDown(event: React.KeyboardEvent): void {
    const { onEnter } = this.props;
    const { menuIsOpen } = this.state;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!menuIsOpen) {
        this.openMenu();
      }
    } else if (event.key === 'Enter') {
      onEnter();
    }
  }

  handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.updateInputValue(event.target.value);
  }

  handleOptionClick(event: React.MouseEvent<HTMLButtonElement>): void {
    const optionIndex = Number(event.currentTarget.value);
    const { filter, filteredOptions } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;

    this.updateInputValue(menuOptions[optionIndex].value);
    this.closeMenu();
    this.input.current?.focus();
  }

  handleOptionFocus(event: React.FocusEvent<HTMLButtonElement>): void {
    this.setState({ keyboardOptionIndex: Number(event.target.value) });
  }

  handleFilterChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const { options } = this.props;
    const { keyboardOptionIndex, filteredOptions: oldOptions } = this.state;
    const filter = event.target.value;
    const filteredOptions = this.getCachedFilteredOptions(options, filter);

    // Make the active element match the previously highlighted value
    const matchValue = oldOptions[keyboardOptionIndex]?.value;
    const activeIndex = filteredOptions.findIndex(
      option => option.value === matchValue
    );

    this.setState({
      filter,
      filteredOptions,
      keyboardOptionIndex: activeIndex,
    });
    this.popper.current?.scheduleUpdate();
  }

  handleMenuBlur(event: React.FocusEvent): void {
    // close if menu blurs, unless its an internal option or the toggleButton which triggers close via click
    if (
      (event.relatedTarget instanceof Element &&
        this.popper.current?.element.contains(event.relatedTarget)) ||
      event.relatedTarget === this.toggleButton.current
    ) {
      return;
    }
    this.closeMenu(false);
  }

  handleInputBlur(event: React.FocusEvent<HTMLInputElement>): void {
    // if blur event is caused by focusing on search input or open menu by keyboard, don't close the menu
    const { menuIsOpen } = this.state;
    if (
      menuIsOpen &&
      event.relatedTarget instanceof Element &&
      this.popper.current?.element.contains(event.relatedTarget)
    ) {
      return;
    }
    this.closeMenu(false);
  }

  handleMenuOpened(): void {
    this.scrollOptionIntoView();
    this.searchInput.current?.focus();
  }

  handleMenuExited(): void {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.setState({ menuIsOpen: false });
      this.popper.current?.hide();
    }
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

    window.requestAnimationFrame(() => {
      this.popper.current?.show();
    });
  }

  closeMenu(focusInput = true): void {
    this.setState({ menuIsOpen: false });
    if (focusInput) {
      this.input.current?.focus();
    }
    this.popper.current?.hide();
  }

  updateKeyboardIndex(): void {
    const { value, filter, filteredOptions } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;
    const valueIndex = menuOptions.findIndex(option => option.value === value);
    this.setState({ keyboardOptionIndex: valueIndex });
  }

  scrollOptionIntoView(): void {
    const activeOption = this.menuContainer.current?.querySelector(
      '.cb-option-btn.keyboard-active'
    );
    if (activeOption instanceof HTMLElement) {
      activeOption.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  renderMenuElement(): JSX.Element {
    const { searchPlaceholder } = this.props;
    const { filter, inputWidth } = this.state;
    return (
      <div
        className="cb-menu-container"
        ref={this.menuContainer}
        role="presentation"
        onKeyDown={this.handleMenuKeyDown}
        onClick={event => {
          event.stopPropagation();
        }}
        style={{ width: inputWidth }}
        onBlur={this.handleMenuBlur}
      >
        <div className="cb-search-input-container">
          <SearchInput
            value={filter}
            ref={this.searchInput}
            onChange={this.handleFilterChange}
            className="cb-search-input"
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="cb-options-container">
          <div className="cb-options">{this.renderOptions()}</div>
        </div>
      </div>
    );
  }

  renderOptions(): React.ReactNode {
    const { options } = this.props;
    const { keyboardOptionIndex, filter, filteredOptions } = this.state;
    const menuOptions = filter ? filteredOptions : options;

    return menuOptions.map((option, index) => {
      const key = `option-${index}-${option.value}`;
      return (
        <button
          key={key}
          type="button"
          value={index}
          className={classNames('cb-option-btn', {
            'keyboard-active': keyboardOptionIndex === index,
          })}
          onClick={this.handleOptionClick}
          onFocus={this.handleOptionFocus}
        >
          {option.title}
        </button>
      );
    });
  }

  render(): JSX.Element {
    const {
      options,
      inputPlaceholder,
      disabled,
      className,
      defaultValue,
      spellCheck,
    } = this.props;
    const { value } = this.state;
    let { popperOptions } = this.props;
    popperOptions = {
      placement: 'bottom-end',
      modifiers: {
        preventOverflow: { enabled: false },
      },
      ...popperOptions,
    };

    return (
      <div className="input-group cb-container" ref={this.cbContainer}>
        <input
          value={value || defaultValue}
          className={classNames('form-control', className, 'cb-input')}
          ref={this.input}
          onChange={this.handleInputChange}
          placeholder={inputPlaceholder || (options[0] && options[0].title)}
          disabled={disabled}
          onBlur={this.handleInputBlur}
          onKeyDown={this.handleInputKeyDown}
          spellCheck={spellCheck}
        />
        <div className="input-group-append cb-dropdown">
          <button
            type="button"
            className="btn cb-btn form-control"
            ref={this.toggleButton}
            onClick={this.toggleMenu}
            onKeyDown={this.handleInputKeyDown}
            disabled={disabled}
          >
            <FontAwesomeIcon icon={vsTriangleDown} />
            <Popper
              ref={this.popper}
              options={popperOptions}
              className={classNames('combobox interactive')}
              onEntered={this.handleMenuOpened}
              onExited={this.handleMenuExited}
            >
              {this.renderMenuElement()}
            </Popper>
          </button>
        </div>
      </div>
    );
  }
}

export default ComboBox;
