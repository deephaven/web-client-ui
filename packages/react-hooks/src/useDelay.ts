import { useEffect, useState } from 'react';

/**
 * Sets a delay, and returns a boolean indicating whether the delay is still active.
 * @param delayMs The delay in milliseconds
 * @returns A boolean indicating whether the delay is still active
 */
export function useDelay(delayMs: number): boolean {
  const [isDelayed, setIsDelayed] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const timeout = setTimeout(() => {
      if (!isCancelled) {
        setIsDelayed(false);
      }
    }, delayMs);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [delayMs]);

  return isDelayed;
}

export default useDelay;
