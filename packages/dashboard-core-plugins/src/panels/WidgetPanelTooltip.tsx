import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
import { CopyButton } from '@deephaven/components';
import { GLPropTypes, LayoutUtils } from '@deephaven/dashboard';
import './WidgetPanelTooltip.scss';
import { ReactElement } from 'react-markdown';
import type { Container } from '@deephaven/golden-layout';

interface WidgetPanelTooltipProps {
  glContainer: Container;
  widgetType: string;
  widgetName: string;
  description: string;
  children: ReactNode;
}
const WidgetPanelTooltip = (props: WidgetPanelTooltipProps): ReactElement => {
  const { widgetType, widgetName, glContainer, description, children } = props;
  const panelTitle = LayoutUtils.getTitleFromContainer(glContainer);

  return (
    <div className="tab-tooltip-container">
      <div className="row flex-nowrap align-items-start">
        <span className="tab-tooltip-title">
          <b>{widgetType} Name </b>
        </span>
        <span className="tab-tooltip-name">{widgetName}</span>
        <CopyButton
          className="tab-tooltip-copy"
          tooltip="Copy name"
          copy={widgetName}
        />
      </div>
      {widgetName !== panelTitle && (
        <div className="row">
          <span className="tab-tooltip-title">
            <b>Display Name</b>
          </span>
          <span className="tab-tooltip-name">{panelTitle}</span>
        </div>
      )}
      {description && (
        <div className="row">
          <span className="tab-tooltip-description">{description}</span>
        </div>
      )}
      {children}
    </div>
  );
};

WidgetPanelTooltip.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  widgetType: PropTypes.string,
  widgetName: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
};

WidgetPanelTooltip.defaultProps = {
  widgetType: '',
  widgetName: '',
  description: null,
  children: null,
};

export default WidgetPanelTooltip;
