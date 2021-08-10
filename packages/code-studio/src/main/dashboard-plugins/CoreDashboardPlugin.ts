import { ComponentType } from 'react';
import {
  setDashboardColumns,
  setDashboardConsoleCreatorSettings,
  setDashboardInputFilters,
  setDashboardPanelTableMap,
  store,
} from '@deephaven/redux';
import MarkdownUtils from '../../controls/markdown/MarkdownUtils';
import {
  DashboardConfig,
  DashboardPlugin,
  PanelConfig,
  PanelProps,
} from '../../dashboard/DashboardPlugin';
import {
  ChartEventHandler,
  ConsoleEventHandler,
  ControlEventHandler,
  InputFilterEventHandler,
  IrisGridEventHandler,
  NotebookEventHandler,
  PandasEventHandler,
} from '../../dashboard/event-handlers';
import {
  ChartPanel,
  CommandHistoryPanel,
  ConsolePanel,
  DropdownFilterPanel,
  FileExplorerPanel,
  InputFilterPanel,
  IrisGridPanel,
  LogPanel,
  MarkdownPanel,
  NotebookPanel,
  PandasPanel,
} from '../../dashboard/panels';

type CoreDashboardPluginEventHandler = {
  stopListening: () => void;
};

type ComponentTemplateConfig = {
  props: Record<string, unknown>;
  title: string;
};

type MarkdownComponentState = {
  panelState?: { content: string } | null;
};

class CoreDashboardPlugin implements DashboardPlugin {
  localDashboardId = '';

  panels = [
    {
      name: ChartPanel.COMPONENT,
      definition: (ChartPanel as unknown) as ComponentType,
    },
    { name: ConsolePanel.COMPONENT, definition: ConsolePanel as ComponentType },
    {
      name: CommandHistoryPanel.COMPONENT,
      definition: CommandHistoryPanel as ComponentType,
    },
    {
      name: DropdownFilterPanel.COMPONENT,
      definition: (DropdownFilterPanel as unknown) as ComponentType,
    },
    {
      name: FileExplorerPanel.COMPONENT,
      definition: FileExplorerPanel,
    },
    {
      name: InputFilterPanel.COMPONENT,
      definition: (InputFilterPanel as unknown) as ComponentType,
    },
    {
      name: IrisGridPanel.COMPONENT,
      definition: (IrisGridPanel as unknown) as ComponentType,
    },
    { name: LogPanel.COMPONENT, definition: LogPanel },
    { name: NotebookPanel.COMPONENT, definition: NotebookPanel },
    { name: PandasPanel.COMPONENT, definition: PandasPanel },
    {
      name: MarkdownPanel.COMPONENT,
      definition: (MarkdownPanel as unknown) as ComponentType,
    },
  ];

  eventHandlers: CoreDashboardPluginEventHandler[] = [];

  initialize(dashboardConfig: DashboardConfig): void {
    const { id, layout, panelManager } = dashboardConfig;

    this.localDashboardId = id;

    function makeComponentTemplate(config: ComponentTemplateConfig) {
      // Just a default that populates the localDashboardId prop properly
      return {
        ...config,
        props: {
          ...config.props,
          localDashboardId: id,
        },
      };
    }

    function makeMarkdownTemplate(config: ComponentTemplateConfig) {
      const openedMarkdowns = panelManager.getOpenedPanelConfigsOfType(
        ControlEventHandler.MARKDOWN_COMPONENT
      );
      const closedMarkdowns = panelManager.getClosedPanelConfigsOfType(
        ControlEventHandler.MARKDOWN_COMPONENT
      );
      const usedTitles = openedMarkdowns.map(markdown => markdown.title);
      const title = MarkdownUtils.getNewMarkdownTitle(usedTitles);
      const content =
        closedMarkdowns.length > 0 ? null : MarkdownUtils.DEFAULT_CONTENT;
      return makeComponentTemplate({
        ...config,
        props: {
          ...config.props,
          panelState: { content },
        },
        title,
      });
    }

    this.eventHandlers.push(new IrisGridEventHandler(layout, id));
    this.eventHandlers.push(new ChartEventHandler(layout, id));
    this.eventHandlers.push(
      new ControlEventHandler(layout, {
        DropdownFilterPanel: (config: ComponentTemplateConfig) =>
          makeComponentTemplate(config),
        InputFilterPanel: (config: ComponentTemplateConfig) =>
          makeComponentTemplate(config),
        MarkdownPanel: (config: ComponentTemplateConfig) =>
          makeMarkdownTemplate(config),
      })
    );
    this.eventHandlers.push(
      new InputFilterEventHandler(
        layout,
        ({
          columns,
          filters,
          tableMap,
        }: {
          columns: unknown;
          filters: unknown;
          tableMap: unknown;
        }) => {
          store.dispatch(setDashboardColumns(this.localDashboardId, columns));
          store.dispatch(
            setDashboardInputFilters(this.localDashboardId, filters)
          );
          store.dispatch(
            setDashboardPanelTableMap(this.localDashboardId, tableMap)
          );
        }
      )
    );
    this.eventHandlers.push(
      new ConsoleEventHandler(
        layout,
        panelManager,
        ({ consoleCreatorSettings }: { consoleCreatorSettings: unknown }) => {
          store.dispatch(
            setDashboardConsoleCreatorSettings(
              this.localDashboardId,
              consoleCreatorSettings
            )
          );
        }
      )
    );
    this.eventHandlers.push(new NotebookEventHandler(layout, panelManager));
    this.eventHandlers.push(new PandasEventHandler(layout, id));
  }

  deinitialize(dashboardConfig: DashboardConfig): void {
    for (let i = 0; i < this.eventHandlers.length; i += 1) {
      const handler = this.eventHandlers[i];
      handler.stopListening();
    }
    this.eventHandlers = [];
  }

  hydrateComponent(name: string, props: PanelProps): PanelProps {
    switch (name) {
      case ConsolePanel.COMPONENT:
      case CommandHistoryPanel.COMPONENT:
        return {
          metadata: {},
          ...props,
          localDashboardId: this.localDashboardId,
        };
      case ChartPanel.COMPONENT:
      case DropdownFilterPanel.COMPONENT:
      case InputFilterPanel.COMPONENT:
      case IrisGridPanel.COMPONENT:
      case PandasPanel.COMPONENT:
      case MarkdownPanel.COMPONENT:
        return {
          ...props,
          localDashboardId: this.localDashboardId,
        };
      default:
        return props;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  dehydrateComponent(name: string, config: PanelConfig): PanelConfig | null {
    switch (name) {
      case MarkdownPanel.COMPONENT:
        {
          const { title, componentState, props } = config;
          let { panelState = null }: MarkdownComponentState = props;
          if (componentState) {
            ({ panelState = null } = componentState as MarkdownComponentState);
          }
          if (
            !title ||
            !panelState ||
            !panelState.content ||
            panelState.content.length === 0 ||
            panelState.content === MarkdownUtils.DEFAULT_CONTENT
          ) {
            // We don't want to save it if there's no content
            return null;
          }
        }
        break;
      case ChartPanel.COMPONENT:
      case ConsolePanel.COMPONENT:
      case CommandHistoryPanel.COMPONENT:
      case DropdownFilterPanel.COMPONENT:
      case IrisGridPanel.COMPONENT:
      case InputFilterPanel.COMPONENT:
      case LogPanel.COMPONENT:
      case NotebookPanel.COMPONENT:
      case PandasPanel.COMPONENT:
        break;
      default:
        return config;
    }

    const { props, componentState } = config;
    const { metadata } = props;
    let { panelState = null } = props;
    if (componentState) {
      ({ panelState } = componentState);
    }
    const newProps: Record<string, unknown> = {};
    if (metadata) {
      newProps.metadata = metadata;
    }
    if (panelState) {
      newProps.panelState = panelState;
    }

    return {
      ...config,
      componentState: null,
      props: newProps,
      type: 'react-component',
    };
  }
}

export default CoreDashboardPlugin;
