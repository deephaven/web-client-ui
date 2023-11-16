import { useCallback, useEffect, useState } from 'react';
import { WidgetComponentProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import IrisGrid, {
  IrisGridModelFactory,
  type IrisGridModel,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { LoadingOverlay } from '@deephaven/components';
import { PandasReloadButton } from './panels';

export function PandasWidgetPlugin(
  props: WidgetComponentProps
): JSX.Element | null {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const { fetch } = props;

  const makeModel = useCallback(async () => {
    const table = (await fetch()) as unknown as Table;
    return IrisGridModelFactory.makeModel(dh, table);
  }, [dh, fetch]);

  const handleReload = useCallback(async () => {
    setIsLoading(true);
    const newModel = await makeModel();
    setModel(newModel);
    setIsLoading(false);
  }, [makeModel]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const newModel = await makeModel();
      if (!cancelled) {
        setModel(newModel);
        setIsLoaded(true);
        setIsLoading(false);
      }
    }

    init();
    setIsLoading(true);

    return () => {
      cancelled = true;
    };
  }, [makeModel]);

  return (
    <>
      <LoadingOverlay isLoaded={isLoaded} isLoading={isLoading} />
      {model && (
        <IrisGrid model={model}>
          <PandasReloadButton onClick={handleReload} />
        </IrisGrid>
      )}
    </>
  );
}

export default PandasWidgetPlugin;
