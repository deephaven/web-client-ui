import { useContextOrThrow } from '@deephaven/react-hooks';
import FileStorage from './FileStorage';
import FileStorageContext from './FileStorageContext';

/**
 * Hook to get the FileStorage instance from the context. Throws if no provider available.
 * @returns FileStorage instance
 */
function useFileStorage(): FileStorage {
  return useContextOrThrow(
    FileStorageContext,
    'No FileStorageContext available. Was code wrapped in a provider?'
  );
}

export default useFileStorage;
