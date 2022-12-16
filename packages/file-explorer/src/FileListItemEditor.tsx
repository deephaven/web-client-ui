import React, {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import './FileListItemEditor.scss';
import { FileStorageItem } from './FileStorage';

const log = Log.module('FileListItemEditor');

export interface FileListItemEditorProps {
  item: FileStorageItem;
  onCancel: () => void;
  onSubmit: (newName: string) => void;
  validate?: (newName: string) => Promise<void>;
}

const DEFAULT_VALIDATE = () => Promise.resolve();

export function FileListItemEditor({
  item,
  onCancel,
  onSubmit,
  validate = DEFAULT_VALIDATE,
}: FileListItemEditorProps): JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(item.basename);
  const [validationError, setValidationError] = useState<Error>();
  const [validationPromise, setValidationPromise] = useState<Promise<void>>(
    Promise.resolve()
  );

  const focus = useCallback(() => {
    input.current?.focus();
    // Select the proper range based on the type...
  }, [input]);

  const stopPropagation = useCallback(
    (e: MouseEvent) => e.stopPropagation(),
    []
  );

  const validateAndSubmit = useCallback(() => {
    validationPromise
      .then(() => {
        onSubmit(value);
      })
      .catch(e => log.info('Unable to validate name', e));
  }, [onSubmit, value, validationPromise]);

  useEffect(
    function validateValueAndSetPromise() {
      const validatePromise = PromiseUtils.makeCancelable(validate(value));
      validatePromise
        .then(() => setValidationError(undefined))
        .catch(e => {
          if (!PromiseUtils.isCanceled(e)) {
            setValidationError(e);
          }
        });
      setValidationPromise(validatePromise);
      return () => validatePromise.cancel();
    },
    [validate, value]
  );

  useEffect(
    function selectRange() {
      focus();
    },
    [focus]
  );

  const handleBlur = useCallback(() => {
    log.debug2('handleBlur');
    validateAndSubmit();
  }, [validateAndSubmit]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { value: newValue } = e.target;
    setValue(newValue);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.stopPropagation();

      const { key } = e;
      switch (key) {
        case 'Enter': {
          validateAndSubmit();
          break;
        }
        case 'Escape': {
          onCancel();
          break;
        }
        default:
      }
    },
    [onCancel, validateAndSubmit]
  );

  return (
    <div className="file-list-item-editor">
      <input
        type="text"
        className={classNames('form-control file-list-item-editor-input', {
          'is-invalid': validationError,
        })}
        value={value}
        ref={input}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onMouseDown={stopPropagation}
      />

      {validationError && (
        <div className="invalid-feedback">{`${validationError}`}</div>
      )}
    </div>
  );
}

export default FileListItemEditor;
