import { Button } from '@deephaven/components';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { IrisGridEvent, WidgetPanel } from '@deephaven/dashboard-core-plugins';
import { Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { IrisGridModelFactory } from '@deephaven/redux/node_modules/@deephaven/iris-grid';
import React, { ReactNode } from 'react';
import ReactJson from 'react-json-view';
import './ServerWidgetPanel.scss';

const log = Log.module('ServerWidgetPanel');

type StateProps = {
  makeModel: () => Promise<JsWidget>;
  metadata: {
    name: string;
  };
};

type OwnProps = DashboardPanelProps;

export type JsExportedObjectType = 'Table' | 'TableMap';

export type JsWidget = {
  data: string;
  type: string;
  exportedObjectTypes: JsExportedObjectType[];
  getTable: (index: number) => Promise<Table>;
};

export type ServerWidgetPanelProps = OwnProps & StateProps;

export type ServerWidgetPanelState = {
  error?: Error;
  model?: JsWidget;
};

/**
 * Panel for showing a widget from the server in a Dashboard.
 */
export class ServerWidgetPanel extends React.Component<
  ServerWidgetPanelProps,
  ServerWidgetPanelState
> {
  static COMPONENT = 'ServerWidgetPanel';

  constructor(props: ServerWidgetPanelProps) {
    super(props);

    this.handleError = this.handleError.bind(this);
    this.handleExportedTypeClick = this.handleExportedTypeClick.bind(this);

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
      const model = await makeModel();
      this.setState({ model });
    } catch (e: unknown) {
      this.handleError(e as Error);
    }
  }

  handleExportedTypeClick(type: JsExportedObjectType, index: number): void {
    log.debug('handleExportedTypeClick', type, index);

    if (type === 'Table') {
      log.debug('Opening table', index);

      const { glEventHub, metadata } = this.props;
      const { name } = metadata;
      const { model } = this.state;
      glEventHub.emit(
        IrisGridEvent.OPEN_GRID,
        `${name} Table ${index}`,
        async () => {
          const table = await model?.getTable(index);
          return IrisGridModelFactory.makeModel(table, true);
        }
      );
    } else {
      log.error('Unable to handle exported object type', type);
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
    const modelJson = model ? JSON.parse(atob(model.data)) : undefined;

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
          {model ? (
            <div className="server-widget-exported-tables">
              Exported Types:
              {model.exportedObjectTypes.map((type, index) => (
                <Button
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  kind="ghost"
                  onClick={() => this.handleExportedTypeClick(type, index)}
                >
                  {type} {index}
                </Button>
              ))}
            </div>
          ) : null}
          {modelJson && <ReactJson src={modelJson} theme="monokai" />}
        </div>
      </WidgetPanel>
    );
  }
}

export default ServerWidgetPanel;
