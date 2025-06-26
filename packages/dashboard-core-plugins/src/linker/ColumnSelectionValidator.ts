import { type PanelComponent } from '@deephaven/dashboard';
import { type LinkPointOptions, type LinkColumn } from './LinkerUtils';

export type ColumnSelectionValidator = (
  panelOrId: PanelComponent | string,
  tableColumn: LinkColumn | undefined,
  options: LinkPointOptions
) => boolean;
