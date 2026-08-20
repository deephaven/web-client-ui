import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FilterInputField from './FilterInputField';

function renderFilterInput(value: string, onChange = jest.fn()) {
  return render(
    <FilterInputField value={value} onChange={onChange} debounceMs={1000} />
  );
}

describe('FilterInputField', () => {
  it('updates the editor when the external value changes', () => {
    const { container, rerender } = renderFilterInput('initial');
    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { value: 'draft' } });
    rerender(
      <FilterInputField
        value="accepted"
        onChange={jest.fn()}
        debounceMs={1000}
      />
    );

    expect(input).toHaveValue('accepted');
  });

  it('preserves in-progress text when the external value is unchanged', () => {
    const onChange = jest.fn();
    const { container, rerender } = renderFilterInput('initial', onChange);
    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { value: 'draft' } });
    rerender(
      <FilterInputField value="initial" onChange={onChange} debounceMs={1000} />
    );

    expect(input).toHaveValue('draft');
  });

  it('uses the latest external value as the cancel baseline', () => {
    const onChange = jest.fn();
    const { container, rerender } = renderFilterInput('initial', onChange);
    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    rerender(
      <FilterInputField
        value="accepted"
        onChange={onChange}
        debounceMs={1000}
      />
    );
    fireEvent.change(input!, { target: { value: 'draft' } });
    fireEvent.keyDown(input!, { key: 'Escape' });

    expect(onChange).toHaveBeenLastCalledWith('accepted');
  });
});
