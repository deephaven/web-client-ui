/* eslint no-alert: "off" */
import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingSpinner, Tooltip } from '@deephaven/components';
import { vsBell, dhFilePrint } from '@deephaven/icons';

const Tooltips = () => {
  const icons = [dhFilePrint, vsBell];
  const iconElements = icons.map(icon => (
    <FontAwesomeIcon key={`${icon.prefix}-${icon.iconName}`} icon={icon} />
  ));

  return (
    <div>
      <h2
        className="ui-title"
        title="Make better looking tooltips than this one!"
      >
        Tooltips
      </h2>
      <div
        className="btn btn-primary"
        style={{
          cursor: 'default',
          marginBottom: '1rem',
          marginRight: '1rem',
        }}
      >
        Simple Tooltip
        <Tooltip>Text only content</Tooltip>
      </div>
      <div
        className="btn btn-secondary"
        style={{
          cursor: 'default',
          marginBottom: '1rem',
          marginRight: '1rem',
        }}
      >
        Complex Tooltip
        <Tooltip>
          <div>
            Here is some <i>cool</i> <b>text</b>
          </div>
          <hr />
          <div>And some icons down here</div>
          <div>
            <LoadingSpinner />
            {iconElements}
          </div>
        </Tooltip>
      </div>
      <div
        className="btn btn-success"
        style={{
          cursor: 'default',
          marginBottom: '1rem',
          marginRight: '1rem',
        }}
      >
        Interactive Tooltip
        <Tooltip interactive>
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
        </Tooltip>
      </div>
    </div>
  );
};

export default Tooltips;
