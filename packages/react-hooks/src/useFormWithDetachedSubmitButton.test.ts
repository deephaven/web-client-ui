import { nanoid } from 'nanoid';
import { TestUtils } from '@deephaven/test-utils';
import { renderHook } from '@testing-library/react';
import type { FocusableRefValue } from '@react-types/shared';
import useFormWithDetachedSubmitButton from './useFormWithDetachedSubmitButton';

jest.mock('nanoid');

let nanoIdCount = 0;

beforeEach(() => {
  jest.clearAllMocks();

  TestUtils.asMock(nanoid).mockImplementation(() => {
    nanoIdCount += 1;
    return String(nanoIdCount);
  });
});

describe('useFormWithDetachedSubmitButton', () => {
  it('should generate new formId on mount', () => {
    const { rerender } = renderHook(() => useFormWithDetachedSubmitButton());
    expect(nanoIdCount).toEqual(1);

    // Should not generate new id on re-render
    rerender();
    expect(nanoIdCount).toEqual(1);

    // Should generate new id if fresh mount
    renderHook(() => useFormWithDetachedSubmitButton());
    expect(nanoIdCount).toEqual(2);
  });

  it('should generate form and button props', () => {
    const { result } = renderHook(() => useFormWithDetachedSubmitButton());

    const formId = `useSubmitButtonRef-${nanoIdCount}`;

    expect(result.current).toEqual({
      formProps: {
        id: formId,
        onSubmit: expect.any(Function),
      },
      submitButtonProps: {
        form: formId,
        ref: expect.any(Function),
      },
    });
  });

  it.each([true, false])(
    'should include preventDefault function if preventDefault is true: %s',
    enableDefaultFormSubmitBehavior => {
      const { result } = renderHook(() =>
        useFormWithDetachedSubmitButton(enableDefaultFormSubmitBehavior)
      );

      expect(result.current.formProps.onSubmit).toEqual(
        enableDefaultFormSubmitBehavior ? undefined : expect.any(Function)
      );

      if (!enableDefaultFormSubmitBehavior) {
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

    const formId = `useSubmitButtonRef-${nanoIdCount}`;

    expect(button.setAttribute).toHaveBeenCalledWith('form', formId);
  });
});
