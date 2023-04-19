// These imports directly from dist/lib will possibly break if the version is updated
// They are used to suppress a dev server warning that is given if using the normal import from the docs
import {
  createRemoteComponent,
  createRequires,
} from '@paciolan/remote-component';
import { resolve } from './remote-component.config';

const requires = createRequires(() => resolve);

export const RemoteComponent = createRemoteComponent({ requires });
export default RemoteComponent;
