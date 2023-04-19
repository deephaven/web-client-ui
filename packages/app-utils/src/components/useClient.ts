import { useContext } from 'react';
import { ClientContext } from './ClientBootstrap';

export function useClient() {
  const client = useContext(ClientContext);
  if (client == null) {
    throw new Error(
      'No Client available in useClient. Was code wrapped in ClientBootstrap or ClientContext.Provider?'
    );
  }
  return client;
}

export default useClient;
