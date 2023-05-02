import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import type { FocusableRefValue } from '@react-types/shared';
import useFormWithDetachedSubmitButton, {
  Counter,
} from './useFormWithDetachedSubmitButton';

beforeEach(() => {
  jest.clearAllMocks();
  Counter.reset();
});

describe('Counter', () => {
  it('should increment a value', () => {
    expect(Counter.current).toEqual(0);

    [1, 2, 3].forEach(i => {
      expect(Counter.next()).toEqual(i);
      expect(Counter.current).toEqual(i);
    });
  });

  it('should reset', () => {
    Counter.next();
    Counter.next();
    expect(Counter.current).toEqual(2);

    Counter.reset();
    expect(Counter.current).toEqual(0);
  });
});

describe('useFormWithDetachedSubmitButton', () => {
  it('should generate new formId on mount', () => {
    const { rerender } = renderHook(() => useFormWithDetachedSubmitButton());
    expect(Counter.current).toEqual(1);

    // Should not generate new id on re-render
    rerender();
    expect(Counter.current).toEqual(1);

    // Should generate new id if fresh mount
    renderHook(() => useFormWithDetachedSubmitButton());
    expect(Counter.current).toEqual(2);
  });

  it('should generate form and button props', () => {
    const { result } = renderHook(() => useFormWithDetachedSubmitButton());

    const formId = `useSubmitButtonRef-${Counter.current}`;

    expect(result.current).toEqual({
      formProps: {
        id: formId,
        onSubmit: undefined,
      },
      submitButtonProps: {
        form: formId,
        ref: expect.any(Function),
      },
    });
  });

  it.each([true, false])(
    'should include preventDefault function if preventDefault is true: %s',
    preventDefault => {
      const { result } = renderHook(() =>
        useFormWithDetachedSubmitButton(preventDefault)
      );

      expect(result.current.formProps.onSubmit).toEqual(
        preventDefault ? expect.any(Function) : undefined
      );

      if (preventDefault) {
        const event = TestUtils.createMockProxy<React.FormEvent<Element>>({});
        result.current.formProps.onSubmit?.(event);

        expect(event.preventDefault).toHaveBeenCalled();
      }
    }
  );

  it('should return a callback ref that sets `form` attribute to formId', () => {
    const button = TestUtils.createMockProxy<HTMLButtonElement>({});

    const buttonRef = TestUtils.createMockProxy<
      FocusableRefValue<HTMLButtonElement>
    >({
      UNSAFE_getDOMNode: jest.fn().mockReturnValue(button),
    });

    const { result } = renderHook(() => useFormWithDetachedSubmitButton());

    result.current.submitButtonProps.ref(buttonRef);

    const formId = `useSubmitButtonRef-${Counter.current}`;

    expect(button.setAttribute).toHaveBeenCalledWith('form', formId);
  });
});
