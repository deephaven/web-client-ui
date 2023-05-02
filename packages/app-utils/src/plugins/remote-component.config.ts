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
import * as DeephavenAuthPlugins from '@deephaven/auth-plugins';
import * as DeephavenComponents from '@deephaven/components';
import * as DeephavenJsapiBootstrap from '@deephaven/jsapi-bootstrap';
import * as DeephavenJsapiComponents from '@deephaven/jsapi-components';
import * as DeephavenJsapiUtils from '@deephaven/jsapi-utils';
import * as DeephavenLog from '@deephaven/log';
import * as DeephavenReactHooks from '@deephaven/react-hooks';

// eslint-disable-next-line import/prefer-default-export
export const resolve = {
  react,
  'react-dom': ReactDOM,
  redux,
  'react-redux': reactRedux,
  '@deephaven/auth-plugins': DeephavenAuthPlugins,
  '@deephaven/components': DeephavenComponents,
  '@deephaven/jsapi-bootstrap': DeephavenJsapiBootstrap,
  '@deephaven/jsapi-components': DeephavenJsapiComponents,
  '@deephaven/jsapi-utils': DeephavenJsapiUtils,
  '@deephaven/log': DeephavenLog,
  '@deephaven/react-hooks': DeephavenReactHooks,
};
