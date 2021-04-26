import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Log from '@deephaven/log';
import Popper from './Popper';

const log = Log.module('Tooltip');

/**
 * Component that can be added to an element to automatically display a tooltip.
 * Content is mounted lazily, so don't worry about complex tooltips!
 *
 * Usage:
 * <div className="parent-container">
 *   Hover this container to see a tooltip
 *   <Tooltip>
 *     <div>My tooltip content goes here!</div>
 *   </Tooltip>
 * </div>
 */
class Tooltip extends Component {
  static defaultTimeout = 500;

  static defaultReshowTimeout = 100;

  static triggerReshowThreshold = 300;

  static shownTooltipCount = 0;

  static lastHiddenTime = Date.now();

  static handleHidden() {
    Tooltip.shownTooltipCount -= 1;

    if (Tooltip.shownTooltipCount === 0) {
      Tooltip.lastHiddenTime = Date.now();
    }
  }

  static handleShown() {
    Tooltip.shownTooltipCount += 1;
  }

  constructor(props) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleWindowMouseMove = this.handleWindowMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleTimeout = this.handleTimeout.bind(this);
    this.handleExited = this.handleExited.bind(this);
    this.stopShowingTooltip = this.stopShowingTooltip.bind(this);

    this.container = null;
    this.popper = null;
    this.parent = null;
    this.timer = null;

    this.state = {
      isShown: false,
    };
  }

  componentDidMount() {
    this.startListening();

    const { timeout } = this.props;
    if (timeout === 0) {
      this.show();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { isShown: oldIsShown } = prevState;
    const { isShown } = this.state;

    if (isShown !== oldIsShown) {
      if (isShown) {
        Tooltip.handleShown();
      } else {
        Tooltip.handleHidden();
      }
    }
  }

  componentWillUnmount() {
    this.stopListening();
    this.stopListeningWindow();
    this.stopTimer();

    const { isShown } = this.state;

    if (isShown) {
      Tooltip.handleHidden();
    }
  }

  startListening() {
    if (!this.container || !this.container.parentNode) {
      log.error("Tooltip doesn't have a container or a parent set!");
      return;
    }

    this.parent = this.container.parentNode;
    this.parent.addEventListener('mousemove', this.handleMouseMove);
    this.parent.addEventListener('mouseleave', this.handleMouseLeave);
    this.parent.addEventListener('mousedown', this.stopShowingTooltip);
  }

  stopListening() {
    if (!this.parent) {
      return;
    }

    this.parent.removeEventListener('mousemove', this.handleMouseMove);
    this.parent.removeEventListener('mouseleave', this.handleMouseLeave);
    this.parent.removeEventListener('mousedown', this.stopShowingTooltip);
  }

  startListeningWindow() {
    window.addEventListener('mousemove', this.handleWindowMouseMove, true);
    window.addEventListener('contextmenu', this.stopShowingTooltip, true);
    window.addEventListener('wheel', this.handleWheel);
  }

  stopListeningWindow() {
    window.removeEventListener('mousemove', this.handleWindowMouseMove, true);
    window.removeEventListener('contextmenu', this.stopShowingTooltip, true);
    window.removeEventListener('wheel', this.handleWheel);
  }

  handleMouseMove() {
    this.startTimer();
  }

  handleWheel() {
    const { isShown } = this.state;
    if (this.popper && this.parent && isShown) {
      if (
        !this.popper.element.matches(':hover') &&
        !this.parent.matches(':hover')
      ) {
        this.stopTimer();
        this.hide();
      }
    }
  }

  handleMouseLeave() {
    const { isShown } = this.state;
    this.stopTimer();

    const { interactive } = this.props;
    if (!interactive && isShown) {
      this.hide();
    }
  }

  handleTimeout() {
    this.show();
  }

  handleWindowMouseMove(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const { isShown } = this.state;

    const popperRect = this.popper.element.getBoundingClientRect();
    const parentRect = this.parent.getBoundingClientRect();

    if (
      mouseX >= popperRect.left &&
      mouseX <= popperRect.left + popperRect.width &&
      mouseY >= popperRect.top &&
      mouseY <= popperRect.top + popperRect.height
    ) {
      this.handleMouseMove();
    } else if (
      mouseX >= parentRect.left &&
      mouseX <= parentRect.left + parentRect.width &&
      mouseY >= parentRect.top &&
      mouseY <= parentRect.top + parentRect.height
    ) {
      this.handleMouseMove();
    } else if (isShown) {
      this.stopTimer();
      this.hide();
    }
  }

  startTimer() {
    this.stopTimer();

    const { timeout, reshowTimeout } = this.props;
    let timerTimeout = timeout;
    if (
      Tooltip.shownTooltipCount > 0 ||
      Date.now() - Tooltip.lastHiddenTime < Tooltip.triggerReshowThreshold
    ) {
      timerTimeout = reshowTimeout;
    }
    this.timer = setTimeout(this.handleTimeout, timerTimeout);
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  show() {
    const { isShown } = this.state;
    this.stopTimer();

    if (!isShown) {
      this.popper.show();
      this.setState({ isShown: true });

      const { interactive } = this.props;
      if (interactive) {
        this.startListeningWindow();
      }
    }
  }

  hide() {
    this.popper.hide();
    this.stopListeningWindow();
  }

  update() {
    this.popper.scheduleUpdate();
  }

  handleExited() {
    this.setState({ isShown: false });
  }

  stopShowingTooltip() {
    const { isShown } = this.state;
    this.stopTimer();
    if (isShown) {
      this.hide();
    }
  }

  render() {
    const { interactive, children, options, popperClassName } = this.props;
    const { isShown } = this.state;
    return (
      <div
        ref={container => {
          this.container = container;
        }}
        style={{ display: 'none' }}
      >
        <Popper
          className={classNames(popperClassName)}
          options={options}
          ref={popper => {
            this.popper = popper;
          }}
          onExited={this.handleExited}
          interactive={interactive}
        >
          <div className="tooltip-content"> {isShown && children}</div>
        </Popper>
      </div>
    );
  }
}

Tooltip.propTypes = {
  interactive: PropTypes.bool,
  options: PropTypes.shape({}),
  timeout: PropTypes.number,
  reshowTimeout: PropTypes.number,
  children: PropTypes.node.isRequired,
  popperClassName: PropTypes.string,
};

Tooltip.defaultProps = {
  interactive: false,
  options: {},
  popperClassName: '',
  reshowTimeout: Tooltip.reshowTimeout,
  timeout: Tooltip.defaultTimeout,
};

export default Tooltip;
