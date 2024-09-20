/**
 * remote-component.config.js
 *
 * Dependencies for Remote Components
 */
import react from 'react';
import * as redux from 'redux';
import * as reactRedux from 'react-redux';
import ReactDOM from 'react-dom';
// eslint-disable-next-line no-restricted-imports
import * as AdobeReactSpectrum from '@adobe/react-spectrum';
import * as DeephavenAuthPlugins from '@deephaven/auth-plugins';
import * as DeephavenChart from '@deephaven/chart';
import * as DeephavenComponents from '@deephaven/components';
import * as DeephavenDashboard from '@deephaven/dashboard';
import * as DeephavenDashboardCorePlugins from '@deephaven/dashboard-core-plugins';
import * as DeephavenIcons from '@deephaven/icons';
import * as DeephavenIrisGrid from '@deephaven/iris-grid';
import * as DeephavenJsapiBootstrap from '@deephaven/jsapi-bootstrap';
import * as DeephavenJsapiComponents from '@deephaven/jsapi-components';
import * as DeephavenJsapiUtils from '@deephaven/jsapi-utils';
import * as DeephavenConsole from '@deephaven/console';
import DeephavenLog from '@deephaven/log';
import * as DeephavenReactHooks from '@deephaven/react-hooks';
import * as DeephavenPlugin from '@deephaven/plugin';

// eslint-disable-next-line import/prefer-default-export
export const resolve = {
  react,
  'react-dom': ReactDOM,
  redux,
  'react-redux': reactRedux,
  '@adobe/react-spectrum': AdobeReactSpectrum,
  '@deephaven/auth-plugins': DeephavenAuthPlugins,
  '@deephaven/chart': DeephavenChart,
  '@deephaven/components': DeephavenComponents,
  '@deephaven/console': DeephavenConsole,
  '@deephaven/dashboard': DeephavenDashboard,
  '@deephaven/dashboard-core-plugins': DeephavenDashboardCorePlugins,
  '@deephaven/icons': DeephavenIcons,
  '@deephaven/iris-grid': DeephavenIrisGrid,
  '@deephaven/jsapi-bootstrap': DeephavenJsapiBootstrap,
  '@deephaven/jsapi-components': DeephavenJsapiComponents,
  '@deephaven/jsapi-utils': DeephavenJsapiUtils,
  '@deephaven/log': DeephavenLog,
  '@deephaven/plugin': DeephavenPlugin,
  '@deephaven/react-hooks': DeephavenReactHooks,
};
