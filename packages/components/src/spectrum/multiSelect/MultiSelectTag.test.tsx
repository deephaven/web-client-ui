import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectTag } from './MultiSelectTag';

// CrossSmall icon is imported from @spectrum-icons/ui
jest.mock('@spectrum-icons/ui/CrossSmall', () => {
  function MockCrossSmall(): JSX.Element {
    return <span data-testid="cross-icon" />;
  }
  MockCrossSmall.displayName = 'CrossSmall';
  return { __esModule: true, default: MockCrossSmall };
});

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('MultiSelectTag', () => {
  it('renders the label text', () => {
    render(
      <MultiSelectTag
        tagKey="key1"
        label="Tag Label"
        isDisabled={false}
        isReadOnly={false}
        onRemove={jest.fn()}
      />
    );
    expect(screen.getByText('Tag Label')).toBeInTheDocument();
  });

  it('renders remove button when not disabled and not read-only', () => {
    render(
      <MultiSelectTag
        tagKey="key1"
        label="Tag Label"
        isDisabled={false}
        isReadOnly={false}
        onRemove={jest.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Remove Tag Label' })
    ).toBeInTheDocument();
  });

  it('does not render remove button when isDisabled', () => {
    render(
      <MultiSelectTag
        tagKey="key1"
        label="Tag Label"
        isDisabled
        isReadOnly={false}
        onRemove={jest.fn()}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render remove button when isReadOnly', () => {
    render(
      <MultiSelectTag
        tagKey="key1"
        label="Tag Label"
        isDisabled={false}
        isReadOnly
        onRemove={jest.fn()}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRemove with the tag key when remove button is clicked', async () => {
    const onRemove = jest.fn();
    render(
      <MultiSelectTag
        tagKey="key1"
        label="Tag Label"
        isDisabled={false}
        isReadOnly={false}
        onRemove={onRemove}
      />
    );

    const removeBtn = screen.getByRole('button', { name: 'Remove Tag Label' });
    await userEvent.click(removeBtn);

    expect(onRemove).toHaveBeenCalledWith('key1');
  });
});
