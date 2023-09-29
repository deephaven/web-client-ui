import { useEffect, useRef } from 'react';

/**
 * Returns a ref which tracks whether the component is mounted or not.
 */
export function useIsMountedRef(): React.MutableRefObject<boolean> {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

export default useIsMountedRef;
