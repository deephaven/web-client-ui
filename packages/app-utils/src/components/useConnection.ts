import { useContext } from 'react';
import { ConnectionContext } from './ConnectionBootstrap';

export function useConnection() {
  const connection = useContext(ConnectionContext);
  if (connection == null) {
    throw new Error(
      'No IdeConnection available in useConnection. Was code wrapped in ConnectionBootstrap or ConnectionContext.Provider?'
    );
  }
  return connection;
}

export default useConnection;
