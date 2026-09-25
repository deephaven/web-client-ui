import React, { Suspense, useState } from 'react';
import { Button } from '@deephaven/components';
import type { WidgetComponentProps } from '@deephaven/plugin';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/plugin-example.ExampleWidgetView');

// Lazy-load the heavier view (and its SCSS) on demand. Vite emits this as a
// separate chunk that is only fetched when the user reveals it, demonstrating
// code splitting of a remotely-loaded ES module plugin. The chunk's compiled
// CSS is injected via JS (vite-plugin-css-injected-by-js) when the chunk loads.
const LazyExampleContent = React.lazy(() => import('./LazyExampleContent'));

/**
 * Entry component for the example widget plugin. Renders immediately, then
 * lazy-loads the styled content chunk when requested.
 */
function ExampleWidgetView({
  fetch,
}: WidgetComponentProps): React.ReactElement {
  const [showContent, setShowContent] = useState(false);

  return (
    <div style={{ padding: 16 }}>
      <h2>Example ES module plugin</h2>
      <p>
        This plugin is a modern ES module loaded remotely. Click below to
        lazy-load a styled component chunk on demand.
      </p>
      <Button
        kind="primary"
        onClick={() => {
          log.info('Loading lazy content chunk');
          setShowContent(true);
        }}
      >
        Load lazy content
      </Button>
      {showContent && (
        <Suspense fallback={<div>Loading…</div>}>
          <LazyExampleContent fetch={fetch} />
        </Suspense>
      )}
    </div>
  );
}

export default ExampleWidgetView;
