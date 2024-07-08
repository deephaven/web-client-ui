export const ITEM_KEY_PREFIX = 'DH_ITEM_KEY';
export const SCROLL_DEBOUNCE_MS = 150;
export const SEARCH_DEBOUNCE_MS = 200;
export const SPELLCHECK_FALSE_ATTRIBUTE = { spellCheck: false } as const;
export const VIEWPORT_PADDING = 250;
export const VIEWPORT_SIZE = 500;

/** @deprecated Use `ACTION_ICON_HEIGHT` from `@deephaven/components` instead. */
export const ACTION_ICON_HEIGHT = 24;

/** @deprecated Use `LIST_VIEW_ROW_HEIGHTS` from `@deephaven/components` instead. */
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

/** @deprecated Use `PICKER_ITEM_HEIGHTS` from `@deephaven/components` instead. */
// https://github.com/adobe/react-spectrum/blob/main/packages/%40react-spectrum/listbox/src/ListBoxBase.tsx#L56
export const PICKER_ITEM_HEIGHTS = {
  medium: 32,
  large: 48,
} as const;

/** @deprecated Use `PICKER_TOP_OFFSET` from `@deephaven/components` instead. */
export const PICKER_TOP_OFFSET = 4;

/** @deprecated Use `TABLE_ROW_HEIGHT` from `@deephaven/components` instead. */
export const TABLE_ROW_HEIGHT = 33;
