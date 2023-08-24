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
import PopperJs, { PopperOptions, ReferenceObject } from 'popper.js';
import PropTypes from 'prop-types';
import ThemeExport from '../ThemeExport';
import './Popper.scss';
import { ThemeProvider } from '../theme';

interface PopperProps {
  options: PopperOptions;
  className: string;
  timeout: number;
  onEntered: () => void;
  onExited: () => void;
  isShown: boolean;
  closeOnBlur: boolean;
  interactive: boolean;
  referenceObject: ReferenceObject | null;
  'data-testid'?: string;
}

interface PopperState {
  show: boolean;
  popper: PopperJs | null;
}

class Popper extends Component<PopperProps, PopperState> {
  static propTypes = {
    children: PropTypes.node.isRequired,
    options: PropTypes.shape({}),
    className: PropTypes.string,
    timeout: PropTypes.number,
    onEntered: PropTypes.func,
    onExited: PropTypes.func,
    isShown: PropTypes.bool,
    closeOnBlur: PropTypes.bool,
    interactive: PropTypes.bool,
    referenceObject: PropTypes.shape({}),
    'data-testid': PropTypes.string,
  };

  static defaultProps = {
    options: {},
    className: '',
    timeout: ThemeExport.transitionMs,
    onEntered(): void {
      // no-op
    },
    onExited(): void {
      // no-op
    },
    isShown: false,
    interactive: false,
    closeOnBlur: false,
    referenceObject: null,
    'data-testid': undefined,
  };

  constructor(props: PopperProps) {
    super(props);

    this.handleEnter = this.handleEnter.bind(this);
    this.handleExit = this.handleExit.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.element = document.createElement('div');
    this.element.className = 'popper-container';
    this.container = React.createRef<HTMLDivElement>();

    // cancelAnimationFrame does nothing if the handle isn't recognized
    // requestAnimationFrame provides a non-zero number, so 0 as a default should be safe
    this.rAF = 0;

    const { isShown } = this.props;

    this.state = {
      show: isShown,
      popper: null,
    };
  }

  componentDidUpdate(prevProps: PopperProps): void {
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

  componentWillUnmount(): void {
    this.destroyPopper(false);
  }

  element: HTMLDivElement;

  container: React.RefObject<HTMLDivElement>;

  // This is the request animation frame handle number
  rAF: number;

  /** Goes through an element and it's parents until the first visible element is found */
  getVisibleElement(element: HTMLElement | null): HTMLElement | null {
    if (
      element == null ||
      element.clientHeight > 0 ||
      element.clientWidth > 0
    ) {
      return element;
    }

    return this.getVisibleElement(element.parentElement);
  }

  initPopper(): void {
    let { popper } = this.state;
    const { closeOnBlur, referenceObject } = this.props;

    if (popper) {
      return;
    }

    if (this.container.current === null) {
      return;
    }

    let { options } = this.props;
    options = {
      placement: 'auto',
      modifiers: { preventOverflow: { boundariesElement: 'viewport' } },
      ...options,
    };
    document.body.appendChild(this.element);

    let parent = this.getVisibleElement(this.container.current);
    if (parent == null) {
      parent = this.container.current;
    }

    popper = new PopperJs(referenceObject || parent, this.element, options);
    popper.scheduleUpdate();

    // delayed due to scheduleUpdate
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      // for blur on close to work, focus needs to be on or within the popper
      if (closeOnBlur && !this.element.contains(document.activeElement)) {
        // only set focus, if a focus isn't already set within
        const elem = this.element.firstElementChild;
        if (elem instanceof HTMLElement) {
          elem.focus(); // first child of the portal element
        }
      }
    });

    this.setState({ popper });
  }

  destroyPopper(updateState = true): void {
    cancelAnimationFrame(this.rAF);

    const { popper } = this.state;
    if (!popper) {
      return;
    }

    popper.destroy();

    // If component is exiting and unmounted in
    // the same frame, destroy can be called twice.
    // Check to make sure removeChild isn't called twice.
    if (document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }

    if (updateState) {
      this.setState({ popper: null });
    }
  }

  show(): void {
    this.initPopper();
    this.setState({ show: true });
  }

  hide(): void {
    this.setState({ show: false });
  }

  scheduleUpdate(): void {
    const { popper } = this.state;
    if (popper) popper.scheduleUpdate();
  }

  handleBlur(e: React.FocusEvent): void {
    if (!(e.relatedTarget instanceof HTMLElement)) {
      return;
    }
    if (!this.element.contains(e.relatedTarget)) {
      this.hide();
    }
  }

  handleEnter(): void {
    const { onEntered } = this.props;
    onEntered(); // trigger any parent component waiting for enter handler
  }

  handleExit(): void {
    const { onExited } = this.props;
    const { show } = this.state;
    if (!show) {
      this.destroyPopper();
    }
    onExited(); // trigger any parent component waiting for exited handler
  }

  renderContent(): JSX.Element {
    const { className, children, timeout, interactive, closeOnBlur } =
      this.props;
    const { show } = this.state;

    return (
      <CSSTransition
        in={show}
        timeout={timeout}
        classNames="popper-transition"
        onEntered={this.handleEnter}
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
          <ThemeProvider isPortal>
            <div className="popper-content">
              {children}
              {/* eslint-disable-next-line react/no-unknown-property */}
              <div className="popper-arrow" x-arrow="" />
            </div>
          </ThemeProvider>
        </div>
      </CSSTransition>
    );
  }

  render(): JSX.Element {
    const { popper } = this.state;
    const { 'data-testid': dataTestId } = this.props;
    return (
      <div
        className="popper-parent-container"
        ref={this.container}
        style={{ display: 'none' }}
        data-testid={dataTestId}
      >
        {popper && ReactDOM.createPortal(this.renderContent(), this.element)}
      </div>
    );
  }
}

export default Popper;
export type { PopperOptions, ReferenceObject };
