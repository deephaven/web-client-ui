import React, {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import { ForwardRef } from 'react-is';

export type Props = Record<string, unknown> | RefAttributes<unknown>;

/**
 * Type that represents a component that has been wrapped by another component.
 */
export type WrappedComponentType<
  P extends Props,
  C extends ComponentType<P>,
> = ComponentType<P> & {
  WrappedComponent: C;
};

/**
 * Checks if a component is a wrapped component.
 * @param Component The component to check
 * @returns Whether the component is a wrapped component or not
 */
export function isWrappedComponent<P extends Props, C extends ComponentType<P>>(
  Component: React.ComponentType<P>
): Component is WrappedComponentType<P, C> {
  return (
    (Component as WrappedComponentType<P, C>)?.WrappedComponent !== undefined
  );
}

/**
 * Checks if a component is a class component.
 * @param Component The component to check
 * @returns Whether the component is a class component or not
 */
export function isClassComponent<P extends Props>(
  Component: React.ComponentType<P>
): Component is React.ComponentClass<P> {
  if (isWrappedComponent(Component)) {
    return isClassComponent(Component.WrappedComponent);
  }
  return (
    (Component as React.ComponentClass<P>).prototype != null &&
    (Component as React.ComponentClass<P>).prototype.isReactComponent != null
  );
}

/**
 * Checks if a component is a forward ref component.
 * @param Component The component to check
 * @returns Whether the component is a forward ref component or not
 */
export function isForwardRefComponent<P extends Props>(
  Component: ComponentType<P>
): Component is ForwardRefExoticComponent<P> {
  return (
    !isWrappedComponent(Component) &&
    '$$typeof' in Component &&
    Component.$$typeof === ForwardRef
  );
}

/**
 * Checks if a component can have a ref.
 * @param Component The component to check
 * @returns Whether the component can have a ref or not
 */
export function canHaveRef<P extends Props>(
  Component: ComponentType<P> | WrappedComponentType<P, ComponentType<P>>
): boolean {
  return isClassComponent(Component) || isForwardRefComponent(Component);
}
