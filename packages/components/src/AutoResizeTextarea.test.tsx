import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AutoResizeTextarea from './AutoResizeTextarea';

function renderTextarea(
  props: Partial<React.ComponentProps<typeof AutoResizeTextarea>> = {}
) {
  const {
    value = '',
    onChange = jest.fn(),
    className,
    spellCheck,
    placeholder,
    disabled,
    delimiter,
    id,
  } = props;
  return render(
    <AutoResizeTextarea
      value={value}
      onChange={onChange}
      className={className}
      spellCheck={spellCheck}
      placeholder={placeholder}
      disabled={disabled}
      delimiter={delimiter}
      id={id}
      data-testid="auto-resize-textarea"
    />
  );
}

function getTextarea() {
  return screen.getByTestId('auto-resize-textarea') as HTMLTextAreaElement;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AutoResizeTextarea', () => {
  it('renders with the provided value', () => {
    renderTextarea({ value: 'hello world' });
    expect(getTextarea()).toHaveValue('hello world');
  });

  it('calls onChange when text is typed', async () => {
    const onChange = jest.fn();
    renderTextarea({ onChange });
    const textarea = getTextarea();

    fireEvent.change(textarea, { target: { value: 'new text' } });

    expect(onChange).toHaveBeenCalledWith('new text');
  });

  it('applies custom className', () => {
    renderTextarea({ className: 'my-class' });
    expect(getTextarea()).toHaveClass('my-class');
  });

  it('renders with placeholder', () => {
    renderTextarea({ placeholder: 'Enter text...' });
    expect(getTextarea()).toHaveAttribute('placeholder', 'Enter text...');
  });

  it('renders disabled when disabled prop is true', () => {
    renderTextarea({ disabled: true });
    expect(getTextarea()).toBeDisabled();
  });

  describe('with delimiter', () => {
    const DELIMITER = ' -';
    const IMPLODED_VALUE = '-Xmx512m -Xms256m -Dfoo=bar';
    const EXPLODED_VALUE = '-Xmx512m\n-Xms256m\n-Dfoo=bar';

    it('explodes value on focus', () => {
      renderTextarea({ value: IMPLODED_VALUE, delimiter: DELIMITER });
      const textarea = getTextarea();

      fireEvent.focus(textarea);

      expect(textarea).toHaveValue(EXPLODED_VALUE);
    });

    it('implodes value on blur', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: IMPLODED_VALUE,
        delimiter: DELIMITER,
        onChange,
      });
      const textarea = getTextarea();

      fireEvent.focus(textarea);
      fireEvent.blur(textarea);

      expect(onChange).toHaveBeenCalledWith(IMPLODED_VALUE);
    });

    it('calls onChange with imploded value during editing (not exploded)', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: IMPLODED_VALUE,
        delimiter: DELIMITER,
        onChange,
      });
      const textarea = getTextarea();

      // Focus to explode
      fireEvent.focus(textarea);

      // Simulate editing the exploded value
      const editedExploded = '-Xmx1024m\n-Xms256m\n-Dfoo=bar';
      fireEvent.change(textarea, { target: { value: editedExploded } });

      // onChange should receive the imploded version, not the exploded one
      expect(onChange).toHaveBeenCalledWith('-Xmx1024m -Xms256m -Dfoo=bar');
    });

    it('never passes exploded value to onChange on change events', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Xmx512m -Xms256m',
        delimiter: DELIMITER,
        onChange,
      });
      const textarea = getTextarea();

      fireEvent.focus(textarea);
      fireEvent.change(textarea, {
        target: { value: '-Xmx512m\n-Xms256m\n-Dnew=val' },
      });

      // The onChange value should never contain newlines when delimiter is set
      const calledWith = onChange.mock.calls[0][0];
      expect(calledWith).not.toContain('\n');
    });

    it('does not collapse exploded display when parent re-renders with imploded value', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <AutoResizeTextarea
          value={IMPLODED_VALUE}
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );
      const textarea = getTextarea();

      // Focus to explode
      fireEvent.focus(textarea);
      expect(textarea).toHaveValue(EXPLODED_VALUE);

      // Simulate typing a new arg (parent gets imploded value and re-renders)
      const editedExploded = '-Xmx512m\n-Xms256m\n-Dfoo=bar\n-Dnew=val';
      fireEvent.change(textarea, { target: { value: editedExploded } });

      // Parent re-renders with the imploded value from onChange
      const implodedFromOnChange = onChange.mock.calls[0][0];
      rerender(
        <AutoResizeTextarea
          value={implodedFromOnChange}
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );

      // The display should still show the exploded (multi-line) value, not collapse
      expect(textarea).toHaveValue(editedExploded);
    });

    it('explodes new prop value received while focused', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <AutoResizeTextarea
          value="-Xmx512m -Xms256m"
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );
      const textarea = getTextarea();

      fireEvent.focus(textarea);
      expect(textarea).toHaveValue('-Xmx512m\n-Xms256m');

      // Parent provides an entirely new value while still focused
      rerender(
        <AutoResizeTextarea
          value="-Xmx1024m -Xms512m -Dfoo=bar"
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );

      // Display should show the exploded version of the new prop value
      expect(textarea).toHaveValue('-Xmx1024m\n-Xms512m\n-Dfoo=bar');
    });

    it('does not strip a partially-typed delimiter when parent re-renders', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <AutoResizeTextarea
          value="-Xmx512m -Xms256m"
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );
      const textarea = getTextarea();

      fireEvent.focus(textarea);

      // User types " -" at the end to start a new arg — display has a trailing delimiter
      const withPartialArg = '-Xmx512m\n-Xms256m\n-';
      fireEvent.change(textarea, { target: { value: withPartialArg } });

      // onChange reports the imploded form: "-Xmx512m -Xms256m -"
      const implodedWithPartial = onChange.mock.calls[0][0];
      expect(implodedWithPartial).toBe('-Xmx512m -Xms256m -');

      // Parent re-renders with that value
      rerender(
        <AutoResizeTextarea
          value={implodedWithPartial}
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );

      // The trailing "-" must NOT be stripped from the display
      expect(textarea).toHaveValue(withPartialArg);
    });

    it('does not clobber a trailing newline when parent re-renders', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <AutoResizeTextarea
          value="-Xmx512m -Xms256m"
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );
      const textarea = getTextarea();

      fireEvent.focus(textarea);

      // User presses Enter to start typing a new arg
      const withTrailingNewline = '-Xmx512m\n-Xms256m\n';
      fireEvent.change(textarea, { target: { value: withTrailingNewline } });

      // Parent re-renders with the onChange value
      const implodedValue = onChange.mock.calls[0][0];
      rerender(
        <AutoResizeTextarea
          value={implodedValue}
          onChange={onChange}
          delimiter={DELIMITER}
          data-testid="auto-resize-textarea"
        />
      );

      // The trailing newline must NOT be stripped from the display
      expect(textarea).toHaveValue(withTrailingNewline);
    });

    it('explodes pasted content', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '',
        delimiter: DELIMITER,
        onChange,
      });
      const textarea = getTextarea();

      fireEvent.focus(textarea);
      fireEvent.paste(textarea);
      fireEvent.change(textarea, {
        target: { value: '-Xmx512m -Xms256m' },
      });

      // Display value should be exploded
      expect(textarea).toHaveValue('-Xmx512m\n-Xms256m');
      // onChange should still get imploded value
      expect(onChange).toHaveBeenCalledWith('-Xmx512m -Xms256m');
    });
  });

  describe('without delimiter', () => {
    it('does not transform value on focus', () => {
      renderTextarea({ value: 'no transform' });
      const textarea = getTextarea();

      fireEvent.focus(textarea);

      expect(textarea).toHaveValue('no transform');
    });

    it('passes value directly to onChange without transformation', () => {
      const onChange = jest.fn();
      renderTextarea({ onChange });
      const textarea = getTextarea();

      fireEvent.change(textarea, { target: { value: 'line1\nline2' } });

      expect(onChange).toHaveBeenCalledWith('line1\nline2');
    });
  });

  describe('syncs with prop changes', () => {
    it('updates internal value when prop value changes', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <AutoResizeTextarea
          value="initial"
          onChange={onChange}
          data-testid="auto-resize-textarea"
        />
      );

      rerender(
        <AutoResizeTextarea
          value="updated"
          onChange={onChange}
          data-testid="auto-resize-textarea"
        />
      );

      expect(getTextarea()).toHaveValue('updated');
    });
  });
});
