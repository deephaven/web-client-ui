import { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { useEffect, useState } from 'react';
import { useObjectFetch } from './useObjectFetch';

const log = Log.module('useWidget');

/**
 * Wrapper object for a widget and error status. Both widget and error will be `null` if it is still loading.
 */
type WidgetWrapper<T extends dh.Widget = dh.Widget> = {
  /** Widget object to retrieve */
  widget: T | null;

  /** Error status if there was an issue fetching the widget */
  error: unknown | null;
};

/**
 * Retrieve a widget for the given variable descriptor. Note that if the widget is successfully fetched, ownership of the widget is passed to the consumer and will need to close the object as well.
 * @param descriptor Descriptor to get the widget for
 * @returns A WidgetWrapper object that contains the widget or an error status if there was an issue fetching the widget. Will contain nulls if still loading.
 */
export function useWidget<T extends dh.Widget = dh.Widget>(
  descriptor: dh.ide.VariableDescriptor
): WidgetWrapper<T> {
  const [wrapper, setWrapper] = useState<WidgetWrapper<T>>(() => ({
    widget: null,
    error: null,
  }));

  const objectFetch = useObjectFetch<T>(descriptor);

  useEffect(
    function loadWidget() {
      log.debug('loadWidget', descriptor);

      const { fetch, error } = objectFetch;

      if (error != null) {
        // We can't fetch if there's an error getting the fetcher, just return an error
        setWrapper({ widget: null, error });
        return;
      }

      if (fetch == null) {
        // Still loading
        setWrapper({ widget: null, error: null });
        return;
      }

      let isCancelled = false;
      async function loadWidgetInternal() {
        try {
          assertNotNull(fetch);
          const newWidget = await fetch();
          if (isCancelled) {
            log.debug2('loadWidgetInternal cancelled', descriptor, newWidget);
            newWidget.close();
            newWidget.exportedObjects.forEach(
              (exportedObject: dh.WidgetExportedObject) => {
                exportedObject.close();
              }
            );
            return;
          }
          log.debug('loadWidgetInternal done', descriptor, newWidget);

          setWrapper({ widget: newWidget, error: null });
        } catch (e) {
          if (isCancelled) {
            return;
          }
          log.error('loadWidgetInternal error', descriptor, e);
          setWrapper({ widget: null, error: e });
        }
      }
      loadWidgetInternal();
      return () => {
        isCancelled = true;
      };
    },
    [descriptor, objectFetch]
  );

  return wrapper;
}

export default useWidget;
