import React, { PureComponent, ReactElement } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import type { Container } from '@deephaven/golden-layout';
import { ContextActions } from '@deephaven/components';
import { copyToClipboard } from '@deephaven/utils';
import Panel, { ComponentPanelProps } from './Panel';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import './WidgetPanel.scss';

export interface WidgetPanelProps extends ComponentPanelProps {
  isDisconnected: boolean;
  isInactive: boolean;
  showTabTooltip: boolean;
  widgetName: string;
  widgetType: string;
  description: string;
}

/**
 * Widget panel component that has a loading spinner and displays an error message when set
 */
class WidgetPanel extends PureComponent<WidgetPanelProps> {
  static defaultProps = {
    className: '',
    errorMessage: null,
    isClonable: true,
    isDisconnected: false,
    isInactive: false,
    isLoading: false,
    isLoaded: true,
    isRenamable: true,
    showTabTooltip: true,
    widgetName: 'Widget',
    widgetType: 'Widget',
    renderTabTooltip: null,
    description: '',

    onFocus: (): void => undefined,
    onBlur: (): void => undefined,
    onHide: (): void => undefined,
    onResize: (): void => undefined,
    onShow: (): void => undefined,
    onTabClicked: (): void => undefined,
  };

  constructor(props: WidgetPanelProps) {
    super(props);

    this.handleCopyName = this.handleCopyName.bind(this);
  }

  handleCopyName(): void {
    const { widgetName } = this.props;
    copyToClipboard(widgetName);
  }

  getCachedRenderTabTooltip = memoize(
    (
      showTabTooltip: boolean,
      glContainer: Container,
      widgetType: string,
      widgetName: string,
      description: string
    ) =>
      showTabTooltip
        ? () => (
            <WidgetPanelTooltip
              glContainer={glContainer}
              widgetType={widgetType}
              widgetName={widgetName}
              description={description}
            />
          )
        : null
  );

  render(): ReactElement {
    const {
      children,
      className,
      componentPanel,
      errorMessage,
      isLoaded,
      isLoading,
      glContainer,
      glEventHub,
      isDisconnected,
      isInactive,
      isClonable,
      isRenamable,
      showTabTooltip,
      renderTabTooltip,
      widgetType,
      widgetName,
      description,

      onHide,
      onFocus,
      onBlur,
      onResize,
      onShow,
      onTabClicked,
    } = this.props;

    const doRenderTabTooltip =
      renderTabTooltip ??
      this.getCachedRenderTabTooltip(
        showTabTooltip,
        glContainer,
        widgetType,
        widgetName,
        description
      );

    const additionalActions = [
      {
        title: `Copy ${widgetType} Name`,
        group: ContextActions.groups.medium,
        order: 20,
        action: this.handleCopyName,
      },
    ];

    return (
      <Panel
        className={classNames(className, {
          disconnected: isDisconnected,
          inactive: isInactive,
        })}
        componentPanel={componentPanel}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onHide={onHide}
        onFocus={onFocus}
        onBlur={onBlur}
        onResize={onResize}
        onShow={onShow}
        onTabClicked={onTabClicked}
        renderTabTooltip={doRenderTabTooltip}
        errorMessage={errorMessage}
        isLoaded={isLoaded}
        isLoading={isLoading}
        isClonable={isClonable}
        isRenamable={isRenamable}
        additionalActions={additionalActions}
      >
        {children}
        {isInactive && <div className="fill-parent-absolute" />}
      </Panel>
    );
  }
}

export default WidgetPanel;
