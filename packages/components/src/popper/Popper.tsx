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
import ReactDOM, { flushSync } from 'react-dom';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import PopperJs, { type PopperOptions, type ReferenceObject } from 'popper.js';
import ThemeExport from '../ThemeExport';
import './Popper.scss';
import { SpectrumThemeProvider } from '../theme/SpectrumThemeProvider';

const POPPER_CLASS_NAME = 'popper';

const KEEP_IN_PARENT_OPTIONS: PopperOptions = {
  placement: 'bottom-end',
  modifiers: {
    preventOverflow: {
      boundariesElement: 'scrollParent',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fn: (data, options: any) => {
        const modified = PopperJs.Defaults.modifiers?.preventOverflow?.fn?.(
          data,
          options
        );

        if (modified == null) {
          return data;
        }

        modified.styles.maxHeight = `${
          document.documentElement.clientHeight -
          data.offsets.popper.top -
          2 * options.padding // Double padding because there is top and bottom to account for
        }px`;
        return modified ?? data;
      },
    },
    flip: {
      enabled: false,
    },
  },
};

interface PopperProps {
  children: React.ReactNode;
  options: PopperOptions;
  className: string;
  timeout: number;
  onEntered: () => void;
  onExited: () => void;
  onBlur: (e: React.FocusEvent) => void;
  isShown: boolean;
  closeOnBlur: boolean;
  interactive: boolean;
  keepInParent: boolean;
  referenceObject: ReferenceObject | null;
  'data-testid'?: string;
}

interface PopperState {
  show: boolean;
  popper: PopperJs | null;
}

class Popper extends Component<PopperProps, PopperState> {
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
    onBlur(): void {
      // no-op
    },
    isShown: false,
    interactive: false,
    closeOnBlur: false,
    keepInParent: false,
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
    const { popper } = this.state;

    if (prevProps.isShown !== isShown) {
      cancelAnimationFrame(this.rAF);
      this.rAF = window.requestAnimationFrame(() => {
        if (isShown) {
          this.show();
        } else {
          this.hide();
        }
      });
    }

    if (popper) {
      popper.scheduleUpdate();
    }
  }

  componentWillUnmount(): void {
    this.destroyPopper(false);
  }

  element: HTMLDivElement;

  container: React.RefObject<HTMLDivElement>;

  nodeRef = React.createRef<HTMLDivElement>();

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
    const { popper: statePopper } = this.state;
    const { closeOnBlur, referenceObject } = this.props;

    if (statePopper) {
      return;
    }

    if (this.container.current === null) {
      return;
    }

    const { options: optionsProp, keepInParent } = this.props;
    const defaultOptions = keepInParent
      ? KEEP_IN_PARENT_OPTIONS
      : ({
          placement: 'auto',
          modifiers: { preventOverflow: { boundariesElement: 'viewport' } },
        } satisfies PopperOptions);

    const options = {
      ...defaultOptions,
      ...optionsProp,
      modifiers: {
        ...defaultOptions.modifiers,
        ...optionsProp.modifiers,
        preventOverflow: {
          ...defaultOptions.modifiers?.preventOverflow,
          ...optionsProp.modifiers?.preventOverflow,
        },
      },
    } satisfies PopperOptions;

    document.body.appendChild(this.element);

    let parent = this.getVisibleElement(this.container.current);
    if (parent == null) {
      parent = this.container.current;
    }

    const popper = new PopperJs(
      referenceObject || parent,
      this.element,
      options
    );
    popper.scheduleUpdate();

    // delayed due to scheduleUpdate
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      // If the current focus is not on the .popper or one of its descendants,
      // set the focus to the .popper element. This is necessary for close on
      // blur to work.
      if (closeOnBlur) {
        const popperEl = this.element.querySelector(`.${POPPER_CLASS_NAME}`);

        if (
          popperEl instanceof HTMLElement &&
          !popperEl.contains(document.activeElement)
        ) {
          popperEl.focus();
        }
      }
    });

    // Needed to make the animation work
    flushSync(() => {
      this.setState({ popper });
    });
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

    // Needed to make the animation work
    flushSync(() => {
      this.setState({ show: true });
    });
  }

  hide(): void {
    this.setState({ show: false });
  }

  scheduleUpdate(): void {
    const { popper } = this.state;
    if (popper) popper.scheduleUpdate();
  }

  handleBlur(e: React.FocusEvent): void {
    const { closeOnBlur, onBlur } = this.props;
    if (!(e.relatedTarget instanceof HTMLElement)) {
      return;
    }
    if (!this.element.contains(e.relatedTarget)) {
      onBlur?.(e);
      if (closeOnBlur) {
        this.hide();
      }
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
      <SpectrumThemeProvider isPortal>
        <CSSTransition
          in={show}
          timeout={timeout}
          classNames="popper-transition"
          onEntered={this.handleEnter}
          onExited={this.handleExit}
          nodeRef={this.nodeRef}
        >
          <div
            ref={this.nodeRef}
            onClick={e => {
              // stop click events from escaping popper
              e.stopPropagation();
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') this.hide();
            }}
            className={classNames(
              POPPER_CLASS_NAME,
              { interactive },
              className
            )}
            onBlur={this.handleBlur}
            tabIndex={closeOnBlur ? -1 : undefined}
            role="presentation"
          >
            <div className="popper-content">
              {children}
              {/* eslint-disable-next-line react/no-unknown-property */}
              <div className="popper-arrow" x-arrow="" />
            </div>
          </div>
        </CSSTransition>
      </SpectrumThemeProvider>
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
