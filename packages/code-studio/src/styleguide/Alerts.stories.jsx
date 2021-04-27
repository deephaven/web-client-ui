import React from 'react';
import classNames from 'classnames';

export default {
  title: 'Messages/Alerts',
};

const AlertTemplate = args => (
  <div key={args.brand} className={classNames('alert', `alert-${args.brand}`)}>
    <strong>Well done!</strong>
    &nbsp;You successfully read this {args.brand} alert message.
  </div>
);

export const Success = AlertTemplate.bind({});
Success.args = {
  brand: 'success',
};

export const Info = AlertTemplate.bind({});
Info.args = {
  brand: 'info',
};

export const Warning = AlertTemplate.bind({});
Warning.args = {
  brand: 'warning',
};

export const Danger = AlertTemplate.bind({});
Danger.args = {
  brand: 'danger',
};
