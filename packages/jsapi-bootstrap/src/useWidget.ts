import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { useEffect, useState } from 'react';
import { useObjectFetch } from './useObjectFetch';

const log = Log.module('useWidget');

/**
 * Types of widgets that can be fetched with this hook.
 */
type WidgetTypes =
  | dh.Table
  | dh.TreeTable
  | dh.PartitionedTable
  | dh.plot.Figure
  | dh.Widget;

/**
 * Wrapper object for a widget and error status. Both widget and error will be `null` if it is still loading.
 */
type WidgetWrapper<T extends WidgetTypes = dh.Widget> = {
  /** Widget object to retrieve */
  widget: T | null;

  /** Error status if there was an issue fetching the widget */
  error: NonNullable<unknown> | null;
};

/**
 * Retrieve a widget for the given variable descriptor. Note that if the widget is successfully fetched, ownership of the widget is passed to the consumer and will need to close the object as well.
 * @param descriptor Descriptor to get the widget for. Should be stable to avoid infinite re-fetching.
 * @returns A WidgetWrapper object that contains the widget or an error status if there was an issue fetching the widget. Will contain nulls if still loading.
 */
export function useWidget<T extends WidgetTypes = dh.Widget>(
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

      const { status } = objectFetch;

      if (status === 'error') {
        // We can't fetch if there's an error getting the fetcher, just return an error
        setWrapper({ widget: null, error: objectFetch.error });
        return;
      }

      if (status === 'loading') {
        // Still loading
        setWrapper({ widget: null, error: null });
        return;
      }

      const { fetch } = objectFetch;
      // We should be able to load the widget. Load it asynchronously, and set the widget when it's done.
      // If we get cancelled before the fetch is done, we should close the widget and its exported objects.
      // If not though, the consumer of the widget is expected to take ownership and close the widget appropriately.
      let isCancelled = false;
      async function loadWidgetInternal() {
        try {
          assertNotNull(fetch);
          const newWidget = await fetch();
          if (isCancelled) {
            log.debug2('loadWidgetInternal cancelled', descriptor, newWidget);
            newWidget.close();
            if ('exportedObjects' in newWidget) {
              newWidget.exportedObjects.forEach(
                (exportedObject: dh.WidgetExportedObject) => {
                  exportedObject.close();
                }
              );
            }
            return;
          }
          log.debug('loadWidgetInternal done', descriptor, newWidget);

          setWrapper({ widget: newWidget, error: null });
        } catch (e) {
          if (isCancelled) {
            return;
          }
          log.error('loadWidgetInternal error', descriptor, e);
          setWrapper({ widget: null, error: e ?? new Error('Null error') });
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
