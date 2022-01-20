import { DashboardPanelProps } from '@deephaven/dashboard';
import { WidgetPanel } from '@deephaven/dashboard-core-plugins';
import Log from '@deephaven/log';
import React, { ReactNode } from 'react';

const log = Log.module('ServerWidgetPanel');

type StateProps = {
  makeModel: () => Promise<unknown>;
  metadata: {
    name: string;
  };
};

type OwnProps = DashboardPanelProps;

export type ServerWidgetPanelProps = OwnProps & StateProps;

export type ServerWidgetPanelState<T = unknown> = {
  error?: Error;
  model?: T;
};

/**
 * Panel for showing a widget from the server in a Dashboard.
 */
export class ServerWidgetPanel<T = unknown> extends React.Component<
  ServerWidgetPanelProps,
  ServerWidgetPanelState<T>
> {
  static COMPONENT = 'ServerWidgetPanel';

  constructor(props: ServerWidgetPanelProps) {
    super(props);

    this.handleError = this.handleError.bind(this);

    this.state = {
      error: undefined,
      model: undefined,
    };
  }

  componentDidMount(): void {
    this.initModel();
  }

  async initModel(): Promise<void> {
    try {
      const { makeModel } = this.props;
      const model = (await makeModel()) as T;
      this.setState({ model });
    } catch (e: unknown) {
      this.handleError(e as Error);
    }
  }

  handleError(error: Error): void {
    log.error(error);
    this.setState({ error, model: undefined });
  }

  render(): ReactNode {
    const { glContainer, glEventHub, metadata } = this.props;
    const { name } = metadata;
    const { error, model } = this.state;
    const isLoading = error === undefined && model === undefined;
    const isLoaded = model !== undefined;
    const errorMessage = error ? `${error}` : undefined;

    return (
      <WidgetPanel
        errorMessage={errorMessage}
        isLoading={isLoading}
        isLoaded={isLoaded}
        className="server-widget-panel"
        glContainer={glContainer}
        glEventHub={glEventHub}
        widgetName={name}
        componentPanel={this}
      >
        <div className="server-widget-panel-content">
          Model content: {model}
        </div>
      </WidgetPanel>
    );
  }
}

export default ServerWidgetPanel;
