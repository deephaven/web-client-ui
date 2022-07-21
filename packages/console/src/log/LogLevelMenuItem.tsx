// Port of https://github.com/react-bootstrap/react-bootstrap/blob/master/src/Collapse.js
import React, { PureComponent, ReactElement } from 'react';
import classNames from 'classnames';
import { UISwitch } from '@deephaven/components';
import './LogLevelMenuItem.scss';

interface LogLevelMenuItemProps {
  logLevel: string;
  on: boolean;
  onClick: (logLevel: string) => void;
}

class LogLevelMenuItem extends PureComponent<
  LogLevelMenuItemProps,
  Record<string, never>
> {
  constructor(props: LogLevelMenuItemProps) {
    super(props);

    this.handleSwitchClick = this.handleSwitchClick.bind(this);
  }

  handleSwitchClick(): void {
    const { logLevel, onClick } = this.props;
    onClick(logLevel);
  }

  render(): ReactElement {
    const { logLevel, on } = this.props;
    return (
      <div className={classNames('log-level-menu-item', logLevel)}>
        <UISwitch on={on} onClick={this.handleSwitchClick} />
        {logLevel}
      </div>
    );
  }
}

export default LogLevelMenuItem;
