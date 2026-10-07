import thunk from 'redux-thunk';
import logger from './logger';
import crashReporter from './crashReporter';
import logUser from './logUser';

export default [logger, crashReporter, logUser, thunk];
