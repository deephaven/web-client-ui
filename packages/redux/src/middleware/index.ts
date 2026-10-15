import thunk from 'redux-thunk';
import logger from './logger';
import crashReporter from './crashReporter';
import logUser from './logUser';

// logUser runs first so actions are logged under the user they establish
export default [logUser, logger, crashReporter, thunk];
