import { Container, getEmitListenerPair } from '@deephaven/golden-layout';
import { DragEvent } from 'react';
import { PanelComponent } from './PanelTypes';

export type WidgetDefinition = {
  type: string;

  /**
   * @deprecated Use `title` instead.
   */
  name?: string;

  title?: string;

  id?: string;
};

/** A reference to some props from a panel. */
export interface PanelHandle {
  glContainer: Container;
}

/**
 * Reference to the legacy component panel types.
 * @deprecated Use PanelHandle instead.
 */
export type LegacyComponentPanel = PanelComponent;

/**
 * Reference to a component panel.
 */
export type ComponentPanel = LegacyComponentPanel | PanelHandle;

/**
 * Event detail fired when a panel is opened.
 */
export type PanelOpenEventDetail = {
  dragEvent?: DragEvent;
  fetch?: () => Promise<unknown>;
  panelId?: string;
  widget: WidgetDefinition;
};

/** ID associated with a panel */
export type PanelId = string;

/** The componentPanel associated with the Panel */
export type PanelFocusEventArgs = [ComponentPanel];

const PanelEvent = Object.freeze({
  // Panel has received focus
  FOCUS: 'PanelEvent.FOCUS',

  // Panel has been mounted
  MOUNT: 'PanelEvent.MOUNT',

  // Panel has been unmounted
  UNMOUNT: 'PanelEvent.UNMOUNT',

  // The title of the panel has changed
  TITLE_CHANGED: 'PanelEvent.TITLE_CHANGED',

  // Panel was re-opened from a dehydrated state
  REOPEN: 'PanelEvent.REOPEN',

  // Panel was deleted
  DELETE: 'PanelEvent.DELETE',

  // Panel was cloned/copied
  CLONED: 'PanelEvent.CLONED',

  // Panel was closed
  CLOSED: 'PanelEvent.CLOSED',

  // Event to open a new panel
  // Plugins will need to register to open based on this event.
  // Multiple plugins could open panels for the same event if desired.
  OPEN: 'PanelEvent.OPEN',

  // Event to close a panel that's currently open
  CLOSE: 'PanelEvent.CLOSE',

  // Panel is being dragged
  DRAGGING: 'PanelEvent.DRAGGING',

  // Panel is dropped
  DROPPED: 'PanelEvent.DROPPED',
});

export const { emit: emitFocus, on: onFocus } =
  getEmitListenerPair<PanelFocusEventArgs>(PanelEvent.FOCUS);

/**
 * Events emitted by panels and to control panels
 */
export default PanelEvent;
