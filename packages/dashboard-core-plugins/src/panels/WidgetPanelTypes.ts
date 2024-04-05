import React, { ReactNode, ReactElement } from 'react';
import { LayoutUtils, WidgetDescriptor } from '@deephaven/dashboard';
import type { Container } from '@deephaven/golden-layout';

export type WidgetPanelDescriptor = {
  /** Type of the widget. */
  type: string;

  /** Name of the widget. */
  name: string;

  /** Display name of the widget. May be different than the assigned name. */
  displayName?: string;

  /** Description of the widget. */
  description?: string;
};

/** @deprecated Use WidgetPanelTooltipPropsV1 instead */
export type WidgetPanelTooltipPropsV1 = {
  glContainer: Container;
  widgetType: string;
  widgetName: string;
  description?: string;
  children?: ReactNode;
};

export type WidgetPanelTooltipPropsV2 = {
  /** A descriptor of the widget. */
  descriptor: WidgetPanelDescriptor;

  /** Children to render within this tooltip */
  children?: ReactNode;
};

export type WidgetPanelTooltipProps =
  | WidgetPanelTooltipPropsV1
  | WidgetPanelTooltipPropsV2;

export function isWidgetPanelTooltipPropsV2(
  props: WidgetPanelTooltipProps
): props is WidgetPanelTooltipPropsV2 {
  return 'descriptor' in props;
}

export function getWidgetPanelDescriptorFromProps(
  props: WidgetPanelTooltipProps
): WidgetPanelDescriptor {
  if (isWidgetPanelTooltipPropsV2(props)) {
    return props.descriptor;
  }

  const { widgetType, widgetName, description, glContainer } = props;
  const displayName = LayoutUtils.getTitleFromContainer(glContainer);
  return {
    type: widgetType,
    name: widgetName,
    displayName: displayName ?? undefined,
    description,
  };
}
