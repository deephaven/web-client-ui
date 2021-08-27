import React, { ComponentType, useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import {
  ConsolePanel,
  CommandHistoryPanel,
  FileExplorerPanel,
  LogPanel,
  NotebookPanel,
} from '../../dashboard/panels';

export const ConsolePlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  useEffect(() => {
    const cleanups = [
      registerComponent(
        ConsolePanel.COMPONENT,
        (ConsolePanel as unknown) as ComponentType
      ),
      registerComponent(
        CommandHistoryPanel.COMPONENT,
        (CommandHistoryPanel as unknown) as ComponentType
      ),
      registerComponent(
        FileExplorerPanel.COMPONENT,
        (FileExplorerPanel as unknown) as ComponentType
      ),
      registerComponent(
        LogPanel.COMPONENT,
        (LogPanel as unknown) as ComponentType
      ),
      registerComponent(
        NotebookPanel.COMPONENT,
        (NotebookPanel as unknown) as ComponentType
      ),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  return <></>;
};

export default ConsolePlugin;
