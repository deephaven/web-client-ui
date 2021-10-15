import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';

const dependencies = {
  react: require('react'),
};

const requires = createRequires(dependencies);
export default createLoadRemoteModule({ requires });
