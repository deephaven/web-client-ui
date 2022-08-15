import { PanelComponent } from '@deephaven/dashboard';
import { LinkColumn } from '../linker/LinkerUtils';

export type ColumnSelectionValidator = (
  panel: PanelComponent,
  tableColumn?: Partial<LinkColumn>
) => boolean;
