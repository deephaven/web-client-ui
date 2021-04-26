// Port of https://github.com/react-bootstrap/react-bootstrap/blob/master/src/Collapse.js
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';

class Collapse extends Component {
  static handleEnter(elemParam) {
    const elem = elemParam;
    elem.style.height = 0;
  }

  static handleEntering(elemParam) {
    const elem = elemParam;
    elem.style.height = `${Collapse.getHeight(elem)}px`;
  }

  static handleExiting(elemParam) {
    const elem = elemParam;
    elem.style.height = 0;
  }

  static handleExit(elemParam) {
    const elem = elemParam;
    elem.style.height = `${Collapse.getHeight(elem)}px`;
  }

  static getHeight(elem) {
    const scrollBarWidth = elem.scrollWidth - elem.clientWidth;
    return elem.scrollHeight - scrollBarWidth;
  }

  constructor(props) {
    super(props);

    this.handleEntered = this.handleEntered.bind(this);
  }

  handleEntered(elemParam) {
    const elem = elemParam;
    elem.style.height = null;

    const { autoFocusOnShow } = this.props;
    if (autoFocusOnShow) {
      const input = elem.querySelector('input, select, textarea');
      if (input) {
        input.focus();
      }
    }
  }

  render() {
    const { children, className, in: inTransition } = this.props;
    return (
      <CSSTransition
        in={inTransition}
        classNames={{
          enterActive: 'collapsing',
          enterDone: 'collapse show',
          exitActive: 'collapsing',
          exitDone: 'collapse',
        }}
        onEnter={Collapse.handleEnter}
        onEntering={Collapse.handleEntering}
        onEntered={this.handleEntered}
        onExit={Collapse.handleExit}
        onExiting={Collapse.handleExiting}
        timeout={350}
      >
        {state => (
          <div
            className={classNames({ collapse: state === 'exited' }, className)}
          >
            {children}
          </div>
        )}
      </CSSTransition>
    );
  }
}

Collapse.propTypes = {
  className: PropTypes.string,
  in: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  autoFocusOnShow: PropTypes.bool,
};

Collapse.defaultProps = {
  className: '',
  autoFocusOnShow: false,
};

export default Collapse;
