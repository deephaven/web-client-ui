import React from 'react';
import { render } from '@testing-library/react';
import { MultiSelect } from './MultiSelect';

// Track the props passed to MultiSelectNormalized.
let capturedProps: Record<string, unknown> = {};

const mockOnSearchTextChange = jest.fn();
const mockOnOpenChange = jest.fn();
const mockOnInputChange = jest.fn();

jest.mock('./utils', () => ({
  useMultiPickerProps: jest.fn((props: Record<string, unknown>) => ({
    ...props,
    normalizedItems: [],
    showItemIcons: false,
    selectedItemLabels: new Map(),
    onChange: jest.fn(),
    onScroll: jest.fn(),
    onSearchTextChange: mockOnSearchTextChange,
    onInputChange: mockOnInputChange,
    onOpenChange: mockOnOpenChange,
  })),
}));

jest.mock('@deephaven/components', () => ({
  MultiSelectNormalized: jest.fn((props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="multi-select-normalized" />;
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  capturedProps = {};
  expect.hasAssertions();
});

describe('jsapi-components MultiSelect', () => {
  it('renders MultiSelectNormalized', () => {
    const { getByTestId } = render(
      <MultiSelect table={{} as never} onChange={jest.fn()} />
    );
    expect(getByTestId('multi-select-normalized')).toBeInTheDocument();
  });

  it('clears search text on input change when closed', () => {
    render(<MultiSelect table={{} as never} onChange={jest.fn()} />);
    const onInputChange = capturedProps.onInputChange as (v: string) => void;

    onInputChange('hello');

    // When closed, search text should be cleared
    expect(mockOnSearchTextChange).toHaveBeenCalledWith('');
  });

  it('applies search text on input change when open', () => {
    render(<MultiSelect table={{} as never} onChange={jest.fn()} />);
    const onInputChange = capturedProps.onInputChange as (v: string) => void;
    const onOpenChange = capturedProps.onOpenChange as (
      isOpen: boolean
    ) => void;

    // Open the dropdown
    onOpenChange(true);
    mockOnSearchTextChange.mockClear();

    // Simulate typing while open
    onInputChange('hello');

    expect(mockOnSearchTextChange).toHaveBeenCalledWith('hello');
  });

  it('clears search text on close', () => {
    render(<MultiSelect table={{} as never} onChange={jest.fn()} />);
    const onOpenChange = capturedProps.onOpenChange as (
      isOpen: boolean
    ) => void;

    // Open then close
    onOpenChange(true);
    mockOnSearchTextChange.mockClear();
    onOpenChange(false);

    expect(mockOnSearchTextChange).toHaveBeenCalledWith('');
  });

  it('restores search text when opened by input', () => {
    render(<MultiSelect table={{} as never} onChange={jest.fn()} />);
    const onInputChange = capturedProps.onInputChange as (v: string) => void;
    const onOpenChange = capturedProps.onOpenChange as (
      isOpen: boolean
    ) => void;

    // Type while closed (stores input value)
    onInputChange('test');
    mockOnSearchTextChange.mockClear();

    // Open — should restore the stored input value
    onOpenChange(true);

    expect(mockOnSearchTextChange).toHaveBeenCalledWith('test');
  });
});
