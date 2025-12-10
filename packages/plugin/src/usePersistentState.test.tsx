import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestUtils } from '@deephaven/test-utils';
import {
  type PersistentState,
  PersistentStateProvider,
} from './PersistentStateContext';
import usePersistentState, {
  type PersistentStateMigration,
} from './usePersistentState';

function BasicTestComponent({
  label,
  useInitializerFunction = false,
  type = 'test',
  version = 1,
  migrations,
}: {
  label: string;
  useInitializerFunction?: boolean;
  type?: string;
  version?: number;
  migrations?: PersistentStateMigration[];
}) {
  const [state, setState] = usePersistentState(
    useInitializerFunction ? () => `default-${label}` : `default-${label}`,
    {
      type,
      version,
      migrations,
    }
  );
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
  initialState?: PersistentState[];
  onChange?: (state: PersistentState[]) => void;
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
      expect.objectContaining({ state: 'default-foo' }),
      expect.objectContaining({ state: 'default-bar' }),
      expect.objectContaining({ state: 'default-baz' }),
    ]);
  });

  it('should support function state initializer if no previous initialState', () => {
    const mockOnChange = jest.fn();

    render(
      <>
        <BasicTestComponent label="foo" useInitializerFunction />
        <BasicTestComponent label="bar" useInitializerFunction />
        <BasicTestComponent label="baz" />
      </>,
      {
        wrapper: createWrapper({ onChange: mockOnChange }),
      }
    );

    expect(screen.getByText('default-foo')).toBeInTheDocument();
    expect(screen.getByText('default-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ state: 'default-foo' }),
      expect.objectContaining({ state: 'default-bar' }),
      expect.objectContaining({ state: 'default-baz' }),
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
      expect.objectContaining({ state: 'default-foo' }),
      expect.objectContaining({ state: 'updated-bar' }),
      expect.objectContaining({ state: 'default-baz' }),
    ]);
  });

  it('should use persisted state if available', () => {
    render(FooBarBaz, {
      wrapper: createWrapper({
        initialState: [
          { type: 'test', version: 1, state: 'persisted-foo' },
          { type: 'test', version: 1, state: 'persisted-bar' },
        ],
      }),
    });

    expect(screen.getByText('persisted-foo')).toBeInTheDocument();
    expect(screen.getByText('persisted-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();
  });

  it('should persist explicit undefined', () => {
    render(FooBarBaz, {
      wrapper: createWrapper({
        initialState: [
          { type: 'test', version: 1, state: undefined },
          { type: 'test', version: 1, state: 'persisted-bar' },
        ],
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

    expect(mockOnChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ state: 'updated-foo' }),
      expect.objectContaining({ state: 'default-baz' }),
    ]);
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
      expect.objectContaining({ state: 'default-foo' }),
      expect.objectContaining({ state: 'updated-bar' }),
      expect.objectContaining({ state: 'default-baz' }),
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
      const [state, setState] = usePersistentState('default', {
        type: 'test',
        version: 1,
      });
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
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ state: 'updated' }),
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should throw if the types do not match', () => {
    TestUtils.disableConsoleOutput('error');

    const mockOnChange = jest.fn();

    expect(() =>
      render(<BasicTestComponent label="foo" type="test2" />, {
        wrapper: createWrapper({
          initialState: [{ type: 'test', version: 1, state: 'persisted-foo' }],
          onChange: mockOnChange,
        }),
      })
    ).toThrowError(/type mismatch/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});

describe('usePersistentState migrations', () => {
  test('should migrate state when version changes', () => {
    const mockOnChange = jest.fn();

    const initialState = [
      {
        type: 'test',
        version: 1,
        state: 'v1',
      },
    ];

    const migrations = [
      {
        from: 1,
        migrate: () => 'v2',
      },
    ];

    render(
      <BasicTestComponent label="foo" version={2} migrations={migrations} />,
      {
        wrapper: createWrapper({ initialState, onChange: mockOnChange }),
      }
    );

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ state: 'v2' }),
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('should migrate state when version changes multiple versions', () => {
    const mockOnChange = jest.fn();

    const initialState = [
      {
        type: 'test',
        version: 1,
        state: 'v1',
      },
    ];

    const migrations = [
      {
        from: 1,
        migrate: () => 'v2',
      },
      {
        from: 2,
        migrate: () => 'v3',
      },
    ];

    render(
      <BasicTestComponent label="foo" version={3} migrations={migrations} />,
      {
        wrapper: createWrapper({ initialState, onChange: mockOnChange }),
      }
    );

    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ state: 'v3' }),
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('should throw an error if migration is not found', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      {
        type: 'test',
        version: 1,
        state: 'v1',
      },
    ];

    const migrations = [
      {
        from: 1,
        migrate: () => 'v2',
      },
    ];

    expect(() =>
      render(
        <BasicTestComponent label="foo" version={3} migrations={migrations} />,
        {
          wrapper: createWrapper({ initialState, onChange: mockOnChange }),
        }
      )
    ).toThrowError(/No migration found/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw an error if multiple migrations from one version are found', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      {
        type: 'test',
        version: 1,
        state: 'v1',
      },
    ];

    const migrations = [
      {
        from: 1,
        migrate: () => 'v2',
      },
      {
        from: 1,
        migrate: () => 'v3',
      },
    ];

    expect(() =>
      render(
        <BasicTestComponent label="foo" version={2} migrations={migrations} />,
        {
          wrapper: createWrapper({ initialState, onChange: mockOnChange }),
        }
      )
    ).toThrowError(/Multiple migrations/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw an error if the migration function throws', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      {
        type: 'test',
        version: 1,
        state: 'v1',
      },
    ];

    const migrations = [
      {
        from: 1,
        migrate: () => {
          throw new Error('Migration error');
        },
      },
    ];

    expect(() =>
      render(
        <BasicTestComponent label="foo" version={2} migrations={migrations} />,
        {
          wrapper: createWrapper({ initialState, onChange: mockOnChange }),
        }
      )
    ).toThrowError(/Error migrating persisted state/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw if the persisted version is greater than the hook', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      {
        type: 'test',
        version: 2,
        state: 'v2',
      },
    ];

    expect(() =>
      render(<BasicTestComponent label="foo" version={1} />, {
        wrapper: createWrapper({ initialState, onChange: mockOnChange }),
      })
    ).toThrowError(/newer version/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
