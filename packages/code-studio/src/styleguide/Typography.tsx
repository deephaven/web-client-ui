/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { sampleSectionIdAndClasses } from './utils';

function Typography(): React.ReactElement {
  return (
    <div {...sampleSectionIdAndClasses('typography')}>
      <h2 className="ui-title">Typography</h2>
      <div className="row">
        <div className="col">
          <h1 className="text-muted" data-no-menu>
            h1. Unused
          </h1>
          <h2 className="text-muted" data-no-menu>
            h2. Unused
          </h2>
          <h3 className="text-muted" data-no-menu>
            h3. Unused
          </h3>
          <h4 data-no-menu>h4. Standard Heading</h4>
          <h5 data-no-menu>h5. Small Heading</h5>
          <h6 className="text-muted" data-no-menu>
            h6. Unused
          </h6>
        </div>

        <div className="col">
          <h4>Fonts</h4>
          <p>UI: Fira Sans;</p>
          <p className="text-monospace">Code: Fira Mono;</p>
          <p>Tables: Fira Sans; font-feature-settings: &quot;tnum&quot;;</p>
          <p>Default font-size: 14px = 1rem</p>
        </div>
      </div>
    </div>
  );
}

export default Typography;
