/**
 *  A component for creating popover dialogs. Only requires child element.
 *
 * <Popper
 *   options={popperOptions}
 *   className="whatever"
 *   onEntered={this.handleEnter}
 *   onExited={this.handleExit}
 *   closeOnBlur // if you want dialog to self close, on click outside
 *   interactive // if popper contents will be interactable
 *   isShown={variable} // controls if its shown or not,
 *   ref={this.popper} // or via ref and this.popper.show() or this.popper.hide()
 *  >
 *   <ChildContent />
 * </Popper>
 */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import PopperJs from 'popper.js';
import PropTypes from 'prop-types';
import ThemeExport from '../ThemeExport';
import './Popper.scss';

class Popper extends Component {
  constructor(props) {
    super(props);

    this.handleEnter = this.handleEnter.bind(this);
    this.handleExit = this.handleExit.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.element = document.createElement('div');
    this.element.className = 'popper-container';
    this.container = null;

    this.isExiting = false;
    this.rAF = null;

    const { isShown } = this.props;

    this.state = {
      show: isShown || false,
      popper: null,
    };
  }

  componentDidUpdate(prevProps) {
    const { isShown } = this.props;

    if (prevProps.isShown !== isShown) {
      if (isShown) {
        cancelAnimationFrame(this.rAF);
        this.rAF = window.requestAnimationFrame(() => {
          this.show();
        });
      } else {
        this.hide();
      }
    }
  }

  componentWillUnmount() {
    this.destroyPopper(false);
    this.isExiting = false;
  }

  /** Goes through an element and it's parents until the first visible element is found */
  getVisibleElement(element) {
    if (
      element == null ||
      element.clientHeight > 0 ||
      element.clientWidth > 0
    ) {
      return element;
    }

    return this.getVisibleElement(element.parentNode);
  }

  initPopper() {
    let { popper } = this.state;
    const { closeOnBlur } = this.props;

    if (popper) {
      return;
    }

    let { options } = this.props;
    options = {
      placement: 'auto',
      ...options,
    };
    document.body.appendChild(this.element);

    let parent = this.getVisibleElement(this.container);
    if (parent == null) {
      parent = this.container;
    }

    popper = new PopperJs(parent, this.element, options);
    popper.scheduleUpdate();

    // delayed due to scheduleUpdate
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      // for blur on close to work, focus needs to be on or within the popper
      if (closeOnBlur && !this.element.contains(document.activeElement))
        // only set focus, if a focus isn't already set within
        this.element.firstChild.focus(); // first child of the portal element
    });

    this.setState({ popper });
  }

  destroyPopper(updateState = true) {
    this.isExiting = false;
    cancelAnimationFrame(this.rAF);

    const { popper } = this.state;
    if (!popper) {
      return;
    }

    popper.destroy();

    document.body.removeChild(this.element);

    if (updateState) {
      this.setState({ popper: null });
    }
  }

  show() {
    this.initPopper();
    this.setState({ show: true });
  }

  hide() {
    this.setState({ show: false });
  }

  scheduleUpdate() {
    const { popper } = this.state;
    if (popper) popper.scheduleUpdate();
  }

  handleBlur(e) {
    if (!this.element.contains(e.relatedTarget)) {
      this.hide();
    }
  }

  handleEnter() {
    const { onEntered } = this.props;
    onEntered(); // trigger any parent component waiting for enter handler
  }

  handleExit() {
    const { onExited } = this.props;
    onExited(); // trigger any parent component waiting for exited handler

    const { show } = this.state;
    if (!show) {
      this.destroyPopper();
    }

    this.isExiting = false;
  }

  renderContent() {
    const {
      className,
      children,
      timeout,
      interactive,
      closeOnBlur,
    } = this.props;
    const { show } = this.state;

    return (
      <CSSTransition
        in={show}
        timeout={timeout}
        classNames="popper-transition"
        onEntered={this.handleEnter}
        onExit={() => {
          this.isExiting = true;
        }}
        onExited={this.handleExit}
      >
        <div
          onClick={e => {
            // stop click events from escaping popper
            e.stopPropagation();
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') this.hide();
          }}
          className={classNames('popper', { interactive }, className)}
          onBlur={closeOnBlur ? this.handleBlur : undefined}
          tabIndex={closeOnBlur ? -1 : undefined}
          role="presentation"
        >
          <div className="popper-content">
            {children}
            <div className="popper-arrow" x-arrow="" />
          </div>
        </div>
      </CSSTransition>
    );
  }

  render() {
    const { popper } = this.state;
    return (
      <div
        className="popper-parent-container"
        ref={container => {
          this.container = container;
        }}
        style={{ display: 'none' }}
      >
        {popper && ReactDOM.createPortal(this.renderContent(), this.element)}
      </div>
    );
  }
}

Popper.propTypes = {
  children: PropTypes.node.isRequired,
  options: PropTypes.shape({}),
  className: PropTypes.string,
  timeout: PropTypes.number,
  onEntered: PropTypes.func,
  onExited: PropTypes.func,
  isShown: PropTypes.bool,
  closeOnBlur: PropTypes.bool,
  interactive: PropTypes.bool,
};

Popper.defaultProps = {
  options: {},
  className: '',
  timeout: ThemeExport.transitionMs,
  onEntered: () => {},
  onExited: () => {},
  isShown: null,
  interactive: false,
  closeOnBlur: false,
};

export default Popper;
