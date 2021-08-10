import React, { ComponentType, useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import {
  CommandHistoryPanel,
  ConsolePanel,
  DropdownFilterPanel,
  FileExplorerPanel,
  InputFilterPanel,
  LogPanel,
  MarkdownPanel,
  NotebookPanel,
  PandasPanel,
} from '../../dashboard/panels';
import Linker from '../../dashboard/linker/Linker';
import GridPlugin from './GridPlugin';
import ChartPlugin from './ChartPlugin';

export const DashboardCorePlugin = ({
  id,
  layout,
  panelManager,
  registerComponent,
}: DashboardPluginComponentProps): React.ReactNode => {
  const hydrateWithMetadata = useCallback(
    props => ({
      metadata: {},
      ...props,
      localDashboardId: id,
    }),
    [id]
  );
  const hydrateDefault = useCallback(
    props => ({
      ...props,
      localDashboardId: id,
    }),
    [id]
  );
  // TODO: Actually dehydrate correctly
  const dehydrateDefault = useCallback(props => null, []);

  const registerComponents = useCallback(() => {
    registerComponent(
      ConsolePanel.COMPONENT,
      (ConsolePanel as unknown) as ComponentType,
      hydrateWithMetadata,
      dehydrateDefault
    );
    registerComponent(
      CommandHistoryPanel.COMPONENT,
      (CommandHistoryPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      DropdownFilterPanel.COMPONENT,
      (DropdownFilterPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      FileExplorerPanel.COMPONENT,
      (FileExplorerPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      InputFilterPanel.COMPONENT,
      (InputFilterPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      LogPanel.COMPONENT,
      (LogPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      MarkdownPanel.COMPONENT,
      (MarkdownPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      NotebookPanel.COMPONENT,
      (NotebookPanel as unknown) as ComponentType,
      hydrateDefault,
      dehydrateDefault
    );
    registerComponent(
      PandasPanel.COMPONENT,
      PandasPanel,
      hydrateDefault,
      dehydrateDefault
    );
  }, [
    dehydrateDefault,
    hydrateDefault,
    hydrateWithMetadata,
    registerComponent,
  ]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return (
    <>
      <GridPlugin
        layout={layout}
        id={id}
        panelManager={panelManager}
        registerComponent={registerComponent}
      />
      <ChartPlugin
        layout={layout}
        id={id}
        panelManager={panelManager}
        registerComponent={registerComponent}
      />
      <Linker
        layout={layout}
        localDashboardId={id}
        panelManager={panelManager}
      />
    </>
  );
};

export default DashboardCorePlugin;
