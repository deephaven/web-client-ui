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

export function withChartTheme<P extends object, T>(
  Component: ComponentType<P & { chartTheme: ChartTheme }>
): React.ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> & {
  WrappedComponent?: ComponentType<P & { chartTheme: ChartTheme }>;
} {
  function WithChartTheme(props: P, ref: ForwardedRef<T>): JSX.Element {
    const chartTheme = useChartTheme();

    if (chartTheme == null) {
      throw new Error(
        'ChartTheme is null, did you forget to wrap your component in a ChartThemeProvider?'
      );
    }

    return <Component ref={ref} {...props} chartTheme={chartTheme} />;
  }

  const WithChartThemeForwardRef: React.ForwardRefExoticComponent<
    PropsWithoutRef<P> & RefAttributes<T>
  > & {
    WrappedComponent?: ComponentType<P & { chartTheme: ChartTheme }>;
  } = forwardRef(WithChartTheme);

  WithChartThemeForwardRef.WrappedComponent = Component;

  return WithChartThemeForwardRef;
}
