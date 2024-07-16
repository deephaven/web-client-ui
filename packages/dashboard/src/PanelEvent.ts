import { makeEventFunctions } from '@deephaven/golden-layout';

export type WidgetDescriptor = {
  type: string;
  name?: string | null;
  id?: string | null;
};

export type PanelOpenEventDetail<T = unknown> = {
  /**
   * Opening the widget was triggered by dragging from a list, such as the Panels dropdown.
   * The coordinates are used as the starting location for the drag, where we will show the panel until the user drops it in the dashboard.
   */
  dragEvent?: MouseEvent;

  /** ID of the panel to re-use. Will replace any existing panel with this ID. Otherwise a new panel is opened with a randomly generated ID. */
  panelId?: string;

  /** Descriptor of the widget. */
  widget: WidgetDescriptor;

  /**
   * Function to fetch the instance of the widget
   * @deprecated Use `useWidget` hook with the `widget` descriptor instead
   */
  fetch?: () => Promise<T>;
};

/**
 * Events emitted by panels and to control panels
 */
export const PanelEvent = Object.freeze({
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

  // Reopen last closed panel
  REOPEN_LAST: 'PanelEvent.REOPEN_LAST',

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

export const {
  listen: listenForPanelOpen,
  emit: emitPanelOpen,
  useListener: usePanelOpenListener,
} = makeEventFunctions<PanelOpenEventDetail>(PanelEvent.OPEN);

// TODO (#2147): Add the rest of the event functions here. Need to create the correct types for all of them.

export default PanelEvent;
