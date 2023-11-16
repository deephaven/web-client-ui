/* eslint-disable react/jsx-props-no-spreading */
import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import { sampleSectionIdAndClasses } from './utils';

class Alerts extends Component {
  static renderAlert(brand: string): ReactElement {
    return (
      <div key={brand} className={classNames('alert', `alert-${brand}`)}>
        <strong>Well done!</strong>
        You successfully read this {brand} alert message.
      </div>
    );
  }

  render(): ReactElement {
    const alerts = ['success', 'info', 'warning', 'danger'].map(brand =>
      Alerts.renderAlert(brand)
    );
    return (
      <div {...sampleSectionIdAndClasses('alerts')}>
        <h2 className="ui-title">Alerts</h2>
        <div style={{ padding: '1rem 0' }}>{alerts}</div>
      </div>
    );
  }
}

export default Alerts;
