/* eslint no-alert: "off" */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsBell, dhFilePrint } from '@deephaven/icons';
import { LoadingSpinner, Tooltip } from '@deephaven/components';

const icons = [dhFilePrint, vsBell];
const iconElements = icons.map(icon => (
  <FontAwesomeIcon key={`${icon.prefix}-${icon.iconName}`} icon={icon} />
));

export default {
  title: 'Messages/Tooltips',
};

const TooltipTemplate = args => (
  <div
    className="btn btn-primary"
    style={{
      cursor: 'default',
      marginBottom: '1rem',
      marginRight: '1rem',
    }}
  >
    Tooltip
    <Tooltip interactive={args.interactive}>{args.children}</Tooltip>
  </div>
);

export const Simple = TooltipTemplate.bind({});
Simple.args = {
  children: 'Text only content',
};

export const Complex = TooltipTemplate.bind({});
Complex.args = {
  children: (
    <>
      <div>
        Here is some <i>cool</i> <b>text</b>
      </div>
      <hr />
      <div>And some icons down here</div>
      <div>
        <LoadingSpinner />
        {iconElements}
      </div>
    </>
  ),
};

export const Interactive = TooltipTemplate.bind({});
Interactive.args = {
  interactive: true,
  children: (
    <>
      <div>This tooltip is interactive.</div>
      <hr />
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          alert('Button clicked!');
        }}
      >
        Show Alert
      </button>
    </>
  ),
};
