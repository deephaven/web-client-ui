import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';
import { resolve } from './remote-component.config';

const requires = createRequires(resolve);

export const loadRemoteModule: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (url: string): Promise<any>;
} = createLoadRemoteModule({
  requires,
});

export default loadRemoteModule;
