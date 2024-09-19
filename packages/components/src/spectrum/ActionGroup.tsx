import { useMemo } from 'react';
import {
  ActionGroup as SpectrumActionGroup,
  type SpectrumActionGroupProps,
} from '@adobe/react-spectrum';
import cl from 'classnames';
import { type ItemsOrPrimitiveChildren } from './shared';
import { type MultipleItemSelectionProps, wrapItemChildren } from './utils';

export type ActionGroupProps<T> = Omit<
  SpectrumActionGroupProps<T>,
  | 'children'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'disabledKeys'
  | 'onSelectionChange'
> &
  MultipleItemSelectionProps & {
    children: ItemsOrPrimitiveChildren<T>;
  };

/**
 * Augmented version of the Spectrum ActionGroup component that supports
 * primitive item children.
 */
export function ActionGroup<T>({
  defaultSelectedKeys,
  disabledKeys,
  children,
  selectedKeys,
  UNSAFE_className,
  onChange,
  onSelectionChange,
  ...props
}: ActionGroupProps<T>): JSX.Element {
  const wrappedChildren = useMemo(
    () =>
      typeof children === 'function'
        ? children
        : wrapItemChildren(children, null),
    [children]
  );

  return (
    <SpectrumActionGroup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      UNSAFE_className={cl('dh-action-group', UNSAFE_className)}
      defaultSelectedKeys={
        defaultSelectedKeys as SpectrumActionGroupProps<T>['defaultSelectedKeys']
      }
      disabledKeys={disabledKeys as SpectrumActionGroupProps<T>['disabledKeys']}
      selectedKeys={selectedKeys as SpectrumActionGroupProps<T>['selectedKeys']}
      onSelectionChange={onChange ?? onSelectionChange}
    >
      {wrappedChildren}
    </SpectrumActionGroup>
  );
}

export default ActionGroup;
