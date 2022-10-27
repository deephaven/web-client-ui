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

const IrisGridPanelTooltip = (
  props: IrisGridPanelTooltipProps
): ReactElement => {
  const { model, widgetName, glContainer, description } = props;

  const formattedRowCount = model?.displayString(model?.rowCount ?? 0, 'long');

  return (
    <WidgetPanelTooltip
      widgetType="Table"
      widgetName={widgetName}
      glContainer={glContainer}
      description={description}
    >
      <div className="column-statistics-grid">
        <span className="column-statistic-operation">Number of Rows</span>
        <span className="column-statistic-value">{formattedRowCount}</span>
      </div>
    </WidgetPanelTooltip>
  );
};

IrisGridPanelTooltip.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  widgetName: PropTypes.string.isRequired,
  description: PropTypes.string,
};

IrisGridPanelTooltip.defaultProps = {
  description: null,
};

export default IrisGridPanelTooltip;
