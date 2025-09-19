// Port of https://github.com/react-bootstrap/react-bootstrap/blob/master/src/Collapse.js
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';

interface CollapseProps {
  className?: string;
  in: boolean;
  children: React.ReactNode;
  autoFocusOnShow?: boolean;
  'data-testid'?: string;
}

class Collapse extends Component<CollapseProps> {
  static propTypes = {
    className: PropTypes.string,
    in: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    autoFocusOnShow: PropTypes.bool,
    'data-testid': PropTypes.string,
  };

  static defaultProps = {
    className: '',
    autoFocusOnShow: false,
    'data-testid': undefined,
  };

  static getHeight(elem: HTMLElement): number {
    const scrollBarWidth = elem.scrollWidth - elem.clientWidth;
    return elem.scrollHeight - scrollBarWidth;
  }

  constructor(props: CollapseProps) {
    super(props);

    this.handleEntered = this.handleEntered.bind(this);
  }

  nodeRef = React.createRef<HTMLDivElement>();

  handleEntered(): void {
    const elem = this.nodeRef.current;
    if (!elem) {
      return;
    }
    elem.style.height = '';

    const { autoFocusOnShow } = this.props;
    if (autoFocusOnShow !== undefined && autoFocusOnShow) {
      const input = elem.querySelector(
        'input, select, textarea'
      ) as HTMLInputElement;

      if (input != null) {
        input.focus();
      }
    }
  }

  handleEnter(): void {
    const elem = this.nodeRef.current;
    if (!elem) {
      return;
    }
    elem.style.height = '0';
  }

  handleEntering(): void {
    const elem = this.nodeRef.current;
    if (!elem) {
      return;
    }
    elem.style.height = `${Collapse.getHeight(elem)}px`;
  }

  handleExiting(): void {
    const elem = this.nodeRef.current;
    if (!elem) {
      return;
    }
    elem.style.height = '0';
  }

  handleExit(): void {
    const elem = this.nodeRef.current;
    if (!elem) {
      return;
    }
    elem.style.height = `${Collapse.getHeight(elem)}px`;
  }

  render(): JSX.Element {
    const {
      children,
      className,
      in: inTransition,
      'data-testid': dataTestId,
    } = this.props;
    return (
      <CSSTransition
        in={inTransition}
        classNames={{
          enterActive: 'collapsing',
          enterDone: 'collapse show',
          exitActive: 'collapsing',
          exitDone: 'collapse',
        }}
        onEnter={this.handleEnter}
        onEntering={this.handleEntering}
        onEntered={this.handleEntered}
        onExit={this.handleExit}
        onExiting={this.handleExiting}
        timeout={350}
        nodeRef={this.nodeRef}
      >
        {state => (
          <div
            ref={this.nodeRef}
            className={classNames({ collapse: state === 'exited' }, className)}
            data-testid={dataTestId}
          >
            {children}
          </div>
        )}
      </CSSTransition>
    );
  }
}

export default Collapse;
