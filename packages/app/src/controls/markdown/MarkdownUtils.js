class MarkdownUtils {
  static DEFAULT_TITLE = 'Note';

  static DEFAULT_CONTENT =
    '# Markdown Note\n\nThis note can be edited using **markdown** for styling.';

  /**
   * Retrieves a new markdown title that does not conflict with the current titles
   * @param {Array<String>} usedTitles Markdown titles that are already in use
   * @returns {String} The new title
   */
  static getNewMarkdownTitle(usedTitles) {
    let title = `${MarkdownUtils.DEFAULT_TITLE}`;
    let titleIndex = 0;
    while (usedTitles.indexOf(title) >= 0) {
      titleIndex += 1;
      title = `${MarkdownUtils.DEFAULT_TITLE}-${titleIndex}`;
    }

    return title;
  }
}

export default MarkdownUtils;
