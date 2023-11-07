import { useContext } from 'react';
import LayoutManager from '@deephaven/golden-layout';
import LayoutManagerContext from './LayoutManagerContext';

/**
 * Retrieve the current LayoutManager from the context
 */
function useLayoutManager(): LayoutManager {
  const layout = useContext(LayoutManagerContext);
  if (layout == null) {
    throw new Error(
      'Layout not available, did you add a LayoutManagerContext.Provider to the tree?'
    );
  }
  return layout;
}

export default useLayoutManager;
