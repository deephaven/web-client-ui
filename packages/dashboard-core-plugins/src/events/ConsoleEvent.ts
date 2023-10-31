export const ConsoleEvent = Object.freeze({
  /** Focus the command history panel */
  FOCUS_HISTORY: 'ConsoleEvent.FOCUS_HISTORY',

  /** Send a command to the console */
  SEND_COMMAND: 'ConsoleEvent.SEND_COMMAND',

  /** Console settings have changed */
  SETTINGS_CHANGED: 'ConsoleEvent.SETTINGS_CHANGED',
});

export default ConsoleEvent;
