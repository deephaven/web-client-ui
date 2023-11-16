/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Editor } from '@deephaven/console';
import Constants from './StyleConstants';
import { sampleSectionIdAndClasses } from './utils';

function Editors(): React.ReactElement {
  return (
    <div {...sampleSectionIdAndClasses('editors')}>
      <h2 className="ui-title">Editor</h2>
      <h5 className="sub-title">Python</h5>
      <div style={{ height: 400, position: 'relative' }}>
        <Editor
          settings={{ language: 'python', value: Constants.testPython }}
        />
      </div>
      <h5 className="sub-title">Groovy</h5>
      <div style={{ height: 400, position: 'relative' }}>
        <Editor
          settings={{ language: 'groovy', value: Constants.testGroovy }}
        />
      </div>
    </div>
  );
}

export default Editors;
