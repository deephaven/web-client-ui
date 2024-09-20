import React, { type ReactElement } from 'react';
import { type IrisGridModel } from '@deephaven/iris-grid';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import { type WidgetPanelTooltipProps } from './WidgetPanelTypes';

type IrisGridPanelTooltipProps = WidgetPanelTooltipProps & {
  model?: IrisGridModel;
};

function IrisGridPanelTooltip(props: IrisGridPanelTooltipProps): ReactElement {
  const { model } = props;

  const rowCount =
    (model?.rowCount ?? 0) -
    (model?.pendingRowCount ?? 0) -
    (model?.floatingBottomRowCount ?? 0) -
    (model?.floatingTopRowCount ?? 0);
  const formattedRowCount = model?.displayString(rowCount, 'long');

  const columnCount = model?.columnCount ?? 0;
  const formattedcolumnCount = model?.displayString(columnCount, 'long');

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <WidgetPanelTooltip {...props}>
      <hr className="tab-tooltip-divider" />
      <span>Number of Columns</span>
      <span className="tab-tooltip-statistic-value">
        {formattedcolumnCount}
      </span>
      <span>Number of Rows</span>
      <span className="tab-tooltip-statistic-value">{formattedRowCount}</span>
    </WidgetPanelTooltip>
  );
}

export default IrisGridPanelTooltip;
