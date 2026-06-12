import React, { useEffect, useState } from 'react';
import './LazyExampleContent.scss';

interface LazyExampleContentProps {
  fetch: () => Promise<unknown>;
}

/**
 * Heavier content for the example plugin, loaded lazily via dynamic import.
 * Importing the SCSS here ensures the compiled CSS travels with this chunk and
 * is injected only once the chunk is loaded.
 */
function LazyExampleContent({
  fetch,
}: LazyExampleContentProps): React.ReactElement {
  const [widgetType, setWidgetType] = useState<string>('loading…');

  useEffect(() => {
    let cancelled = false;
    fetch()
      .then(widget => {
        if (!cancelled) {
          setWidgetType(
            (widget as { type?: string })?.type ?? 'unknown widget'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWidgetType('failed to fetch widget');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetch]);

  return (
    <div className="dh-example-plugin-card">
      <h3 className="dh-example-plugin-card__title">Lazy-loaded content</h3>
      <p>
        This component and its styling were dynamically imported. The widget
        type is: <strong>{widgetType}</strong>
      </p>
    </div>
  );
}

export default LazyExampleContent;
