import { WidgetComponentProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import IrisGrid from '@deephaven/iris-grid';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import { PandasReloadButton } from './panels/PandasReloadButton';
import { useIrisGridModel } from './useIrisGridModel';

export function PandasWidgetPlugin({
  fetch,
}: WidgetComponentProps<dh.Table>): JSX.Element | null {
  const fetchResult = useIrisGridModel(fetch);

  if (fetchResult.status === 'loading') {
    return <LoadingOverlay isLoading />;
  }

  if (fetchResult.status === 'error') {
    return (
      <LoadingOverlay
        errorMessage={getErrorMessage(fetchResult.error)}
        isLoading={false}
      />
    );
  }

  const { model, reload } = fetchResult;
  return (
    <IrisGrid model={model}>
      <PandasReloadButton onClick={reload} />
    </IrisGrid>
  );
}

export default PandasWidgetPlugin;
