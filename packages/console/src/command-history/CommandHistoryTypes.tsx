import { type ContextAction } from '@deephaven/components';
import { type IconDefinition } from '@deephaven/icons';

export type ItemAction = ContextAction & {
  title: string;
  description: string;
  icon: IconDefinition;
  action: () => void;
  group: number;
  order?: number;
};

export type HistoryAction = ContextAction & {
  action: () => void;
  title: string;
  description: string;
  icon: IconDefinition;
  selectionRequired?: boolean;
  className?: string;
};
