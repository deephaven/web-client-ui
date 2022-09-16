import React, { Component } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import Popper, { PopperOptions, ReferenceObject } from './Popper';

const log = Log.module('Tooltip');

type TooltipProps = typeof Tooltip.defaultProps & {
  children: React.ReactNode;
  interactive?: boolean;
  options?: PopperOptions;
  popperClassName?: string;
  reshowTimeout?: number;
  timeout?: number;
  referenceObject?: ReferenceObject | null;
  onEntered?: () => void;
  onExited?: () => void;
  'data-testid'?: string;
};
interface TooltipState {
  isShown: boolean;
}

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
class Tooltip extends Component<TooltipProps, TooltipState> {
  static defaultTimeout = 500;

  static defaultReshowTimeout = 100;

  static triggerReshowThreshold = 300;

  static shownTooltipCount = 0;

  static lastHiddenTime = Date.now();

  static defaultProps = {
    interactive: false,
    options: {},
    popperClassName: '',
    reshowTimeout: Tooltip.defaultReshowTimeout,
    timeout: Tooltip.defaultTimeout,
    onEntered: (): void => undefined,
    onExited: (): void => undefined,
    'data-testid': undefined,
  };

  static handleHidden(): void {
    Tooltip.shownTooltipCount -= 1;

    if (Tooltip.shownTooltipCount === 0) {
      Tooltip.lastHiddenTime = Date.now();
    }
  }

  static handleShown(): void {
    Tooltip.shownTooltipCount += 1;
  }

  constructor(props: TooltipProps) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleWindowMouseMove = this.handleWindowMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleTimeout = this.handleTimeout.bind(this);
    this.handleExited = this.handleExited.bind(this);
    this.stopShowingTooltip = this.stopShowingTooltip.bind(this);

    this.container = React.createRef();
    this.popper = React.createRef();
    this.parent = null;
    this.timer = null;

    this.state = {
      isShown: false,
    };
  }

  componentDidMount(): void {
    this.startListening();

    const { timeout } = this.props;
    if (timeout === 0) {
      this.show();
    }
  }

  componentDidUpdate(prevProps: TooltipProps, prevState: TooltipState): void {
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

  componentWillUnmount(): void {
    this.stopListening();
    this.stopListeningWindow();
    this.stopTimer();

    const { isShown } = this.state;

    if (isShown) {
      Tooltip.handleHidden();
    }
  }

  container: React.RefObject<HTMLDivElement>;

  popper: React.RefObject<Popper>;

  parent: HTMLElement | null;

  // This i s platform dependent of Node/DOM
  // Jest requires Node types
  timer: number | null;

  startListening(): void {
    if (!this.container.current || !this.container.current.parentElement) {
      log.error("Tooltip doesn't have a container or a parent set!");
      return;
    }

    this.parent = this.container.current.parentElement;
    this.parent.addEventListener('mousemove', this.handleMouseMove);
    this.parent.addEventListener('mouseleave', this.handleMouseLeave);
    this.parent.addEventListener('mousedown', this.stopShowingTooltip);
  }

  stopListening(): void {
    if (!this.parent) {
      return;
    }

    this.parent.removeEventListener('mousemove', this.handleMouseMove);
    this.parent.removeEventListener('mouseleave', this.handleMouseLeave);
    this.parent.removeEventListener('mousedown', this.stopShowingTooltip);
  }

  startListeningWindow(): void {
    window.addEventListener('mousemove', this.handleWindowMouseMove, true);
    window.addEventListener('contextmenu', this.stopShowingTooltip, true);
    window.addEventListener('wheel', this.handleWheel);
  }

  stopListeningWindow(): void {
    window.removeEventListener('mousemove', this.handleWindowMouseMove, true);
    window.removeEventListener('contextmenu', this.stopShowingTooltip, true);
    window.removeEventListener('wheel', this.handleWheel);
  }

  handleMouseMove(): void {
    this.startTimer();
  }

  handleWheel(): void {
    const { isShown } = this.state;
    if (this.popper.current && this.parent && isShown) {
      if (
        !this.popper.current.element.matches(':hover') &&
        !this.parent.matches(':hover')
      ) {
        this.stopTimer();
        this.hide();
      }
    }
  }

  handleMouseLeave(): void {
    const { isShown } = this.state;
    this.stopTimer();

    const { interactive } = this.props;
    if (!interactive && isShown) {
      this.hide();
    }
  }

  handleTimeout(): void {
    this.show();
  }

  handleWindowMouseMove(event: MouseEvent): void {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const { isShown } = this.state;

    if (!this.popper.current || !this.parent) {
      return;
    }
    const popperRect = this.popper.current.element.getBoundingClientRect();
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

  startTimer(): void {
    this.stopTimer();

    const { timeout, reshowTimeout } = this.props;
    let timerTimeout = timeout;
    if (
      Tooltip.shownTooltipCount > 0 ||
      Date.now() - Tooltip.lastHiddenTime < Tooltip.triggerReshowThreshold
    ) {
      timerTimeout = reshowTimeout;
    }
    this.timer = window.setTimeout(this.handleTimeout, timerTimeout);
  }

  stopTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  show(): void {
    const { isShown } = this.state;
    this.stopTimer();

    if (!isShown) {
      this.popper.current?.show();
      this.setState({ isShown: true });

      const { interactive } = this.props;
      if (interactive) {
        this.startListeningWindow();
      }
    }
  }

  hide(): void {
    this.popper.current?.hide();
    this.stopListeningWindow();
  }

  update(): void {
    this.popper.current?.scheduleUpdate();
  }

  handleExited(): void {
    this.setState({ isShown: false });
    const { onExited } = this.props;
    onExited();
  }

  stopShowingTooltip(): void {
    const { isShown } = this.state;
    this.stopTimer();
    if (isShown) {
      this.hide();
    }
  }

  render(): JSX.Element {
    const {
      interactive,
      children,
      options,
      referenceObject,
      popperClassName,
      'data-testid': dataTestId,
      onEntered,
    } = this.props;
    const { isShown } = this.state;
    return (
      <div
        ref={this.container}
        style={{ display: 'none' }}
        data-testid={dataTestId}
      >
        <Popper
          className={classNames(popperClassName)}
          options={options}
          ref={this.popper}
          onEntered={onEntered}
          onExited={this.handleExited}
          interactive={interactive}
          referenceObject={referenceObject}
        >
          <div className="tooltip-content"> {isShown && children}</div>
        </Popper>
      </div>
    );
  }
}

export default Tooltip;
