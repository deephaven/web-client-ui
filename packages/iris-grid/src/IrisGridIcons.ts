import { memoizeClear } from '@deephaven/grid';
import {
  vsTriangleDown,
  vsTriangleRight,
  vsTriangleUp,
  vsLinkExternal,
  type IconDefinition,
} from '@deephaven/icons';

export type IconName =
  | 'sortUp'
  | 'sortDown'
  | 'caretDown'
  | 'caretRight'
  | 'cellOverflow';

const iconMap = new Map<IconName, IconDefinition>([
  ['sortUp', vsTriangleUp],
  ['sortDown', vsTriangleDown],
  ['caretDown', vsTriangleDown],
  ['caretRight', vsTriangleRight],
  ['cellOverflow', vsLinkExternal],
]);

const makeIcon = memoizeClear(
  (name: IconName, size: number) => {
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
      a: size / faIcon.icon[0],
      d: size / faIcon.icon[1],
    };
    scaledIcon.addPath(icon, scaleMatrix);
    return scaledIcon;
  },
  { max: 1000 }
);

export function getIcon(name: IconName, size: number): Path2D {
  return makeIcon(name, size);
}
