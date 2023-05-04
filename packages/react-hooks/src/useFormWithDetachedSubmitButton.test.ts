import shortid from 'shortid';
import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import type { FocusableRefValue } from '@react-types/shared';
import useFormWithDetachedSubmitButton from './useFormWithDetachedSubmitButton';

jest.mock('shortid');

let shortIdCount = 0;

beforeEach(() => {
  jest.clearAllMocks();

  TestUtils.asMock(shortid).mockImplementation(() => {
    shortIdCount += 1;
    return String(shortIdCount);
  });
});

describe('useFormWithDetachedSubmitButton', () => {
  it('should generate new formId on mount', () => {
    const { rerender } = renderHook(() => useFormWithDetachedSubmitButton());
    expect(shortIdCount).toEqual(1);

    // Should not generate new id on re-render
    rerender();
    expect(shortIdCount).toEqual(1);

    // Should generate new id if fresh mount
    renderHook(() => useFormWithDetachedSubmitButton());
    expect(shortIdCount).toEqual(2);
  });

  it('should generate form and button props', () => {
    const { result } = renderHook(() => useFormWithDetachedSubmitButton());

    const formId = `useSubmitButtonRef-${shortIdCount}`;

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

    const formId = `useSubmitButtonRef-${shortIdCount}`;

    expect(button.setAttribute).toHaveBeenCalledWith('form', formId);
  });
});
