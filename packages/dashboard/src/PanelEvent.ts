import { DragEvent } from 'react';

export type WidgetDescriptor = {
  type: string;
  name?: string | null;
  id?: string | null;
};

export type PanelOpenEventDetail<T = unknown> = {
  dragEvent?: DragEvent;
  fetch?: () => Promise<T>;
  panelId?: string;
  widget: WidgetDescriptor;
};

/**
 * Events emitted by panels and to control panels
 */
export default Object.freeze({
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
