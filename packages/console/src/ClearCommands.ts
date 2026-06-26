/**
 * Special console commands that clear the console output/history. These are
 * handled entirely client-side (see Console.handleCommandSubmit) and never sent
 * to the server.
 */
export const CLEAR_CONSOLE_COMMANDS: readonly string[] = ['clear', 'cls'];

/**
 * Whether the given command is a special "clear the console" command.
 * @param command The trimmed command text
 */
export function isClearConsoleCommand(command: string): boolean {
  return CLEAR_CONSOLE_COMMANDS.includes(command);
}

export default CLEAR_CONSOLE_COMMANDS;
