import { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { useEffect, useMemo, useState } from 'react';
import useApi from './useApi';
import { useObjectFetch } from './useObjectFetch';

const log = Log.module('useWidget');

/**
 * Wrapper object for a widget and error status. Both widget and error will be `null` if it is still loading.
 */
type WidgetWrapper<T extends dh.Widget = dh.Widget> = {
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
export function useWidget<T extends dh.Widget = dh.Widget>(
  descriptor: dh.ide.VariableDescriptor
): WidgetWrapper<T> {
  const [wrapper, setWrapper] = useState<WidgetWrapper<T>>(() => ({
    widget: null,
    error: null,
  }));
  const api = useApi();
  const unsupportedTypes = useMemo(
    () => [
      api.VariableType.TABLE,
      api.VariableType.TREETABLE,
      api.VariableType.HIERARCHICALTABLE,
      api.VariableType.TABLEMAP,
      api.VariableType.PARTITIONEDTABLE,
      api.VariableType.FIGURE,
      api.VariableType.PANDAS,
      api.VariableType.TREEMAP,
    ],
    [api]
  );
  const objectFetch = useObjectFetch<T>(descriptor);

  useEffect(
    function loadWidget() {
      log.debug('loadWidget', descriptor);

      if (unsupportedTypes.includes(descriptor.type)) {
        // We only support fetching widgets with this hook
        setWrapper({
          widget: null,
          error: new Error(`Unsupported descriptor type: ${descriptor.type}`),
        });
        return;
      }

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
          setWrapper({ widget: null, error: e ?? new Error('Null error') });
        }
      }
      loadWidgetInternal();
      return () => {
        isCancelled = true;
      };
    },
    [descriptor, objectFetch, unsupportedTypes]
  );

  return wrapper;
}

export default useWidget;
