import { useContext } from 'react';
import { ApiContext } from './ApiBootstrap';

export const useApi = () => {
  const dh = useContext(ApiContext);
  if (dh == null) {
    throw new Error(
      'No API available in useApi. Was code wrapped in ApiBootstrap or ApiContext.Provider?'
    );
  }
  return dh;
};

export default useApi;
