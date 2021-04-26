import React, { Component } from 'react';
import classNames from 'classnames';

class Alerts extends Component {
  static renderAlert(brand) {
    return (
      <div key={brand} className={classNames('alert', `alert-${brand}`)}>
        <strong>Well done!</strong>
        You successfully read this {brand} alert message.
      </div>
    );
  }

  render() {
    const alerts = ['success', 'info', 'warning', 'danger'].map(brand =>
      Alerts.renderAlert(brand)
    );
    return (
      <div>
        <h2 className="ui-title">Alerts</h2>
        <div style={{ padding: '1rem 0' }}>{alerts}</div>
      </div>
    );
  }
}

export default Alerts;
