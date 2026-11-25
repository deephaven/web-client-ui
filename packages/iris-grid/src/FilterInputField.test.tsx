import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import FilterInputField from './FilterInputField';

function renderFilterInput(value: string, onChange = jest.fn()) {
  return render(
    <FilterInputField value={value} onChange={onChange} debounceMs={1000} />
  );
}

describe('FilterInputField', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates the editor when the external value changes without edits', () => {
    const { container, rerender } = renderFilterInput('initial');
    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    rerender(
      <FilterInputField
        value="accepted"
        onChange={jest.fn()}
        debounceMs={1000}
      />
    );

    expect(input).toHaveValue('accepted');
  });

  it('keeps typed text and queued updates when a stale value echoes back', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const { container, rerender } = renderFilterInput('', onChange);
    const input = container.querySelector('input');
    expect(input).toHaveFocus();

    fireEvent.change(input!, { target: { value: 'LIZ' } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onChange).toHaveBeenLastCalledWith('LIZ');

    fireEvent.change(input!, { target: { value: 'LIZARD' } });
    rerender(
      <FilterInputField value="LIZ" onChange={onChange} debounceMs={1000} />
    );
    expect(input).toHaveValue('LIZARD');

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onChange).toHaveBeenLastCalledWith('LIZARD');
    expect(input).toHaveValue('LIZARD');
  });

  it('syncs to the latest external value on blur', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const { container, rerender } = renderFilterInput('', onChange);
    const input = container.querySelector('input');

    fireEvent.change(input!, { target: { value: 'draft' } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(
      <FilterInputField value="server" onChange={onChange} debounceMs={1000} />
    );
    expect(input).toHaveValue('draft');

    const other = document.createElement('button');
    document.body.appendChild(other);
    act(() => {
      other.focus();
    });
    expect(input).toHaveValue('server');
    other.remove();
  });

  it('cancels queued updates when the value is reset with setValue', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const ref = React.createRef<FilterInputField>();
    const { container } = render(
      <FilterInputField
        ref={ref}
        value="initial"
        onChange={onChange}
        debounceMs={1000}
      />
    );
    const input = container.querySelector('input');

    fireEvent.change(input!, { target: { value: 'draft' } });
    act(() => {
      ref.current!.setValue('');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(input).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();
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
