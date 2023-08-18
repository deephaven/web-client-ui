import { RowDataMap } from '@deephaven/jsapi-utils';
import { IrisGridPanel } from '../panels/IrisGridPanel';

export type IrisGridDataSelectedEventCallback = (
  panel: IrisGridPanel,
  data: RowDataMap
) => void;

export class IrisGridEvent {
  /** @deprecated Use PanelEvent.OPEN instead */
  static OPEN_GRID = 'IrisGridEvent.OPEN_GRID';

  /** @deprecated Use PanelEvent.CLOSE instead */
  static CLOSE_GRID = 'IrisGridEvent.CLOSE_GRID';

  static DATA_SELECTED = 'IrisGridEvent.DATA_SELECTED';

  static COLUMN_SELECTED = 'IrisGridEvent.COLUMN_SELECTED';

  static STATE_CHANGED = 'IrisGridEvent.STATE_CHANGED';

  static CREATE_CHART = 'IrisGridevent.CREATE_CHART';
}

export default IrisGridEvent;
