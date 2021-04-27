// These imports directly from dist/lib will possibly break if the version is updated
// They are used to suppress a dev server warning that is given if using the normal import from the docs
import { createRemoteComponent } from '@paciolan/remote-component/dist/lib/createRemoteComponent';
import { createRequires } from '@paciolan/remote-component/dist/lib/createRequires';
import { resolve } from '../remote-component.config';

const requires = createRequires(resolve);

export const RemoteComponent = createRemoteComponent({ requires });
export default RemoteComponent;
