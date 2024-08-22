import { ValueOf } from '@deephaven/utils';
import TabEvent from './TabEvent';

export type TabEventType = ValueOf<typeof TabEvent>;

export interface TabEventMap
  extends Record<TabEventType, (...args: never[]) => void> {
  [TabEvent.focus]: () => void;
  [TabEvent.blur]: () => void;
}

export default TabEventMap;
