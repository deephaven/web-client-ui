import { useContext } from 'react';
import GoldenLayout from '@deephaven/golden-layout';
import LayoutContext from './LayoutContext';

/**
 * Retrieve the current layout from the context
 */
function useLayoutManager(): GoldenLayout {
  const layout = useContext(LayoutContext);
  if (layout == null) {
    throw new Error(
      'Layout not available, did you add a LayoutContext.Provider to the tree?'
    );
  }
  return layout;
}

export default useLayoutManager;
