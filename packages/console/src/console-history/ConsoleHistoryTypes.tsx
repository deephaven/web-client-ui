import { type CancelablePromise } from '@deephaven/utils';
import type { dh } from '@deephaven/jsapi-types';

export type ConsoleHistoryError =
  | string
  | {
      message: string;
    }
  | undefined;

export interface ConsoleHistoryActionItem {
  command?: string;
  result?: {
    message?: string;
    error?: unknown;
    changes?: dh.ide.VariableChanges;
    serverStartTime?: dh.LongWrapper;
    serverEndTime?: dh.LongWrapper;
  };
  disabledObjects?: string[];
  startTime?: number;
  endTime?: number;
  serverStartTime?: number;
  serverEndTime?: number;
  cancelResult?: () => void;
  wrappedResult?: CancelablePromise<unknown>;
}
