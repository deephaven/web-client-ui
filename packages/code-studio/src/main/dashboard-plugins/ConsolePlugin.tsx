import React, { ComponentType, useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import {
  ConsolePanel,
  CommandHistoryPanel,
  FileExplorerPanel,
  LogPanel,
} from '../../dashboard/panels';

export const ConsolePlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const hydrate = useCallback(
    props => ({
      ...props,
      localDashboardId: id,
    }),
    [id]
  );

  const hydrateWithMetadata = useCallback(
    props => ({
      metadata: {},
      ...props,
      localDashboardId: id,
    }),
    [id]
  );

  // TODO: Actually dehydrate correctly
  const dehydrate = useCallback(props => null, []);

  const registerComponents = useCallback(() => {
    registerComponent(
      ConsolePanel.COMPONENT,
      (ConsolePanel as unknown) as ComponentType,
      hydrateWithMetadata,
      dehydrate
    );
    registerComponent(
      CommandHistoryPanel.COMPONENT,
      (CommandHistoryPanel as unknown) as ComponentType,
      hydrate,
      dehydrate
    );
    registerComponent(
      FileExplorerPanel.COMPONENT,
      (FileExplorerPanel as unknown) as ComponentType,
      hydrate,
      dehydrate
    );
    registerComponent(
      LogPanel.COMPONENT,
      (LogPanel as unknown) as ComponentType,
      hydrate,
      dehydrate
    );
  }, [dehydrate, hydrate, hydrateWithMetadata, registerComponent]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return <></>;
};

export default ConsolePlugin;
