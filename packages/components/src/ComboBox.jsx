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
import SearchInput from './SearchInput';
import { Popper } from './popper';

import './ComboBox.scss';

class ComboBox extends Component {
  static MENU_NAVIGATION_DIRECTION = { UP: 'UP', DOWN: 'DOWN' };

  static DROP_DOWN_MENU_HEIGHT = 200;

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      filter: '',
      filteredOptions: [],
      keyboardOptionIndex: 0,
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

    this.popper = null;
    this.cbContainer = null;
    this.toggleButton = null;
    this.menuContainer = null;
    this.input = null;
    this.searchInput = null;
  }

  setInputWidth() {
    if (this.cbContainer) {
      this.setState({
        inputWidth: this.cbContainer.getBoundingClientRect().width,
      });
    }
  }

  getCachedFilteredOptions = memoize((options, input) =>
    options.filter(
      option =>
        option.title.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
        option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
    )
  );

  focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  resetValue() {
    this.setState({ value: '' });
  }

  updateInputValue(value) {
    const { onChange } = this.props;
    this.setState({ value });
    onChange(value);
  }

  handleResize() {
    this.setInputWidth();
  }

  handleMenuKeyDown(event) {
    const { filter, filteredOptions, keyboardOptionIndex } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;

    switch (event.key) {
      case 'Enter':
        this.updateInputValue(menuOptions[keyboardOptionIndex].value);
        this.closeMenu();
        this.input.focus();
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.handleMenuNavigation(ComboBox.MENU_NAVIGATION_DIRECTION.UP);
        event.stopPropagation();
        break;
      case 'ArrowDown':
        this.handleMenuNavigation(ComboBox.MENU_NAVIGATION_DIRECTION.DOWN);
        event.stopPropagation();
        break;
      case 'Escape':
        this.closeMenu();
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

  handleMenuNavigation(direction) {
    const { filter, filteredOptions, keyboardOptionIndex } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;
    const menuOptionsLength = menuOptions.length;
    let newKeyboardOptionIndex = keyboardOptionIndex;
    switch (direction) {
      case ComboBox.MENU_NAVIGATION_DIRECTION.UP:
        if (keyboardOptionIndex > 0) {
          newKeyboardOptionIndex =
            (newKeyboardOptionIndex - 1) % menuOptionsLength;
          this.setState({
            keyboardOptionIndex: newKeyboardOptionIndex,
          });
        }
        break;
      case ComboBox.MENU_NAVIGATION_DIRECTION.DOWN:
        if (keyboardOptionIndex < menuOptionsLength) {
          newKeyboardOptionIndex =
            (newKeyboardOptionIndex + 1) % menuOptionsLength;
          this.setState({
            keyboardOptionIndex: newKeyboardOptionIndex,
          });
        }
        break;
      default:
        break;
    }
  }

  handleInputKeyDown(event) {
    const { onEnter } = this.props;
    const { menuIsOpen } = this.state;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!menuIsOpen) {
        this.openMenu();
      }
    } else if (event.key === 'Escape') {
      this.closeMenu();
    } else if (event.key === 'Enter') {
      onEnter();
    }
  }

  handleInputChange(event) {
    this.updateInputValue(event.target.value);
  }

  handleOptionClick(event) {
    const optionIndex = Number(event.target.value);
    const { filter, filteredOptions } = this.state;
    const { options } = this.props;
    const menuOptions = filter ? filteredOptions : options;

    this.updateInputValue(menuOptions[optionIndex].value);
    this.closeMenu();
    this.input.focus();
  }

  handleOptionFocus(event) {
    this.setState({ keyboardOptionIndex: Number(event.target.value) });
  }

  handleFilterChange(event) {
    const { options } = this.props;
    const filter = event.target.value;
    const filteredOptions = this.getCachedFilteredOptions(options, filter);
    this.setState({ filter, filteredOptions, keyboardOptionIndex: 0 });
    this.popper.scheduleUpdate();
  }

  handleMenuBlur(event) {
    // close if menu blurs, unless its an internal option or the toggleButton which triggers close via click
    if (
      this.popper.element.contains(event.relatedTarget) ||
      event.relatedTarget === this.toggleButton
    ) {
      return;
    }
    this.closeMenu(false);
  }

  handleInputBlur(event) {
    // if blur event is caused by focusing on search input or open menu by keyboard, don't close the menu
    const { menuIsOpen } = this.state;
    if (menuIsOpen && this.popper.element.contains(event.relatedTarget)) {
      return;
    }
    this.closeMenu(false);
  }

  handleMenuOpened() {
    this.scrollOptionIntoView();
    this.searchInput.focus();
  }

  handleMenuExited() {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
      this.popper.hide();
    }
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

    window.requestAnimationFrame(() => {
      this.popper.show();
    });
  }

  closeMenu(focusInput = true) {
    this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
    if (focusInput) {
      this.input.focus();
    }
    this.popper.hide();
  }

  updateKeyboardIndex() {
    const { value } = this.state;
    const { options } = this.props;
    const valueIndex = options.indexOf(value);
    if (valueIndex > 0) {
      this.setState({ keyboardOptionIndex: valueIndex });
    }
  }

  scrollOptionIntoView() {
    const options = this.menuContainer.querySelector('.cb-options');
    const activeOption = this.menuContainer.querySelector(
      '.cb-option-btn.keyboard-active'
    );
    if (
      activeOption &&
      activeOption.offsetTop > ComboBox.DROP_DOWN_MENU_HEIGHT
    ) {
      options.scrollTop =
        activeOption.offsetTop - ComboBox.DROP_DOWN_MENU_HEIGHT;
    }
  }

  renderMenuElement() {
    const { searchPlaceholder } = this.props;
    const { filter, inputWidth } = this.state;
    return (
      <div
        className="cb-menu-container"
        ref={menuContainer => {
          this.menuContainer = menuContainer;
        }}
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
            ref={searchInput => {
              this.searchInput = searchInput;
            }}
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

  renderOptions() {
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

  render() {
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
      <div
        className="input-group cb-container"
        ref={cbContainer => {
          this.cbContainer = cbContainer;
        }}
      >
        <input
          value={value || defaultValue}
          className={classNames('form-control', className, 'cb-input')}
          ref={input => {
            this.input = input;
          }}
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
            ref={toggleButton => {
              this.toggleButton = toggleButton;
            }}
            onClick={this.toggleMenu}
            onKeyDown={this.handleInputKeyDown}
            disabled={disabled}
          >
            <FontAwesomeIcon icon={vsTriangleDown} />
            <Popper
              ref={popper => {
                this.popper = popper;
              }}
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

ComboBox.propTypes = {
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

ComboBox.defaultProps = {
  onChange: () => {},
  inputPlaceholder: '',
  searchPlaceholder: 'Search',
  disabled: false,
  className: '',
  defaultValue: '',
  popperOptions: null,
  spellCheck: true,
  onEnter: () => {},
};
export default ComboBox;
