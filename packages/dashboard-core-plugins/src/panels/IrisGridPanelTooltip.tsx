import React, { ReactElement } from 'react';
import { GLPropTypes } from '@deephaven/dashboard';
import type { ComponentConfig, Container } from '@deephaven/golden-layout';
import { IrisGridModel } from '@deephaven/iris-grid';
import PropTypes from 'prop-types';
import WidgetPanelTooltip from './WidgetPanelTooltip';

interface IrisGridPanelTooltipProps {
  model?: IrisGridModel;
  widgetName: string;
  glContainer: Container<ComponentConfig>;
  description?: string;
}

function IrisGridPanelTooltip(props: IrisGridPanelTooltipProps): ReactElement {
  const { model, widgetName, glContainer, description } = props;

  const rowCount =
    (model?.rowCount ?? 0) -
    (model?.pendingRowCount ?? 0) -
    (model?.floatingBottomRowCount ?? 0);
  const formattedRowCount = model?.displayString(rowCount, 'long');

  const columnCount = model?.columnCount ?? 0;
  const formattedcolumnCount = model?.displayString(columnCount, 'long');

  return (
    <WidgetPanelTooltip
      widgetType="Table"
      widgetName={widgetName}
      glContainer={glContainer}
      description={description}
    >
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

IrisGridPanelTooltip.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  widgetName: PropTypes.string.isRequired,
  description: PropTypes.string,
};

IrisGridPanelTooltip.defaultProps = {
  description: null,
};

export default IrisGridPanelTooltip;
