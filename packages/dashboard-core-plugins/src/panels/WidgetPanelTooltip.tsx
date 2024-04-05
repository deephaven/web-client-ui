import React, { ReactNode, ReactElement } from 'react';
import { CopyButton, createXComponent } from '@deephaven/components';
import './WidgetPanelTooltip.scss';
import {
  getWidgetPanelDescriptorFromProps,
  WidgetPanelTooltipProps,
} from './WidgetPanelTypes';

function WidgetPanelTooltip(props: WidgetPanelTooltipProps): ReactElement {
  const { children } = props;
  const descriptor = getWidgetPanelDescriptorFromProps(props);
  const { name, type, description, displayName } = descriptor;

  return (
    <div className="tab-tooltip-grid-container">
      <span className="tab-tooltip-title">{type} Name</span>
      <div className="tab-tooltip-name-wrapper">
        <span className="tab-tooltip-name">{name}</span>
        <CopyButton
          className="tab-tooltip-copy"
          tooltip="Copy name"
          copy={name}
        />
      </div>
      {name !== displayName && displayName && (
        <>
          <span className="tab-tooltip-title">Display Name</span>
          <span className="tab-tooltip-name">{displayName}</span>
        </>
      )}
      {description && (
        <div className="tab-tooltip-description">{description}</div>
      )}
      {children}
    </div>
  );
}

export default createXComponent(WidgetPanelTooltip);
