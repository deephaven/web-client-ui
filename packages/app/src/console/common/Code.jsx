import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

class Code extends Component {
  constructor(props) {
    super(props);

    this.container = null;
  }

  componentDidMount() {
    this.colorize();
  }

  colorize() {
    const { children } = this.props;
    if (this.container && children) {
      monaco.editor.colorizeElement(this.container, {
        theme: 'dh-dark',
      });
    }
  }

  render() {
    const { children, language } = this.props;
    return (
      <div>
        <div
          data-lang={language}
          ref={container => {
            this.container = container;
          }}
          // Add pointerEvents: 'none' has huge benefits on performance with Hit Test testing on large colorized elements.
          // You can still select the text event with this set
          style={{ pointerEvents: 'none' }}
        >
          {children}
        </div>
      </div>
    );
  }
}

Code.propTypes = {
  children: PropTypes.node.isRequired,
  language: PropTypes.string.isRequired,
};

export default Code;
