import { memoizeClear } from '@deephaven/grid';
import {
  dhSortDown,
  dhSortUp,
  vsTriangleDown,
  vsTriangleRight,
  vsLinkExternal,
  IconDefinition,
} from '@deephaven/icons';

export const ICON_SIZE = 16;

export type IconName =
  | 'sortUp'
  | 'sortDown'
  | 'caretDown'
  | 'caretRight'
  | 'cellOverflow';

const iconMap = new Map<IconName, IconDefinition>([
  ['sortUp', dhSortUp],
  ['sortDown', dhSortDown],
  ['caretDown', vsTriangleDown],
  ['caretRight', vsTriangleRight],
  ['cellOverflow', vsLinkExternal],
]);

const makeIcon = memoizeClear(
  (name: IconName) => {
    const faIcon = iconMap.get(name);
    if (faIcon === undefined) {
      throw new Error('Icon is undefined');
    }

    const path = Array.isArray(faIcon.icon[4])
      ? faIcon.icon[4][0]
      : faIcon.icon[4];
    const icon = new Path2D(path);
    const scaledIcon = new Path2D();
    const scaleMatrix = {
      a: ICON_SIZE / faIcon.icon[0],
      d: ICON_SIZE / faIcon.icon[1],
    };
    scaledIcon.addPath(icon, scaleMatrix);
    return scaledIcon;
  },
  { max: 1000 }
);

export function getIcon(name: IconName): Path2D {
  return makeIcon(name);
}
