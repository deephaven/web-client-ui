import {
  type IconDefinition,
  dhLeftAlign,
  dhCenterAlign,
  dhRightAlign,
} from '@deephaven/icons';

interface TextAlignmentOptions {
  title: string;
  alignment: CanvasTextAlign | null;
  group: number;
  icon?: IconDefinition;
}

class TextAlignmentFormatContextMenu {
  static defaultGroup = 10;

  static alignmentGroup = 20;

  static readonly alignmentOptions: ReadonlyArray<TextAlignmentOptions> = [
    {
      title: 'Default',
      alignment: null,
      group: TextAlignmentFormatContextMenu.defaultGroup,
    },
    {
      title: 'Left Align',
      alignment: 'left',
      icon: dhLeftAlign,
      group: TextAlignmentFormatContextMenu.alignmentGroup,
    },
    {
      title: 'Center Align',
      alignment: 'center',
      icon: dhCenterAlign,
      group: TextAlignmentFormatContextMenu.alignmentGroup,
    },
    {
      title: 'Right Align',
      alignment: 'right',
      icon: dhRightAlign,
      group: TextAlignmentFormatContextMenu.alignmentGroup,
    },
  ];

  /**
   * Gets the associated icon for a given alignment
   * @param alignment The text alignment
   * @returns The corresponding icon definition
   */
  static getIconForAlignment(alignment: CanvasTextAlign): IconDefinition {
    if (alignment === 'center') return dhCenterAlign;
    if (alignment === 'left') return dhLeftAlign;
    return dhRightAlign;
  }
}

export default TextAlignmentFormatContextMenu;
export type { TextAlignmentOptions };
