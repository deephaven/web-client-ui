import { useContext } from 'react';
import LayoutManager from '@deephaven/golden-layout';
import LayoutManagerContext from './LayoutManagerContext';

/**
 * Retrieve the current LayoutManager from the context
 */
function useLayoutManager(): LayoutManager {
  const layoutManager = useContext(LayoutManagerContext);
  if (layoutManager == null) {
    throw new Error(
      'LayoutManager not available, did you add a LayoutManagerContext.Provider to the tree?'
    );
  }
  return layoutManager;
}

export default useLayoutManager;
