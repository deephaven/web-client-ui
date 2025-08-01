import React, { useContext } from 'react';

/** Type for an extended component. Can fetch the original component using `.Original` */
export type XComponentType<P extends Record<string, unknown>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<unknown>
  > & {
    Original: React.ComponentType<P>;
    isXComponent: boolean;
  };

export const XComponentMapContext = React.createContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new Map<React.ComponentType<any>, React.ComponentType<any>>()
);
XComponentMapContext.displayName = 'XComponentMapContext';

export const XComponentMapProvider = XComponentMapContext.Provider;

/**
 * Use the replacement component for the provided component if it exists, or just return the provided component.
 * @param Component Component to check if there's a replacement for
 * @returns The replacement component if it exists, otherwise the original component
 */
export function useXComponent<P extends Record<string, unknown>>(
  Component: XComponentType<P>
): React.ComponentType<P> {
  const ctx = useContext(XComponentMapContext);
  return ctx.get(Component) ?? Component.Original;
}
