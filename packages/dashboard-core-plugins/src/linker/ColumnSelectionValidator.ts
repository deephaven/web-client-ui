import { PanelComponent } from '@deephaven/dashboard';

export type LinkColumnSelection = { name: string; type?: string };

export type ColumnSelectionValidator = (
  panel: PanelComponent,
  tableColumn?: LinkColumnSelection
) => boolean;
