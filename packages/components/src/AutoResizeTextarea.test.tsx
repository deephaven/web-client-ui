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

  // ─── Use-case coverage (TC-1 through TC-8) ────────────────────────────────
  // Tests marked it.failing are expected to fail until the implementation is
  // updated to handle quoted values. Once the feature is implemented, change
  // those to plain it() calls.

  describe('TC-1: JVM arguments, no quotes – delimiter " -"', () => {
    const DELIMITER = ' -';

    it('explodes args on focus', () => {
      renderTextarea({
        value: '-Xmx512m -Xms256m -Dfoo=bar',
        delimiter: DELIMITER,
      });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('-Xmx512m\n-Xms256m\n-Dfoo=bar');
    });

    it('implodes on blur', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Xmx512m -Xms256m -Dfoo=bar',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('-Xmx512m -Xms256m -Dfoo=bar');
    });

    it('round-trips: implode(explode(value)) === value', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Xmx512m -Xms256m -Dfoo=bar',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('-Xmx512m -Xms256m -Dfoo=bar');
    });
  });

  describe('TC-2: JVM arguments, with quotes – delimiter " -"', () => {
    const DELIMITER = ' -';

    it('keeps a quoted value containing a space on one line when exploding', () => {
      renderTextarea({
        value: '-Dfoo="bar baz" -Xmx512m',
        delimiter: DELIMITER,
      });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('-Dfoo="bar baz"\n-Xmx512m');
    });

    it.failing(
      'keeps a quoted value containing the delimiter on one line when exploding',
      () => {
        renderTextarea({
          value: '-Dfoo="has -dash inside" -Xmx512m',
          delimiter: DELIMITER,
        });
        fireEvent.focus(getTextarea());
        expect(getTextarea()).toHaveValue('-Dfoo="has -dash inside"\n-Xmx512m');
      }
    );

    it('round-trips: implode(explode(value)) === value for quoted arg containing delimiter', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Dfoo="has -dash inside" -Xmx512m',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith(
        '-Dfoo="has -dash inside" -Xmx512m'
      );
    });

    it('round-trips: implode(explode(value)) === value for quoted args', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Dfoo="bar baz" -Xmx512m',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('-Dfoo="bar baz" -Xmx512m');
    });

    it('unbalanced quote: splits on the delimiter as if no quote, does not throw', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '-Dfoo="bad -Xmx512m',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      // Unbalanced quote is treated as a literal character; split proceeds normally
      expect(getTextarea()).toHaveValue('-Dfoo="bad\n-Xmx512m');
      fireEvent.blur(getTextarea());
      // Round-trip: original value is preserved
      expect(onChange).toHaveBeenCalledWith('-Dfoo="bad -Xmx512m');
    });

    it('pasted JVM args with quoted value explode correctly', () => {
      const onChange = jest.fn();
      renderTextarea({ value: '', delimiter: DELIMITER, onChange });
      const textarea = getTextarea();
      fireEvent.focus(textarea);
      fireEvent.paste(textarea);
      fireEvent.change(textarea, {
        target: { value: '-Dfoo="bar baz" -Xmx512m' },
      });
      expect(textarea).toHaveValue('-Dfoo="bar baz"\n-Xmx512m');
      expect(onChange).toHaveBeenCalledWith('-Dfoo="bar baz" -Xmx512m');
    });
  });

  describe('TC-3: environment variables, no quotes – delimiter " "', () => {
    const DELIMITER = ' ';

    it('explodes env vars on focus', () => {
      renderTextarea({ value: 'FOO=bar BAZ=qux', delimiter: DELIMITER });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('FOO=bar\nBAZ=qux');
    });

    it('implodes on blur', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'FOO=bar BAZ=qux',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('FOO=bar BAZ=qux');
    });

    it('round-trips: implode(explode(value)) === value', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'FOO=bar BAZ=qux',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('FOO=bar BAZ=qux');
    });
  });

  describe('TC-4: environment variables, with quotes – delimiter " "', () => {
    const DELIMITER = ' ';

    it.failing(
      'keeps a double-quoted value containing a space on one line',
      () => {
        renderTextarea({
          value: 'FOO="hello world" BAZ=qux',
          delimiter: DELIMITER,
        });
        fireEvent.focus(getTextarea());
        expect(getTextarea()).toHaveValue('FOO="hello world"\nBAZ=qux');
      }
    );

    it.failing(
      'keeps a single-quoted value containing a space on one line',
      () => {
        renderTextarea({
          value: "FOO='hello world' BAZ=qux",
          delimiter: DELIMITER,
        });
        fireEvent.focus(getTextarea());
        expect(getTextarea()).toHaveValue("FOO='hello world'\nBAZ=qux");
      }
    );

    it('round-trips: implode(explode(value)) === value for quoted env vars', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'FOO="hello world" BAZ=qux',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('FOO="hello world" BAZ=qux');
    });

    it('unbalanced quote: splits on the delimiter as if no quote, does not throw', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'FOO="bad BAZ=qux',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      // Unbalanced quote is treated as a literal character; split proceeds normally
      expect(getTextarea()).toHaveValue('FOO="bad\nBAZ=qux');
      fireEvent.blur(getTextarea());
      // Round-trip: original value is preserved
      expect(onChange).toHaveBeenCalledWith('FOO="bad BAZ=qux');
    });
  });

  describe('TC-5: Python packages, no quotes – delimiter " "', () => {
    const DELIMITER = ' ';

    it('explodes package list on focus', () => {
      renderTextarea({
        value: 'numpy==1.24 pandas>=2.0 scipy[extra]',
        delimiter: DELIMITER,
      });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue(
        'numpy==1.24\npandas>=2.0\nscipy[extra]'
      );
    });

    it('implodes on blur', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'numpy==1.24 pandas>=2.0 scipy[extra]',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith(
        'numpy==1.24 pandas>=2.0 scipy[extra]'
      );
    });

    it('does not treat square brackets as quotes', () => {
      renderTextarea({
        value: 'scipy[extra] numpy',
        delimiter: DELIMITER,
      });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('scipy[extra]\nnumpy');
    });

    it('round-trips: implode(explode(value)) === value', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: 'numpy==1.24 pandas>=2.0 scipy[extra]',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith(
        'numpy==1.24 pandas>=2.0 scipy[extra]'
      );
    });
  });

  describe('TC-6: extra classpaths, no quotes – delimiter " "', () => {
    const DELIMITER = ' ';

    it('explodes classpath entries on focus', () => {
      renderTextarea({ value: '/a/b /c/d', delimiter: DELIMITER });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('/a/b\n/c/d');
    });

    it('implodes on blur', () => {
      const onChange = jest.fn();
      renderTextarea({ value: '/a/b /c/d', delimiter: DELIMITER, onChange });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('/a/b /c/d');
    });

    it('round-trips: implode(explode(value)) === value', () => {
      const onChange = jest.fn();
      renderTextarea({ value: '/a/b /c/d', delimiter: DELIMITER, onChange });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('/a/b /c/d');
    });
  });

  describe('TC-7: extra classpaths, with quotes – delimiter " "', () => {
    const DELIMITER = ' ';

    it.failing(
      'keeps a quoted path containing spaces on one line when exploding',
      () => {
        renderTextarea({
          value: '"/a/path with spaces" /c/d',
          delimiter: DELIMITER,
        });
        fireEvent.focus(getTextarea());
        expect(getTextarea()).toHaveValue('"/a/path with spaces"\n/c/d');
      }
    );

    it('round-trips: implode(explode(value)) === value for quoted paths', () => {
      const onChange = jest.fn();
      renderTextarea({
        value: '"/a/path with spaces" /c/d',
        delimiter: DELIMITER,
        onChange,
      });
      fireEvent.focus(getTextarea());
      fireEvent.blur(getTextarea());
      expect(onChange).toHaveBeenCalledWith('"/a/path with spaces" /c/d');
    });

    it('unbalanced quote: splits on the delimiter as if no quote, does not throw', () => {
      const onChange = jest.fn();
      renderTextarea({ value: '"/bad /c/d', delimiter: DELIMITER, onChange });
      fireEvent.focus(getTextarea());
      // Unbalanced quote is treated as a literal character; split proceeds normally
      expect(getTextarea()).toHaveValue('"/bad\n/c/d');
      fireEvent.blur(getTextarea());
      // Round-trip: original value is preserved
      expect(onChange).toHaveBeenCalledWith('"/bad /c/d');
    });
  });

  describe('TC-8: no delimiter', () => {
    it('does not transform value on focus', () => {
      renderTextarea({ value: 'assignment policy params' });
      fireEvent.focus(getTextarea());
      expect(getTextarea()).toHaveValue('assignment policy params');
    });

    it('passes quoted values through to onChange unchanged', () => {
      const onChange = jest.fn();
      renderTextarea({ onChange });
      fireEvent.change(getTextarea(), {
        target: { value: 'KEY="value with spaces"' },
      });
      expect(onChange).toHaveBeenCalledWith('KEY="value with spaces"');
    });

    it('passes newlines through to onChange unchanged', () => {
      const onChange = jest.fn();
      renderTextarea({ onChange });
      fireEvent.change(getTextarea(), { target: { value: 'line1\nline2' } });
      expect(onChange).toHaveBeenCalledWith('line1\nline2');
    });
  });
});
