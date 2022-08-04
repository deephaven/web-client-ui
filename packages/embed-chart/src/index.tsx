import React from 'react';
import ReactDOM from 'react-dom';

// Fira fonts are not necessary, but look the best
import 'fira';

// Need to import the base style sheet for proper styling
// eslint-disable-next-line import/no-unresolved
import '@deephaven/components/dist/BaseStyleSheet.css';
import './index.scss';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
