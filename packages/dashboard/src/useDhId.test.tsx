import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useDhId, DH_ID_PROP } from './useDhId';
import { PanelIdContext } from './usePanelId';
import { FiberProvider } from './useFiber';

describe('useDhId', () => {
  it('should use __dhId prop if no context', () => {
    const mockDhId = 'test-dh-id';

    const { result } = renderHook(() => useDhId(), {
      wrapper: ({ children }) => (
        <FiberProvider>
          {React.Children.map(children, c => {
            if (React.isValidElement(c)) {
              return React.cloneElement(c, { [DH_ID_PROP]: mockDhId });
            }
            return c;
          })}
        </FiberProvider>
      ),
    });

    expect(result.current).toBe(mockDhId);
  });

  it('should use __dhId prop over context if both exist', () => {
    const mockDhId = 'test-dh-id';
    const mockContextDhId = 'context-dh-id';

    const { result } = renderHook(() => useDhId(), {
      wrapper: ({ children }) => (
        <FiberProvider>
          <PanelIdContext.Provider value={mockContextDhId}>
            {React.Children.map(children, c => {
              if (React.isValidElement(c)) {
                return React.cloneElement(c, { [DH_ID_PROP]: mockDhId });
              }
              return c;
            })}
          </PanelIdContext.Provider>
        </FiberProvider>
      ),
    });

    expect(result.current).toBe(mockDhId);
  });

  it('should use the context value if no __dhId prop', () => {
    const mockDhId = 'test-dh-id';

    const { result } = renderHook(() => useDhId(), {
      wrapper: ({ children }) => (
        <FiberProvider>
          <PanelIdContext.Provider value={mockDhId}>
            {children}
          </PanelIdContext.Provider>
        </FiberProvider>
      ),
    });

    expect(result.current).toBe(mockDhId);
  });

  it('should return null if no __dhId prop and no context', () => {
    const { result } = renderHook(() => useDhId(), {
      wrapper: ({ children }) => <FiberProvider>{children}</FiberProvider>,
    });

    expect(result.current).toBe(null);
  });

  it('should throw an error if __dhId is not a string', () => {
    const { result } = renderHook(() => useDhId(), {
      wrapper: ({ children }) => (
        <FiberProvider>
          {React.Children.map(children, c => {
            if (React.isValidElement(c)) {
              return React.cloneElement(c, { [DH_ID_PROP]: 42 });
            }
            return c;
          })}
        </FiberProvider>
      ),
    });

    expect(result.error?.message).toMatch(/to be a string/);
  });
});
