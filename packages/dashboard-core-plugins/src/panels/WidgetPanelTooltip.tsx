import React, { ReactNode, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ContextActionUtils } from '@deephaven/components';
import { vsCopy, vsPassFilled } from '@deephaven/icons';
import { GLPropTypes, LayoutUtils } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import './WidgetPanelTooltip.scss';
import { ReactElement } from 'react-markdown';
import GoldenLayout from '@deephaven/golden-layout';

const log = Log.module('WidgetPanelTooltip');

interface WidgetPanelTooltipProps {
  glContainer: GoldenLayout.Container;
  widgetType: string;
  widgetName: string;
  description: string;
  children: ReactNode;
}
const WidgetPanelTooltip = (props: WidgetPanelTooltipProps): ReactElement => {
  const { widgetType, widgetName, glContainer, description, children } = props;
  const panelTitle = LayoutUtils.getTitleFromContainer(glContainer);
  const [copied, setCopied] = useState(false);

  return (
    <div className="tab-tooltip-container">
      <div className="row flex-nowrap align-items-start">
        <span className="tab-tooltip-title">
          <b>{widgetType} Name </b>
        </span>
        <span className="tab-tooltip-name">{widgetName}</span>

        <Button
          kind="ghost"
          className="tab-tooltip-copy"
          icon={copied ? vsPassFilled : vsCopy}
          onClick={() => {
            ContextActionUtils.copyToClipboard(widgetName)
              .then(() => setCopied(true))
              .catch(e => log.error('Unable to column name', e));
          }}
          tooltip={copied ? 'Copied text' : 'Copy name'}
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
