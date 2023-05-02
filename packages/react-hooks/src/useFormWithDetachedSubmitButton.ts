import { FormEvent, useCallback, useMemo } from 'react';
import type { FocusableRefValue } from '@react-types/shared';

/**
 * This class just keeps track of an incrementing counter value.
 */
export class Counter {
  private static i = 0;

  /**
   * Get current value.
   */
  static get current() {
    return Counter.i;
  }

  /**
   * Increment the internal counter and return the result.
   */
  static next = (): number => {
    Counter.i += 1;
    return Counter.i;
  };

  /**
   * Reset counter.
   */
  static reset = (): void => {
    Counter.i = 0;
  };
}

function preventDefault(event: FormEvent): void {
  event.preventDefault();
}

export interface UseFormWithDetachedSubmitButtonResult {
  formProps: {
    id: string;
    onSubmit?: (event: FormEvent) => void;
  };
  submitButtonProps: {
    form: string;
    ref: (buttonEl: FocusableRefValue<HTMLButtonElement> | null) => void;
  };
}

/**
 * Returns props to associate a form with a submit button. It generates a unique
 * id that will be assigned to the form `id` attribute and a button `form`
 * attribute. Useful for cases where a submit button exists outside of the form.
 *
 * e.g.
 *
 * const preventDefaultFormSubmit = true;
 * const { formProps, submitButtonProps } = useFormWithDetachedSubmitButton(preventDefaultFormSubmit);
 *
 * <form {...formProps}></form>
 * <button {...submitButtonProps} type="submit">Submit</button>
 *
 * @param preventDefaultFormSubmit Optionally disable default form submit behavior.
 * @returns props that can be spread on a form component + a submit button component.
 */
export default function useFormWithDetachedSubmitButton(
  preventDefaultFormSubmit = false
): UseFormWithDetachedSubmitButtonResult {
  const formId = useMemo(() => `useSubmitButtonRef-${Counter.next()}`, []);

  const submitButtonRef = useCallback(
    (buttonEl: FocusableRefValue<HTMLButtonElement> | null) => {
      buttonEl?.UNSAFE_getDOMNode().setAttribute('form', formId);
    },
    [formId]
  );

  return {
    formProps: {
      id: formId,
      onSubmit: preventDefaultFormSubmit ? preventDefault : undefined,
    },
    submitButtonProps: {
      form: formId,
      ref: submitButtonRef,
    },
  };
}
