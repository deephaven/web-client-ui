import { useContext } from 'react';
import { ApiContext } from './ApiBootstrap';

export const useApi = () => useContext(ApiContext);

export default useApi;
