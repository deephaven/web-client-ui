import {
  type IconDefinition,
  dhLeftAlign,
  dhCenterAlign,
  dhRightAlign,
} from '@deephaven/icons';

interface TextAlignmentOption {
  title: string;
  alignment: CanvasTextAlign | null;
  group: number;
  isSelected: boolean;
  icon?: IconDefinition;
}

class TextAlignmentFormatContextMenu {
  static defaultGroup = 10;

  static alignmentGroup = 20;

  /**
   * Gets the associated icon for a given alignment
   * @param alignment The text alignment
   * @returns The corresponding icon definition
   */
  static getIconForAlignment(alignment: CanvasTextAlign): IconDefinition {
    if (alignment === 'left') return dhLeftAlign;
    if (alignment === 'center') return dhCenterAlign;
    return dhRightAlign;
  }

  /**
   * Creates list of text alignment options for the context menu
   * @param currentAlignment The active text alignment
   * @returns Array of text alignment options for the context menu
   */
  static getOptions(
    currentAlignment?: CanvasTextAlign | null
  ): TextAlignmentOption[] {
    const alignmentOptions: TextAlignmentOption[] = [
      {
        title: 'Default',
        alignment: null,
        isSelected: currentAlignment == null,
        group: TextAlignmentFormatContextMenu.defaultGroup,
      },
      {
        title: 'Left Align',
        alignment: 'left',
        icon: dhLeftAlign,
        isSelected: currentAlignment === 'left',
        group: TextAlignmentFormatContextMenu.alignmentGroup,
      },
      {
        title: 'Center Align',
        alignment: 'center',
        icon: dhCenterAlign,
        isSelected: currentAlignment === 'center',
        group: TextAlignmentFormatContextMenu.alignmentGroup,
      },
      {
        title: 'Right Align',
        alignment: 'right',
        icon: dhRightAlign,
        isSelected: currentAlignment === 'right',
        group: TextAlignmentFormatContextMenu.alignmentGroup,
      },
    ];

    return alignmentOptions;
  }
}

export default TextAlignmentFormatContextMenu;
export type { TextAlignmentOption };
