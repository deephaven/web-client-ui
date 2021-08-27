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
  const registerComponents = useCallback(() => {
    registerComponent(
      ConsolePanel.COMPONENT,
      (ConsolePanel as unknown) as ComponentType
    );
    registerComponent(
      CommandHistoryPanel.COMPONENT,
      (CommandHistoryPanel as unknown) as ComponentType
    );
    registerComponent(
      FileExplorerPanel.COMPONENT,
      (FileExplorerPanel as unknown) as ComponentType
    );
    registerComponent(
      LogPanel.COMPONENT,
      (LogPanel as unknown) as ComponentType
    );
    registerComponent(
      NotebookPanel.COMPONENT,
      (NotebookPanel as unknown) as ComponentType
    );
  }, [registerComponent]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return <></>;
};

export default ConsolePlugin;
