import { Shortcut } from '@deephaven/components';
import { IconDefinition } from '@deephaven/icons';

export type ItemAction = {
  title: string;
  description: string;
  icon: IconDefinition;
  shortcut?: Shortcut;
  action: () => void;
  group: number;
  order?: number;
};

export type HistoryAction = {
  action: () => void;
  title: string;
  description: string;
  icon: IconDefinition;
  selectionRequired?: boolean;
  className?: string;
};
