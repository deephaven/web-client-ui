import { Button, LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import React, { ReactNode } from 'react';
import ReactJson from 'react-json-view';
import './ObjectPanel.scss';

const log = Log.module('ObjectPanel');

type StateProps = {
  fetch: () => Promise<unknown>;
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

export type ObjectPanelProps = OwnProps & StateProps;

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
  exportedObjects: JsWidgetExportedObject[];
};

export type ObjectPanelState = {
  error?: Error;
  object?: unknown;
};

export function isJsWidget(object: JsWidget | unknown): object is JsWidget {
  return typeof (object as JsWidget).getDataAsBase64 === 'function';
}

/**
 * Panel for showing a widget from the server in a Dashboard.
 */
export class ObjectPanel extends React.Component<
  ObjectPanelProps,
  ObjectPanelState
> {
  static COMPONENT = '@deephaven/ObjectPanel';

  constructor(props: ObjectPanelProps) {
    super(props);

    this.handleError = this.handleError.bind(this);
    this.handleExportedTypeClick = this.handleExportedTypeClick.bind(this);

    this.state = {
      error: undefined,
      object: undefined,
    };
  }

  componentDidMount(): void {
    this.fetchObject();
  }

  async fetchObject(): Promise<void> {
    log.info('fetchObject...');
    try {
      const { fetch } = this.props;
      const object = await fetch();
      log.info('Object fetched: ', object);
      this.setState({ object });
    } catch (e: unknown) {
      this.handleError(e as Error);
    }
  }

  handleExportedTypeClick(
    exportedObject: JsWidgetExportedObject,
    index: number
  ): void {
    log.info('handleExportedTypeClick', exportedObject, index);

    const { type } = exportedObject;
    if (type === 'Table') {
      log.info('Opening table', index);

      const { glEventHub, metadata } = this.props;
      const { name } = metadata;
      const openOptions = {
        fetch: () => exportedObject.fetch(),
        widget: { name: `${name}/${index}`, type },
      };

      log.info('openWidget', openOptions);

      glEventHub.emit('PanelEvent.OPEN', openOptions);
    } else {
      log.error('Unable to handle exported object type', type);
    }
  }

  handleError(error: Error): void {
    log.error(error);
    this.setState({ error, object: undefined });
  }

  renderObjectData(): JSX.Element {
    const { object } = this.state;
    log.info('Rendering object data');
    if (!object) {
      return null;
    }
    if (!isJsWidget(object)) {
      return <div className="error-message">Object is not a widget</div>;
    }
    const data = object.getDataAsBase64();
    try {
      const dataJson = JSON.parse(atob(data));
      return <ReactJson src={dataJson} theme="monokai" />;
    } catch (e) {
      return <div className="base64-data">{data}</div>;
    }
  }

  renderExportedObjectList(): JSX.Element {
    const { object } = this.state;
    if (!object || !isJsWidget(object)) {
      return null;
    }

    return (
      <>
        {object.exportedObjects.map((exportedObject, index) => (
          <Button
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            kind="ghost"
            onClick={() => this.handleExportedTypeClick(exportedObject, index)}
          >
            {exportedObject.type} {index}
          </Button>
        ))}
      </>
    );
  }

  render(): ReactNode {
    const { metadata } = this.props;
    const { name, type } = metadata;
    const { error, object } = this.state;
    const isLoading = error === undefined && object === undefined;
    const isLoaded = object !== undefined;
    const errorMessage = error ? `${error}` : undefined;

    return (
      <div className="object-panel-content">
        <div className="title">
          {name} ({type})
        </div>
        {isLoaded && (
          <>
            <div className="object-panel-exported-tables">
              {this.renderExportedObjectList()}
            </div>
            <div className="object-panel-data">{this.renderObjectData()}</div>
          </>
        )}
        <LoadingOverlay
          isLoading={isLoading}
          isLoaded={isLoaded}
          errorMessage={errorMessage}
        />
      </div>
    );
  }
}

export default ObjectPanel;
