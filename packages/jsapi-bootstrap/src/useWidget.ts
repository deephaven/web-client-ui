import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { useEffect, useMemo, useState } from 'react';
import { useObjectFetch } from './useObjectFetch';
import { type UriVariableDescriptor } from './useObjectFetcher';
import useDeferredApi from './useDeferredApi';
import useApi from './useApi';

const log = Log.module('useWidget');

/**
 * Types of widgets that can be fetched with this hook.
 */
export type WidgetTypes =
  | dh.Table
  | dh.TreeTable
  | dh.PartitionedTable
  | dh.plot.Figure
  | dh.Widget;

/**
 * Wrapper object for a widget and error status. Both widget and error will be `null` if it is still loading.
 */
export type WidgetWrapper<T extends WidgetTypes = dh.Widget> = {
  /** Widget object to retrieve */
  widget: T | null;

  /** Deephaven JS API to use for this widget */
  api: typeof dh | null;

  /** Error status if there was an issue fetching the widget */
  error: NonNullable<unknown> | null;
};

/**
 * Retrieve a widget for the given variable descriptor. Note that if the widget is successfully fetched, ownership of the widget is passed to the consumer and will need to close the object as well.
 * @param descriptor Descriptor or URI to get the widget for. Should be stable to avoid infinite re-fetching.
 * @returns A WidgetWrapper object that contains the widget and JS API, or an error status if there was an issue fetching the widget. Will contain nulls if still loading.
 */
export function useWidget<T extends WidgetTypes = dh.Widget>(
  descriptor: dh.ide.VariableDescriptor | UriVariableDescriptor
): WidgetWrapper<T> {
  const [wrapper, setWrapper] = useState<
    Omit<WidgetWrapper<T>, 'api' | 'ApiProvider'>
  >(() => ({
    widget: null,
    error: null,
  }));
  const objectFetch = useObjectFetch<T>(descriptor);
  const [descriptorApi, descriptorApiError] = useDeferredApi(descriptor);
  const defaultApi = useApi();

  const api = descriptorApi ?? defaultApi;

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
              newWidget.exportedObjects.forEach(exportedObject => {
                exportedObject.close();
              });
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

  const wrapperWithApi = useMemo(
    () => ({
      ...wrapper,
      error: wrapper.error ?? descriptorApiError,
      api: wrapper.widget != null ? api : null,
    }),
    [wrapper, api, descriptorApiError]
  );

  return wrapperWithApi;
}

export default useWidget;
