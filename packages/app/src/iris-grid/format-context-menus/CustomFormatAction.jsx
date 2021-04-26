import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@deephaven/components';
import { DOMUtils } from '@deephaven/utils';

import './CustomFormatAction.scss';

/**
 * Renders menuElement option with custom format input for use in formatting context menus
 *
 * TODO:
 * - capture focus when this menu action is selected via ArrowUp/ArrowDown keys
 * - dynamically update selected menu item when clicking on the input box
 */
class CustomFormatAction extends Component {
  constructor(props) {
    super(props);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.inputRef = React.createRef();
  }

  handleInputChange() {
    const { onChange } = this.props;
    onChange(this.inputRef.current.value);
  }

  closeContextMenu() {
    const { forwardedProps } = this.props;
    const { closeMenu } = forwardedProps;
    closeMenu(true);
  }

  revertToDefault() {
    const { onChange } = this.props;
    onChange(null);
  }

  returnFocusToContextMenu() {
    const parentContextMenu = DOMUtils.getClosestByClassName(
      this.inputRef.current,
      'context-menu-container'
    );
    if (parentContextMenu) {
      parentContextMenu.focus();
    }
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
        event.stopPropagation();
        this.closeContextMenu();
        break;
      case 'Escape':
        event.stopPropagation();
        this.revertToDefault();
        this.closeContextMenu();
        break;
      case 'ArrowRight':
      case 'ArrowLeft':
        event.stopPropagation();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.returnFocusToContextMenu();
        break;
      default:
        event.stopPropagation();
    }
  }

  render() {
    const { formatString, forwardedProps, placeholder, title } = this.props;
    const {
      menuItem: { description },
      iconElement,
    } = forwardedProps;
    return (
      <div className="form-group flex-grow mb-0">
        <div className="custom-format-title">
          <span className="icon">{iconElement}</span>
          <label className="title mb-0" htmlFor="custom-format-input">
            {title}
            {description && <Tooltip>{description}</Tooltip>}
          </label>
        </div>
        <div className="pl-2 pr-2 pb-2">
          <input
            id="custom-format-input"
            className="form-control text-right mb-0"
            type="text"
            defaultValue={formatString}
            ref={this.inputRef}
            placeholder={placeholder}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleInputChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      </div>
    );
  }
}

CustomFormatAction.propTypes = {
  formatString: PropTypes.string,
  forwardedProps: PropTypes.shape({
    menuItem: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
    closeMenu: PropTypes.func,
    iconElement: PropTypes.node,
  }),
  placeholder: PropTypes.string,
  title: PropTypes.string,
  onChange: PropTypes.func,
};

CustomFormatAction.defaultProps = {
  formatString: '',
  forwardedProps: {
    menuItem: {},
    closeMenu: () => {},
    iconElement: null,
  },
  placeholder: '',
  title: '',
  onChange: () => {},
};

export default CustomFormatAction;
