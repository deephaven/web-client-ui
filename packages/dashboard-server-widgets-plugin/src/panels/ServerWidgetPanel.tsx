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

export type JsWidgetExportedObject = {
  type: 'Table' | 'TableMap';
  fetch: () => Promise<unknown>;
};

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
  exportedObjects: JsWidgetExportedObject[];
};

export type ServerWidgetPanelProps = OwnProps & StateProps;

export type ServerWidgetPanelState = {
  error?: Error;
  model?: JsWidget;
  value?: string; // Big Display value
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
      // KLUDGE: This is just hacking in a proof of concept
      if (model.type === 'deephaven.plugin.big_display.BigDisplay') {
        const table = (await model.exportedObjects[0].fetch()) as Table;
        table.addEventListener('updated', event => {
          const { detail: data } = event;
          const row = data.rows[0];
          const column = data.columns[0];
          const rawValue = row.get(column);
          const value = dh.i18n.DateTimeFormat.format(
            'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
            rawValue
          );
          this.setState({ value });
        });
        table.setViewport(0, 0);
      }
      this.setState({ model });
    } catch (e: unknown) {
      this.handleError(e as Error);
    }
  }

  handleExportedTypeClick(
    exportedObject: JsWidgetExportedObject,
    index: number
  ): void {
    log.debug('handleExportedTypeClick', exportedObject, index);

    const { type } = exportedObject;
    if (type === 'Table') {
      log.debug('Opening table', index);

      const { glEventHub, metadata } = this.props;
      const { name } = metadata;
      glEventHub.emit(
        IrisGridEvent.OPEN_GRID,
        `${name} ${type} ${index}`,
        async () => {
          const table = await exportedObject.fetch();
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
    const { error, model, value } = this.state;
    const isLoading = error === undefined && model === undefined;
    const isLoaded = model !== undefined;
    const errorMessage = error ? `${error}` : undefined;
    const modelJson =
      model?.type === 'deephaven.plugin.json.Node'
        ? JSON.parse(atob(model.getDataAsBase64()))
        : undefined;

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
              {model.exportedObjects.map((exportedObject, index) => (
                <Button
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  kind="ghost"
                  onClick={() =>
                    this.handleExportedTypeClick(exportedObject, index)
                  }
                >
                  {exportedObject.type} {index}
                </Button>
              ))}
            </div>
          ) : null}
          {modelJson && <ReactJson src={modelJson} theme="monokai" />}
          {value && <div className="big-display">{value}</div>}
        </div>
      </WidgetPanel>
    );
  }
}

export default ServerWidgetPanel;
