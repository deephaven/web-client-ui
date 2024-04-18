export const ACTION_ICON_HEIGHT = 24;
export const COMBO_BOX_ITEM_HEIGHT = 32;
export const COMBO_BOX_TOP_OFFSET = 4;
export const ITEM_KEY_PREFIX = 'DH_ITEM_KEY';
export const PICKER_ITEM_HEIGHTS = {
  noDescription: 32,
  withDescription: 48,
} as const;
export const PICKER_SECTION_HEIGHTS = {
  title: 33,
  emptyTitle: 5,
};
export const PICKER_TOP_OFFSET = 4;
export const TABLE_ROW_HEIGHT = 33;
export const SCROLL_DEBOUNCE_MS = 150;
export const SEARCH_DEBOUNCE_MS = 200;
export const VIEWPORT_SIZE = 500;
export const VIEWPORT_PADDING = 250;

export const SPELLCHECK_FALSE_ATTRIBUTE = { spellCheck: false } as const;

// Copied from https://github.com/adobe/react-spectrum/blob/b2d25ef23b827ec2427bf47b343e6dbd66326ed3/packages/%40react-spectrum/list/src/ListView.tsx#L78
export const LIST_VIEW_ROW_HEIGHTS = {
  compact: {
    medium: 32,
    large: 40,
  },
  regular: {
    medium: 40,
    large: 50,
  },
  spacious: {
    medium: 48,
    large: 60,
  },
} as const;
