import { FormEvent, useCallback, useMemo } from 'react';
import type { FocusableRefValue } from '@react-types/shared';

/** Generate a unique id that increments on every call. */
let uniqueFormId = 0;
function generateId() {
  uniqueFormId += 1;
  return `useSubmitButtonRef-${uniqueFormId}`;
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
  const formId = useMemo(() => generateId(), []);

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
