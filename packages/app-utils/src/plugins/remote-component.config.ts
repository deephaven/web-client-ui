/* eslint-disable global-require */
/**
 * remote-component.config.js
 *
 * Dependencies for Remote Components
 */
import react from 'react';
import * as redux from 'redux';
import * as reactRedux from 'react-redux';
import ReactDOM from 'react-dom';

// eslint-disable-next-line import/prefer-default-export
export const resolve = {
  react,
  'react-dom': ReactDOM,
  redux,
  'react-redux': reactRedux,
};
