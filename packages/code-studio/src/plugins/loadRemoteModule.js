import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';
import { resolve } from '../remote-component.config';

const requires = createRequires(resolve);

export const loadRemoteModule = createLoadRemoteModule({ requires });

export default loadRemoteModule;
