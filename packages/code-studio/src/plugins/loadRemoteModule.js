/* eslint-disable global-require */
import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';

const dependencies = {
  react: require('react'),
  reactstrap: require('reactstrap'),
};

const requires = createRequires(dependencies);
export default createLoadRemoteModule({ requires });
