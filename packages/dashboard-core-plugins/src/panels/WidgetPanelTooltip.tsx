import React, { type ReactElement } from 'react';
import { CopyButton, createXComponent } from '@deephaven/components';
import './WidgetPanelTooltip.scss';
import { type WidgetPanelTooltipProps } from './WidgetPanelTypes';

function WidgetPanelTooltip(props: WidgetPanelTooltipProps): ReactElement {
  const { children, descriptor } = props;
  const { name, type, description, displayName } = descriptor;

  // Convert PascalCase to Title Case
  // ex. PartitionedTable -> Partitioned Table
  const formattedType = type.replace(/([a-z])([A-Z])/g, '$1 $2');

  return (
    <div className="tab-tooltip-grid-container">
      <span className="tab-tooltip-title">{formattedType} Name</span>
      <div className="tab-tooltip-name-wrapper">
        <span className="tab-tooltip-name">{name}</span>
        <CopyButton
          className="tab-tooltip-copy"
          tooltip="Copy name"
          copy={name}
        />
      </div>
      {name !== displayName && Boolean(displayName) && (
        <>
          <span className="tab-tooltip-title">Display Name</span>
          <span className="tab-tooltip-name">{displayName}</span>
        </>
      )}
      {Boolean(description) && (
        <div className="tab-tooltip-description">{description}</div>
      )}
      {children}
    </div>
  );
}

const XWidgetPanelTooltip = createXComponent(WidgetPanelTooltip);

export default XWidgetPanelTooltip;
