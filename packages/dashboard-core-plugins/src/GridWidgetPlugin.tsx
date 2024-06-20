import { useEffect, useState } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
} from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, RootState } from '@deephaven/redux';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';

export function GridWidgetPlugin(
  props: WidgetComponentProps<dh.Table>
): JSX.Element | null {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);
  const [model, setModel] = useState<IrisGridModel>();
  const [error, setError] = useState<unknown>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setError(undefined);
      const table = await fetch();
      const newModel = await IrisGridModelFactory.makeModel(dh, table);
      if (!cancelled) {
        setModel(newModel);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  useEffect(
    function startListeningModel() {
      if (!model) {
        return;
      }

      // If the table inside a widget is disconnected, then don't bother trying to listen to reconnect, just close it and show a message
      // Widget closes the table already when it is disconnected, so no need to close it again
      function handleDisconnect() {
        setError(new Error('Model disconnected'));
        setModel(undefined);
      }

      model.addEventListener(IrisGridModel.EVENT.DISCONNECT, handleDisconnect);

      return () => {
        model.removeEventListener(
          IrisGridModel.EVENT.DISCONNECT,
          handleDisconnect
        );
      };
    },
    [model]
  );

  const errorMessage = getErrorMessage(error);
  if (errorMessage != null) {
    return <LoadingOverlay errorMessage={errorMessage} isLoading={false} />;
  }

  return model ? <IrisGrid model={model} settings={settings} /> : null;
}

export default GridWidgetPlugin;
