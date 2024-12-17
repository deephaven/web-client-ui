import React from 'react';

/**
 * Stub of a helper function to wrap a component with a replacement component. In this case though, it will just return the original component.
 *
 * @param Component The component to wrap
 * @returns The wrapped component
 */
export function createXComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return Component;
}

export default createXComponent;
