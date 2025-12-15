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
import { FiberProvider } from './useFiber';
import { PanelIdContext } from './usePanelId';

function BasicTestComponent({
  label,
  useInitializerFunction = false,
  type = `test-${label}`,
  version = 1,
  migrations,
  deleteOnUnmount,
}: {
  label: string;
  useInitializerFunction?: boolean;
  type?: string;
  version?: number;
  migrations?: PersistentStateMigration[];
  deleteOnUnmount?: boolean;
}) {
  const [state, setState] = usePersistentState(
    useInitializerFunction ? () => `default-${label}` : `default-${label}`,
    {
      type,
      version,
      migrations,
      deleteOnUnmount,
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
  initialState?: [string, PersistentState][];
  onChange?: (state: [string, PersistentState][]) => void;
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FiberProvider>
        <PanelIdContext.Provider value="test-panel">
          <PersistentStateProvider
            initialState={initialState}
            onChange={onChange}
          >
            {children}
          </PersistentStateProvider>
        </PanelIdContext.Provider>
      </FiberProvider>
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
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'default-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'default-bar' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
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
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'default-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'default-bar' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
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
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'default-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'updated-bar' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
    ]);
  });

  it('should use persisted state if available', () => {
    render(FooBarBaz, {
      wrapper: createWrapper({
        initialState: [
          [
            'test-panel::test-foo',
            { type: 'test-foo', version: 1, state: 'persisted-foo' },
          ],
          [
            'test-panel::test-bar',
            { type: 'test-bar', version: 1, state: 'persisted-bar' },
          ],
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
          [
            'test-panel::test-foo',
            { type: 'test-foo', version: 1, state: undefined },
          ],
          [
            'test-panel::test-bar',
            { type: 'test-bar', version: 1, state: 'persisted-bar' },
          ],
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
        <span>FizzBuzz</span>
        <div>
          <BasicTestComponent label="baz" />
        </div>
      </>
    );

    expect(screen.queryByText('default-baz')).toBeInTheDocument();

    expect(mockOnChange).toHaveBeenLastCalledWith([
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'updated-foo' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
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
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'default-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'updated-bar' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
    ]);
  });

  it('should behave as normal useState if no context', async () => {
    render(<FiberProvider>{FooBarBaz}</FiberProvider>);
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
        type: 'test-foo',
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
      ['test-panel::test-foo', expect.objectContaining({ state: 'updated' })],
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should throw if multiple hooks register the same state type for the same panel', () => {
    TestUtils.disableConsoleOutput('error');

    expect(() =>
      render(
        <>
          <BasicTestComponent label="foo" type="foo" />
          <BasicTestComponent label="bar" type="foo" />
        </>,
        { wrapper: createWrapper({}) }
      )
    ).toThrow(/Detected multiple persistent states of type foo/);
  });

  it('should persist state on unmount with deleteOnUnmount false', async () => {
    const mockOnChange = jest.fn();

    const { rerender } = render(
      <>
        <BasicTestComponent label="foo" deleteOnUnmount={false} />
        <BasicTestComponent label="bar" />
      </>,
      {
        wrapper: createWrapper({ onChange: mockOnChange }),
      }
    );

    mockOnChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Update foo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Update bar' }));

    expect(mockOnChange).toHaveBeenCalledTimes(2);

    mockOnChange.mockClear();
    rerender(<div>Nothing</div>);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenLastCalledWith([
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'updated-foo' }),
      ],
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    mockOnChange.mockClear();
    rerender(
      <>
        <BasicTestComponent label="foo" deleteOnUnmount={false} />
        <BasicTestComponent label="bar" />
      </>
    );

    expect(screen.getByText('updated-foo')).toBeInTheDocument();
    expect(screen.getByText('default-bar')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenLastCalledWith([
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'updated-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'default-bar' }),
      ],
    ]);
  });
});

describe('usePersistentState migrations', () => {
  test('should migrate state when version changes', () => {
    const mockOnChange = jest.fn();

    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 1,
          state: 'v1',
        },
      ],
    ] satisfies [string, PersistentState][];

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
      ['test-panel::test-foo', expect.objectContaining({ state: 'v2' })],
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('should migrate state when version changes multiple versions', () => {
    const mockOnChange = jest.fn();

    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 1,
          state: 'v1',
        },
      ],
    ] satisfies [string, PersistentState][];

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
      ['test-panel::test-foo', expect.objectContaining({ state: 'v3' })],
    ]);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('should throw an error if migration is not found', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 1,
          state: 'v1',
        },
      ],
    ] satisfies [string, PersistentState][];

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
    ).toThrow(/No migration found/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw an error if multiple migrations from one version are found', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 1,
          state: 'v1',
        },
      ],
    ] satisfies [string, PersistentState][];

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
    ).toThrow(/Multiple migrations/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw an error if the migration function throws', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 1,
          state: 'v1',
        },
      ],
    ] satisfies [string, PersistentState][];

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
    ).toThrow(/Error migrating persisted state/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should throw if the persisted version is greater than the hook', () => {
    TestUtils.disableConsoleOutput('error');
    const mockOnChange = jest.fn();
    const initialState = [
      [
        'test-panel::test-foo',
        {
          type: 'test-foo',
          version: 2,
          state: 'v2',
        },
      ],
    ] satisfies [string, PersistentState][];

    expect(() =>
      render(<BasicTestComponent label="foo" version={1} />, {
        wrapper: createWrapper({ initialState, onChange: mockOnChange }),
      })
    ).toThrow(/newer version/);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('migrates from render-order based initial state to map-based', () => {
    const mockOnChange = jest.fn();

    // Intentional cast so we can enforce all other tests use the new format
    const initialState = [
      { type: 'test-foo', version: 1, state: 'persisted-foo' },
      { type: 'test-bar', version: 1, state: 'persisted-bar' },
    ] as unknown as [string, PersistentState][];

    render(FooBarBaz, {
      wrapper: createWrapper({ initialState, onChange: mockOnChange }),
    });

    expect(screen.getByText('persisted-foo')).toBeInTheDocument();
    expect(screen.getByText('persisted-bar')).toBeInTheDocument();
    expect(screen.getByText('default-baz')).toBeInTheDocument();

    expect(mockOnChange).toHaveBeenLastCalledWith([
      [
        'test-panel::test-foo',
        expect.objectContaining({ state: 'persisted-foo' }),
      ],
      [
        'test-panel::test-bar',
        expect.objectContaining({ state: 'persisted-bar' }),
      ],
      [
        'test-panel::test-baz',
        expect.objectContaining({ state: 'default-baz' }),
      ],
    ]);
  });
});
