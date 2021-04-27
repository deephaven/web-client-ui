import React from 'react';
import Constants from './StyleConstants';
import Editor from '../console/notebook/Editor';

const Editors = () => (
  <div>
    <h2 className="ui-title">Editor</h2>
    <h5 className="sub-title">Python</h5>
    <div style={{ height: 400, position: 'relative' }}>
      <Editor settings={{ language: 'python', value: Constants.testPython }} />
    </div>
    <h5 className="sub-title">Groovy</h5>
    <div style={{ height: 400, position: 'relative' }}>
      <Editor settings={{ language: 'groovy', value: Constants.testGroovy }} />
    </div>
  </div>
);

export default Editors;
