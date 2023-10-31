import { useOptionalListener } from '@deephaven/dashboard';
import { EventEmitter } from '@deephaven/golden-layout';
import InputFilterEvent, {
  onClearAllFilters,
} from '../events/InputFilterEvent';

/**
 * Element that listens for InputFilterEvents. Can be used in class components.
 *
 * Render the element, pass in the event hub and listener.
 */
interface InputFilterEventListenerProps {
  eventHub: EventEmitter;
  onClearAllFilters?: typeof onClearAllFilters;
}

export function InputFilterEventListener({
  eventHub,
  onClearAllFilters: onClearAllFiltersProp,
}: InputFilterEventListenerProps): React.ReactNode {
  useOptionalListener<Parameters<typeof onClearAllFilters>>(
    eventHub,
    InputFilterEvent.CLEAR_ALL_FILTERS,
    onClearAllFiltersProp
  );
  return null;
}

export default InputFilterEventListener;
