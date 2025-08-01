import { useEffect } from 'react';
import { type WidgetTypes } from '@deephaven/jsapi-bootstrap';
import { isClosed } from '@deephaven/jsapi-utils';

/**
 * React hook that closes a given widget when the reference changes or when the
 * component unmounts.
 * @param widget The widget to close
 */
export default function useWidgetClose(
  widget: WidgetTypes | null | undefined
): void {
  useEffect(
    () => () => {
      if (widget == null) {
        return;
      }

      if (!isClosed(widget)) {
        widget.close?.();
      }
    },
    [widget]
  );
}

/**
 * @deprecated Use `useWidgetClose` instead.
 */
export const useTableClose = useWidgetClose;
