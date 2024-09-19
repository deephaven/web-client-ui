import { useMemo } from 'react';
import {
  ActionMenu as SpectrumActionMenu,
  type SpectrumActionMenuProps,
} from '@adobe/react-spectrum';
import cl from 'classnames';
import { type ItemsOrPrimitiveChildren } from './shared';
import { type ItemKey, wrapItemChildren } from './utils';

export type ActionMenuProps<T> = Omit<
  SpectrumActionMenuProps<T>,
  'children' | 'disabledKeys'
> & {
  disabledKeys?: Iterable<ItemKey>;
  children: ItemsOrPrimitiveChildren<T>;
};

/**
 * Augmented version of the Spectrum ActionMenu component that supports
 * primitive item children.
 */
export function ActionMenu<T>({
  disabledKeys,
  children,
  UNSAFE_className,
  ...props
}: ActionMenuProps<T>): JSX.Element {
  const wrappedChildren = useMemo(
    () =>
      typeof children === 'function'
        ? children
        : wrapItemChildren(children, null),
    [children]
  );

  return (
    <SpectrumActionMenu
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      UNSAFE_className={cl('dh-action-menu', UNSAFE_className)}
      disabledKeys={disabledKeys as SpectrumActionMenuProps<T>['disabledKeys']}
    >
      {wrappedChildren}
    </SpectrumActionMenu>
  );
}

export default ActionMenu;
