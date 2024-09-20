import { type PanelComponent } from '@deephaven/dashboard';
import { type LinkColumn } from './LinkerUtils';

export type ColumnSelectionValidator = (
  panel: PanelComponent,
  tableColumn?: LinkColumn
) => boolean;
