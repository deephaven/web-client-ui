import { ReactNode } from 'react';
import { PanelComponent } from '@deephaven/dashboard';
import type { Container, EventEmitter } from '@deephaven/golden-layout';

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

export type InnerWidgetPanelProps = {
  children: ReactNode;

  descriptor: WidgetPanelDescriptor;
  componentPanel?: PanelComponent;

  glContainer: Container;
  glEventHub: EventEmitter;

  className?: string;
  errorMessage?: string;
  isClonable?: boolean;
  isDisconnected?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
  isRenamable?: boolean;
  showTabTooltip?: boolean;

  renderTabTooltip?: () => ReactNode;

  onFocus?: () => void;
  onBlur?: () => void;
  onHide?: () => void;
  onClearAllFilters?: () => void;
  onResize?: () => void;
  onSessionClose?: (...args: unknown[]) => void;
  onSessionOpen?: (...args: unknown[]) => void;
  onShow?: () => void;
  onTabBlur?: () => void;
  onTabFocus?: () => void;
  onTabClicked?: () => void;
};
