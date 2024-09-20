import { type ClosedPanels } from '@deephaven/dashboard';
import memoize from 'memoize-one';

class MarkdownUtils {
  static DEFAULT_TITLE = 'Note';

  static DEFAULT_CONTENT =
    '# Markdown Note\n\nThis note can be edited using **markdown** for styling.';

  /**
   * Retrieves a new markdown title that does not conflict with the current titles
   * @param usedTitles Markdown titles that are already in use
   * @returns The new title
   */
  static getNewMarkdownTitle(usedTitles: string[]): string {
    let title = `${MarkdownUtils.DEFAULT_TITLE}`;
    let titleIndex = 0;
    while (usedTitles.indexOf(title) >= 0) {
      titleIndex += 1;
      title = `${MarkdownUtils.DEFAULT_TITLE}-${titleIndex}`;
    }

    return title;
  }

  static getClosedMarkdowns = memoize((closedPanels: ClosedPanels) =>
    closedPanels
      .filter(
        panel =>
          panel.component === 'MarkdownPanel' &&
          panel.props.panelState.content !== '' &&
          panel.props.panelState.content !== null
      )
      .reverse()
  );
}

export default MarkdownUtils;
