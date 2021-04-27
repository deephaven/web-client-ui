// Port of https://github.com/react-bootstrap/react-bootstrap/blob/master/src/Collapse.js
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { UISwitch } from '@deephaven/components';
import './LogLevelMenuItem.scss';

class LogLevelMenuItem extends PureComponent {
  constructor(props) {
    super(props);

    this.handleSwitchClick = this.handleSwitchClick.bind(this);
  }

  handleSwitchClick() {
    const { logLevel, onClick } = this.props;
    onClick(logLevel);
  }

  render() {
    const { logLevel, on } = this.props;
    return (
      <div className={classNames('log-level-menu-item', logLevel)}>
        <UISwitch on={on} onClick={this.handleSwitchClick} />
        {logLevel}
      </div>
    );
  }
}

LogLevelMenuItem.propTypes = {
  logLevel: PropTypes.string.isRequired,
  on: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default LogLevelMenuItem;
