/* eslint-disable react/jsx-props-no-spreading */
import {
  ComponentType,
  ForwardedRef,
  forwardRef,
  PropsWithoutRef,
  RefAttributes,
  useContext,
} from 'react';
import { ChartTheme } from './ChartTheme';

import {
  ChartThemeContext,
  ChartThemeContextValue,
} from './ChartThemeProvider';

/**
 * Hook to get the current `ChartThemeContextValue`.
 */
export function useChartTheme(): ChartThemeContextValue | null {
  return useContext(ChartThemeContext);
}

export type PropsWithChartTheme<P extends object> = P & {
  chartTheme: ChartTheme;
};

export type ComponentWithChartTheme<
  P extends object,
  T,
> = React.ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> & {
  WrappedComponent?: ComponentType<PropsWithChartTheme<P>>;
};

/**
 * HOC for wrapping a given component in a `ChartThemeContext` provider.
 * @param Component
 */
export function withChartTheme<P extends object, T>(
  Component: ComponentType<PropsWithChartTheme<P>>
): ComponentWithChartTheme<P, T> {
  /**
   * Wrapper component that passes the current `ChartTheme` context value to the
   * wrapped component.
   * @param props Props to pass to the wrapped component
   * @param ref Ref to pass to the wrapped component
   */
  function WithChartTheme(props: P, ref: ForwardedRef<T>): JSX.Element {
    const chartTheme = useChartTheme();

    if (chartTheme == null) {
      throw new Error(
        'ChartTheme is null, did you forget to wrap your component in a ChartThemeProvider?'
      );
    }

    return <Component ref={ref} {...props} chartTheme={chartTheme} />;
  }

  const WithChartThemeForwardRef: ComponentWithChartTheme<P, T> =
    forwardRef(WithChartTheme);

  // Mimicking Redux connect HOC api since some utils check for the existence
  // of this property to identify a wrapped component
  WithChartThemeForwardRef.WrappedComponent = Component;

  return WithChartThemeForwardRef;
}
