import React from 'react';
import { useXComponent, XComponentType } from './XComponentMap';

/**
 * Helper function that will wrap the provided component, and return an ExtendableComponent type.
 * Whenever that ExtendableComponent is used, it will check if there is a replacement component for the provided component on the context.
 * If there is, it will use that component instead of the provided component.
 * This is a similar concept to how swizzling is done in Docusaurus or obj-c, but for any React component.
 *
 * Usage:
 *
 * ```tsx
 * function MyComponent() {
 *   return <div>MyComponent</div>;
 * }
 * const XMyComponent = extendableComponent(MyComponent);
 *
 *
 * function MyReplacementComponent() {
 *  return <div>MyReplacementComponent</div>;
 * }
 *
 *
 * ...
 *
 * <XMyComponent /> // Will render MyComponent
 *
 * ...
 *
 * <XComponentMapProvider value={new Map([[XMyComponent, MyReplacementComponent]])}>
 *   <XMyComponent /> // Will render MyReplacementComponent
 * </XComponentMapProvider>
 *
 * ```
 *
 * Is useful in cases where we have a component deep down in the component tree that we want to replace with a different component, but don't want to
 * have to provide props at the top level just to hook into that.
 *
 * @param Component The component to wrap
 * @returns The wrapped component
 */
export function createXComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): XComponentType<P> {
  const XComponent = function ExtendableComponent(props: P): JSX.Element {
    const ReplacementComponent = useXComponent(XComponent);
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ReplacementComponent {...props} />;
  };

  XComponent.Original = Component;
  XComponent.isXComponent = true;

  return XComponent;
}

export default createXComponent;
