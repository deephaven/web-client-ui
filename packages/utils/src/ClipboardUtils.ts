import { checkPermission } from './PermissionUtils';

/**
 * Copy the passed in text to the clipboard.
 * @param text The text to copy
 * @returns Promise Resolved on success, rejected on failure
 */
export async function copyToClipboard(text: string): Promise<void> {
  const { clipboard } = navigator;
  if (clipboard !== undefined) {
    try {
      return await navigator.clipboard.writeText(text);
    } catch {
      // Ignore error. Fallback to `copyToClipboardExecCommand` below
      // (same as when clipboard is not available).
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

/**
 * Reads text from the clipboard.
 * @returns Promise that resolves to text from clipboard as string, or null if permissions are not supported/granted.
 */
export async function readFromClipboard(): Promise<string | null> {
  const { clipboard } = navigator;
  if (clipboard === undefined) return null;

  let permissionState = await checkPermission('clipboard-read');

  if (permissionState === 'granted' || permissionState === null) {
    // Some browsers that don't support permissions seems to have a workaround where
    // calling readText() shows the native context menu and allows user to hit paste there
    try {
      const text = await clipboard.readText();
      return text;
    } catch {
      return null;
    }
  }

  if (permissionState === 'prompt') {
    try {
      // Need to call this to bring up a permission prompt
      await clipboard.readText();
    } catch {
      // Ignore error caused by calling readText() without permissions
    }

    // Check status again after user has interacted with the permission prompt
    permissionState = await checkPermission('clipboard-read');
    if (permissionState === 'granted') {
      const text = await clipboard.readText();
      return text;
    }

    if (permissionState === 'prompt' || permissionState === 'denied') {
      // Prompt means user closed out of the previous permission prompt, treat it as a denial
      return null;
    }
  }

  return null;
}
