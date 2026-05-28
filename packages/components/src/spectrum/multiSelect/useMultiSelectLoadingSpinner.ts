import { useEffect, useRef, useState } from 'react';
import { type LoadingState } from '@react-types/shared';
import { type MenuTriggerAction } from '../comboBox/ComboBox';

const LOADING_DEBOUNCE_MS = 500;

export interface UseMultiSelectLoadingSpinnerOptions {
  loadingState: LoadingState | undefined;
  searchText: string;
  isOpen: boolean;
  menuTrigger: MenuTriggerAction;
}

export function useMultiSelectLoadingSpinner({
  loadingState,
  searchText,
  isOpen,
  menuTrigger,
}: UseMultiSelectLoadingSpinnerOptions): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingForSpinner =
    loadingState === 'loading' || loadingState === 'filtering';
  const lastSearchTextRef = useRef(searchText);

  useEffect(() => {
    if (isLoadingForSpinner && !showLoading) {
      const searchChanged = searchText !== lastSearchTextRef.current;
      if (loadingTimeoutRef.current !== null && searchChanged) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (loadingTimeoutRef.current === null) {
        loadingTimeoutRef.current = setTimeout(() => {
          setShowLoading(true);
        }, LOADING_DEBOUNCE_MS);
      }
    } else if (!isLoadingForSpinner) {
      setShowLoading(false);
      if (loadingTimeoutRef.current != null) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    lastSearchTextRef.current = searchText;
  }, [isLoadingForSpinner, showLoading, searchText]);

  useEffect(
    () => () => {
      if (loadingTimeoutRef.current != null) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    },
    []
  );

  return (
    showLoading &&
    (isOpen || menuTrigger === 'manual' || loadingState === 'loading')
  );
}

export default useMultiSelectLoadingSpinner;
