import { PanelComponent } from '@deephaven/dashboard';
import { LinkColumn } from './LinkerUtils';

export type ColumnSelectionValidator = (
  panel: PanelComponent,
  tableColumn?: LinkColumn
) => boolean;
