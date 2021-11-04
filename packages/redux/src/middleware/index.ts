import thunk from 'redux-thunk';
import logger from './logger';
import crashReporter from './crashReporter';

export default [logger, crashReporter, thunk];
