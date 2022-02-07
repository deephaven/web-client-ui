import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';

const dependencies = {
  // eslint-disable-next-line global-require
  react: require('react'),
};

const requires = createRequires(dependencies);
export default createLoadRemoteModule({ requires });
