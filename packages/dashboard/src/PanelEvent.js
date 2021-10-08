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

  // Event to close a panel that's currently open
  CLOSE: 'PanelEvent.CLOSE',
});
