import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersistentStateProvider } from './PersistentStateContext';
import usePersistentState from './usePersistentState';

function BasicTestComponent({ label }: { label: string }) {
  const [state, setState] = usePersistentState(`default-${label}`);
  return (
    <div>
      <span>{`${state}`}</span>
      <button type="button" onClick={() => setState(`updated-${label}`)}>
        Update {label}
      </button>
    </div>
  );
}

const FooBarBaz = (
  <>
    <BasicTestComponent label="foo" />
    <span>FizzBuzz</span>
    <BasicTestComponent label="bar" />
    <div>
      <BasicTestComponent label="baz" />
    </div>
  </>
);

function createWrapper({
  initialState = [],
  onChange = jest.fn(),
}: {
  initialState?: unknown[];
  onChange?: (state: unknown[]) => void;
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PersistentStateProvider initialState={initialState} onChange={onChange}>
        {children}
      </PersistentStateProvider>
    );
  };
}

describe('usePersistentState', () => {
  it('should initialize state if no previous initialState', () => {
    const mockOnChange = jest.fn();

    render(FooBarBaz, {
      wrapper: createWrapper({ onChange: mockOnChange }),
    });

    expect(screen.getByText('default-foo')).toBeInTheDocument();
    expect(screen.getByText('default-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith([
      'default-foo',
      'default-bar',
      'default-baz',
    ]);
  });

  it('should update state and trigger onChange', async () => {
    const mockOnChange = jest.fn();

    render(FooBarBaz, {
      wrapper: createWrapper({ onChange: mockOnChange }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Update bar' }));

    expect(screen.getByText('updated-bar')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith([
      'default-foo',
      'updated-bar',
      'default-baz',
    ]);
  });

  it('should use persisted state if available', () => {
    render(FooBarBaz, {
      wrapper: createWrapper({
        initialState: ['persisted-foo', 'persisted-bar'],
      }),
    });

    expect(screen.getByText('persisted-foo')).toBeInTheDocument();
    expect(screen.getByText('persisted-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
  });

  it('should persist explicit undefined', () => {
    render(FooBarBaz, {
      wrapper: createWrapper({
        initialState: [undefined, 'persisted-bar'],
      }),
    });

    expect(screen.getByText('undefined')).toBeInTheDocument();
    expect(screen.getByText('persisted-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
  });

  it('should trigger onChange when a component unmounts', async () => {
    const mockOnChange = jest.fn();

    const { rerender } = render(FooBarBaz, {
      wrapper: createWrapper({ onChange: mockOnChange }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Update foo' }));

    rerender(
      <>
        <BasicTestComponent label="foo" />
        <div>
          <BasicTestComponent label="baz" />
        </div>
      </>
    );

    expect(mockOnChange).toHaveBeenCalledWith(['updated-foo', 'default-baz']);
  });

  it('should collect all state even if a component is memoized', async () => {
    const mockOnChange = jest.fn();

    const MemoizedComponent = React.memo(BasicTestComponent);

    render(
      <>
        <MemoizedComponent label="foo" />
        <span>FizzBuzz</span>
        <BasicTestComponent label="bar" />
        <div>
          <BasicTestComponent label="baz" />
        </div>
      </>,
      {
        wrapper: createWrapper({ onChange: mockOnChange }),
      }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update bar' }));

    expect(mockOnChange).toHaveBeenCalledWith([
      'default-foo',
      'updated-bar',
      'default-baz',
    ]);
  });

  it('should behave as normal useState if no context', async () => {
    render(FooBarBaz);
    expect(screen.getByText('default-foo')).toBeInTheDocument();
    expect(screen.getByText('default-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
    expect(screen.getByText('FizzBuzz')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Update bar' }));
    expect(screen.getByText('updated-bar')).toBeInTheDocument();
  });

  it('should handle a component that conditionally calls setState in its render function', () => {
    function ConditionalSetStateComponent() {
      const [state, setState] = usePersistentState('default');
      if (state === 'default') {
        setState('updated');
      }
      return <span>{state}</span>;
    }

    const mockOnChange = jest.fn();
    render(<ConditionalSetStateComponent />, {
      wrapper: createWrapper({ onChange: mockOnChange }),
    });

    expect(screen.getByText('updated')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith(['updated']);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});
