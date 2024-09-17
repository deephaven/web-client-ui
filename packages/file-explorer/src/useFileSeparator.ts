import useFileStorage from './useFileStorage';

/**
 * Get the file separator used in this file system
 * @returns File separator used in this file system
 */
function useFileSeparator(): string {
  return useFileStorage().separator;
}

export default useFileSeparator;
