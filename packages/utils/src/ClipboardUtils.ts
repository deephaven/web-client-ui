/**
 * Copy the passed in text to the clipboard.
 * @param text The text to copy
 * @returns Promise Resolved on success, rejected on failure
 */
export async function copyToClipboard(text: string): Promise<void> {
  const { clipboard } = navigator;
  if (clipboard !== undefined) {
    try {
      return navigator.clipboard.writeText(text);
    } catch {
      return copyToClipboardExecCommand(text);
    }
  }
  copyToClipboardExecCommand(text);
}

/**
 * Copy the passed in text to the clipboard using the `execCommand` functionality
 * Throws on error/failure
 * @param text The text to copy
 */
export function copyToClipboardExecCommand(text: string): void {
  const oldFocus = document.activeElement;
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const result = document.execCommand('copy');

  document.body.removeChild(textArea);
  if (oldFocus instanceof HTMLElement) {
    oldFocus.focus();
  }

  if (!result) throw new Error('Unable to execute copy command');
}
