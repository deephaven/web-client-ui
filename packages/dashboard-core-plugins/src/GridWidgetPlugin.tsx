import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGrid } from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, type RootState } from '@deephaven/redux';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import { useIrisGridModel } from './useIrisGridModel';

export function GridWidgetPlugin({
  fetch,
}: WidgetComponentProps<dh.Table>): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);

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

  const { model } = fetchResult;
  return <IrisGrid model={model} settings={settings} />;
}

export default GridWidgetPlugin;
