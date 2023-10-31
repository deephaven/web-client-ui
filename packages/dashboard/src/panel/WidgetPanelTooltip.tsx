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
function WidgetPanelTooltip(props: WidgetPanelTooltipProps): ReactElement {
  const { widgetType, widgetName, glContainer, description, children } = props;
  const panelTitle = LayoutUtils.getTitleFromContainer(glContainer);

  return (
    <div className="tab-tooltip-grid-container">
      <span className="tab-tooltip-title">{widgetType} Name</span>
      <div className="tab-tooltip-name-wrapper">
        <span className="tab-tooltip-name">{widgetName}</span>
        <CopyButton
          className="tab-tooltip-copy"
          tooltip="Copy name"
          copy={widgetName}
        />
      </div>
      {widgetName !== panelTitle && (
        <>
          <span className="tab-tooltip-title">Display Name</span>
          <span className="tab-tooltip-name">{panelTitle}</span>
        </>
      )}
      {description && (
        <div className="tab-tooltip-description">{description}</div>
      )}
      {children}
    </div>
  );
}

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
