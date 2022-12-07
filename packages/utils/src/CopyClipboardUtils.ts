class CopyClipboardUtils {
  /**
   * Copy the passed in text to the clipboard.
   * @param text The text to copy
   * @returns Promise Resolved on success, rejected on failure
   */
  static copyToClipboard(text: string): Promise<void> {
    const { clipboard } = navigator;
    if (clipboard === undefined) {
      CopyClipboardUtils.copyToClipboardExecCommand(text);
      return Promise.resolve();
    }
    return navigator.clipboard.writeText(text).catch(() => {
      CopyClipboardUtils.copyToClipboardExecCommand(text);
    });
  }

  /**
   * Copy the passed in text to the clipboard using the `execCommand` functionality
   * Throws on error/failure
   * @param text The text to copy
   */
  static copyToClipboardExecCommand(text: string): void {
    const oldFocus = document.activeElement;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    if (!document.execCommand('copy')) {
      throw new Error('Unable to execute copy command');
    }

    document.body.removeChild(textArea);

    if (oldFocus instanceof HTMLElement) {
      oldFocus.focus();
    }
  }
}

export default CopyClipboardUtils;
