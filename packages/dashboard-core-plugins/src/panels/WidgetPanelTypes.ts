import { type ReactNode } from 'react';

export type WidgetPanelDescriptor = {
  /** Type of the widget. */
  type: string;

  /** Name of the widget. */
  name: string;

  /** Display name of the widget. May be different than the assigned name. */
  displayName?: string;

  /** Display type of the widget. May be different than the assigned type. */
  displayType?: string;

  /** Description of the widget. */
  description?: string;
};

export type WidgetPanelTooltipProps = {
  /** A descriptor of the widget. */
  descriptor: WidgetPanelDescriptor;

  /** Children to render within this tooltip */
  children?: ReactNode;
};

export type WidgetId = string;
