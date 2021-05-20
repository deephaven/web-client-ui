/**
 * An Input component that pops and filters auto complete options as you type.
 *
 * props:
 * @param options :[{
 *    title: 'option title for display',
 *    value: 'option value' //option value
 * }]
 * @param popperOptions options for the Popper
 * @param onChange called when the value is changed from the pulldown
 * @param inputPlaceholder place holder for the input box
 * @param disabled disable both input & drop down
 * @param className an optional class name applied to the input element
 * @param defaultTitle the default title to display
 * @param spellCheck flag to disable spell checking, defaults to true
 * @param onEnter called when the Enter key is typed in the input element
 *
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoizee';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { PopperOptions } from 'popper.js';
import { Popper } from './popper';

import './AutoCompleteInput.scss';

const DEBOUNCE_DELAY = 100;

enum MENU_NAVIGATION_DIRECTION {
  UP = 'UP',
  DOWN = 'DOWN',
}

interface AutoCompleteOption {
  title: string;
  value: string;
}

interface AutoCompleteInputProps {
  options: AutoCompleteOption[];
  popperOptions: PopperOptions;
  onChange(value: string, isValid: boolean): void;
  inputPlaceholder: string;
  disabled: boolean;
  className: string;
  defaultTitle: string;
  spellCheck: boolean;
  onEnter(): void;
  noMatchText: string;
}

interface AutoCompleteInputState {
  title: string;
  filteredOptions: AutoCompleteOption[];
  keyboardOptionIndex: number;
  menuIsOpen: boolean;
  inputWidth: number;
  invalid: boolean;
  popperOptions: PopperOptions;
}

class AutoCompleteInput extends Component<
  AutoCompleteInputProps,
  AutoCompleteInputState
> {
  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ).isRequired,
    popperOptions: PropTypes.shape({}),
    onChange: PropTypes.func,
    inputPlaceholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    defaultTitle: PropTypes.string,
    spellCheck: PropTypes.bool,
    onEnter: PropTypes.func,
    noMatchText: PropTypes.string,
  };

  static defaultProps = {
    onChange(): void {
      // no-op
    },
    inputPlaceholder: '',
    disabled: false,
    className: '',
    defaultTitle: '',
    popperOptions: null,
    spellCheck: true,
    onEnter(): void {
      // no-op
    },
    noMatchText: 'No matching items found',
  };

  static MENU_NAVIGATION_DIRECTION = MENU_NAVIGATION_DIRECTION;

  constructor(props: AutoCompleteInputProps) {
    super(props);

    let { popperOptions } = this.props;
    popperOptions = {
      placement: 'bottom-end',
      modifiers: {
        preventOverflow: { enabled: false },
      },
      ...popperOptions,
    };

    this.state = {
      title: '',
      filteredOptions: [],
      keyboardOptionIndex: 0,
      menuIsOpen: false,
      inputWidth: 100,
      invalid: false,
      popperOptions,
    };

    this.handleMenuKeyDown = this.handleMenuKeyDown.bind(this);
    this.handleMenuBlur = this.handleMenuBlur.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handelInputFocus = this.handelInputFocus.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);

    this.updateInputValue = debounce(this.updateInputValue, DEBOUNCE_DELAY);

    this.handleOptionClick = this.handleOptionClick.bind(this);

    this.handleMenuOpened = this.handleMenuOpened.bind(this);
    this.handleMenuExited = this.handleMenuExited.bind(this);

    this.popper = React.createRef();
    this.cbContainer = React.createRef();
    this.menuContainer = React.createRef();
    this.input = React.createRef();
  }

  popper: React.RefObject<Popper>;

  cbContainer: React.RefObject<HTMLDivElement>;

  menuContainer: React.RefObject<HTMLDivElement>;

  input: React.RefObject<HTMLInputElement>;

  setInputWidth(): void {
    if (this.cbContainer.current) {
      this.setState({
        inputWidth: this.cbContainer.current.getBoundingClientRect().width,
      });
    }
  }

  getCachedFilteredOptions = memoize(
    (options: AutoCompleteOption[], input: string) =>
      options.filter(
        // supports partial match
        option => option.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
  );

  // validation needs to be an exact case-sensitve match on value
  getValueAndValidate(title: string): { value: string; isValid: boolean } {
    if (!title) {
      this.setState({ invalid: false });
      return { value: title, isValid: false };
    }

    // validate
    const { options } = this.props;
    const result = options.filter(
      option => option.title.toLowerCase() === title.toLowerCase()
    );
    if (result.length < 1) {
      this.setState({ invalid: true });
      return { value: title, isValid: false };
    }

    this.setState({ invalid: false });
    return { value: result[0].value, isValid: true };
  }

  // validate typed entries emit change event using value
  updateInputValue(title: string): void {
    const { menuIsOpen } = this.state;
    const { value, isValid } = this.getValueAndValidate(title);
    if (menuIsOpen) this.processFilterChange(title);
    this.fireOnChange(value, isValid);
  }

  fireOnChange(value: string, isValid = true): void {
    const { onChange } = this.props;
    onChange(value, isValid);
  }

  processFilterChange(filter: string): void {
    const { options } = this.props;
    const { menuIsOpen } = this.state;
    const filteredOptions = filter
      ? this.getCachedFilteredOptions(options, filter)
      : options;
    const perfectMatch =
      filteredOptions.length === 1 && filteredOptions[0].title === filter;
    this.setState({
      filteredOptions,
      keyboardOptionIndex: 0,
    });
    if (perfectMatch && menuIsOpen) {
      this.closeMenu();
      return;
    }
    this.popper.current?.scheduleUpdate(); // filtered options list can change size, may need to be repositioned
  }

  resetValue(): void {
    this.setState({ title: '' });
    this.fireOnChange('');
  }

  handleResize(): void {
    this.setInputWidth();
  }

  handleMenuKeyDown(event: React.KeyboardEvent): void {
    const { filteredOptions, keyboardOptionIndex } = this.state;
    const option = filteredOptions[keyboardOptionIndex];

    switch (event.key) {
      case 'Enter':
      case 'ArrowRight':
        event.stopPropagation();
        event.preventDefault();
        if (option) {
          this.setState({ title: option.title, invalid: false });
          this.fireOnChange(option.value);
        }
        this.closeMenu();
        this.input.current?.focus();
        break;
      case 'ArrowUp':
        event.stopPropagation();
        event.preventDefault();
        this.navigateMenu(AutoCompleteInput.MENU_NAVIGATION_DIRECTION.UP);
        break;
      case 'ArrowDown':
        event.stopPropagation();
        event.preventDefault();
        this.navigateMenu(AutoCompleteInput.MENU_NAVIGATION_DIRECTION.DOWN);
        break;
      case 'Tab':
        event.stopPropagation();
        event.preventDefault();
        if (event.shiftKey) {
          this.navigateMenu(AutoCompleteInput.MENU_NAVIGATION_DIRECTION.UP);
          break;
        }
        this.navigateMenu(AutoCompleteInput.MENU_NAVIGATION_DIRECTION.DOWN);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.closeMenu();
        break;
      default:
        break;
    }
  }

  navigateMenu(direction: MENU_NAVIGATION_DIRECTION): void {
    const { filteredOptions, keyboardOptionIndex } = this.state;
    let newKeyboardOptionIndex = keyboardOptionIndex;
    if (direction === AutoCompleteInput.MENU_NAVIGATION_DIRECTION.UP) {
      if (keyboardOptionIndex > 0) {
        newKeyboardOptionIndex =
          (newKeyboardOptionIndex - 1) % filteredOptions.length;
        this.setState({
          keyboardOptionIndex: newKeyboardOptionIndex,
        });
      } else if (keyboardOptionIndex === 0) {
        newKeyboardOptionIndex = filteredOptions.length - 1;
        this.setState({
          keyboardOptionIndex: newKeyboardOptionIndex,
        });
      }
    } else if (direction === AutoCompleteInput.MENU_NAVIGATION_DIRECTION.DOWN) {
      if (keyboardOptionIndex < filteredOptions.length) {
        newKeyboardOptionIndex =
          (newKeyboardOptionIndex + 1) % filteredOptions.length;
        this.setState({
          keyboardOptionIndex: newKeyboardOptionIndex,
        });
      }
    }
    this.scrollOptionIntoView(newKeyboardOptionIndex);
  }

  handleInputKeyDown(event: React.KeyboardEvent): void {
    const { onEnter } = this.props;
    const { menuIsOpen } = this.state;

    if (menuIsOpen) {
      this.handleMenuKeyDown(event);
    } else if (event.key === 'Enter') {
      onEnter();
    } else if (event.key === 'Escape') {
      this.resetValue();
      event.preventDefault();
      event.stopPropagation();
    } else if (
      !(
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft' ||
        event.key === 'Tab' ||
        event.key === 'Shift'
      )
    ) {
      this.openMenu();
    }
  }

  handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ title: event.target.value });
    this.updateInputValue(event.target.value);
  }

  handleOptionClick(option: AutoCompleteOption): void {
    this.setState({ title: option.title, invalid: false });
    this.fireOnChange(option.value);
    this.closeMenu();
    this.input.current?.focus();
  }

  handelInputFocus(): void {
    const { menuIsOpen } = this.state;
    if (!menuIsOpen) {
      this.openMenu();
    }
  }

  handleInputClick(): void {
    const { menuIsOpen } = this.state;
    if (!menuIsOpen) {
      this.openMenu();
    }
  }

  handleInputBlur(event: React.FocusEvent<HTMLInputElement>): void {
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

  handleMenuBlur(event: React.FocusEvent<HTMLDivElement>): void {
    // if blur event is caused by focusing on the input or focus on options don't close menu
    if (
      event.relatedTarget === this.input.current ||
      (event.relatedTarget instanceof Element &&
        this.popper.current?.element.contains(event.relatedTarget))
    ) {
      return;
    }
    this.closeMenu(false);
  }

  handleMenuOpened(): void {
    this.input.current?.focus();
  }

  handleMenuExited(): void {
    const { menuIsOpen } = this.state;
    if (menuIsOpen) {
      this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
    }
  }

  openMenu(): void {
    const { title } = this.state;
    this.processFilterChange(title);
    this.setInputWidth();
    this.setState({ menuIsOpen: true });

    // https://github.com/reactjs/react-transition-group/issues/382
    window.requestAnimationFrame(() => {
      this.popper.current?.show();
    });
  }

  closeMenu(focusInput = true): void {
    this.setState({ menuIsOpen: false, keyboardOptionIndex: 0 });
    if (focusInput) {
      this.input.current?.focus();
    }
    this.popper.current?.hide();
  }

  scrollOptionIntoView(index: number): void {
    if (this.menuContainer.current) {
      this.menuContainer.current.children.item(index)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  renderMenuElement(): JSX.Element {
    const { inputWidth } = this.state;
    return (
      <div
        className={classNames('aci-options')}
        ref={this.menuContainer}
        role="presentation"
        onKeyDown={this.handleMenuKeyDown}
        style={{ width: inputWidth }}
        onBlur={this.handleMenuBlur}
      >
        {this.renderOptions()}
      </div>
    );
  }

  renderOptions(): React.ReactNode {
    const { noMatchText } = this.props;
    const { title, filteredOptions } = this.state;

    if (title && filteredOptions.length === 0) {
      return <div className="no-match">{noMatchText}</div>;
    }

    return filteredOptions.map((option, index) =>
      this.renderOption(option, index)
    );
  }

  renderOption(option: AutoCompleteOption, index: number): JSX.Element {
    const { keyboardOptionIndex } = this.state;
    const key = `option-${index}-${option.value}`;
    return (
      <button
        key={key}
        type="button"
        className={classNames('aci-option-btn', {
          'keyboard-active': keyboardOptionIndex === index,
        })}
        onClick={() => this.handleOptionClick(option)}
        onFocus={() => this.setState({ keyboardOptionIndex: index })}
      >
        {option.title}
      </button>
    );
  }

  render(): JSX.Element {
    const {
      options,
      inputPlaceholder,
      disabled,
      className,
      defaultTitle,
      spellCheck,
    } = this.props;
    const { title, menuIsOpen, popperOptions, invalid } = this.state;

    return (
      <div className="aci-container" ref={this.cbContainer}>
        <input
          value={title || defaultTitle}
          className={classNames('form-control', className, 'aci-input', {
            'is-invalid': invalid && !menuIsOpen,
          })}
          ref={this.input}
          onChange={this.handleInputChange}
          placeholder={inputPlaceholder || options[0].title}
          disabled={disabled}
          onFocus={this.handelInputFocus}
          onClick={this.handleInputClick}
          onBlur={this.handleInputBlur}
          onKeyDown={this.handleInputKeyDown}
          spellCheck={spellCheck}
        />
        <Popper
          ref={this.popper}
          options={popperOptions}
          className={classNames('aci-options-popper interactive')}
          onEntered={this.handleMenuOpened}
          onExited={this.handleMenuExited}
        >
          {this.renderMenuElement()}
        </Popper>
      </div>
    );
  }
}

export default AutoCompleteInput;
