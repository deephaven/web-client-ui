import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import type { FocusableRefValue } from '@react-types/shared';
import useFormWithDetachedSubmitButton, {
  Counter,
} from './useFormWithDetachedSubmitButton';

const counterValue = 999;
const formId = `useSubmitButtonRef-${counterValue}`;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Counter, 'next').mockReturnValue(999);
});

afterAll(() => {
  jest.restoreAllMocks();
});

it('should generate new formId on mount', () => {
  const { rerender } = renderHook(() => useFormWithDetachedSubmitButton());
  expect(Counter.next).toHaveBeenCalledTimes(1);

  // Should not generate new id on re-render
  rerender();
  expect(Counter.next).toHaveBeenCalledTimes(1);

  // Should generate new id if fresh mount
  renderHook(() => useFormWithDetachedSubmitButton());
  expect(Counter.next).toHaveBeenCalledTimes(2);
});

it.each([true, false])(
  'should generate form and button props: %s',
  preventDefault => {
    const { result } = renderHook(() =>
      useFormWithDetachedSubmitButton(preventDefault)
    );

    expect(result.current).toEqual({
      formProps: {
        id: formId,
        onSubmit: preventDefault ? expect.any(Function) : undefined,
      },
      submitButtonProps: {
        form: formId,
        ref: expect.any(Function),
      },
    });
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

  expect(button.setAttribute).toHaveBeenCalledWith('form', formId);
});
