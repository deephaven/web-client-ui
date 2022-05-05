import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SELECTION_DIRECTION } from './GridRange';
import GridUtils from './GridUtils';
import './CellInputField.scss';

export type CellInputFieldProps = {
  selectionRange?: number[];
  className?: string;
  disabled?: boolean;
  isQuickEdit?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onCancel?: () => void;
  onDone?: (
    value: string,
    options: {
      direction?: SELECTION_DIRECTION | null;
      fillRange?: boolean;
    }
  ) => void;
  onContextMenu?: React.MouseEventHandler<HTMLTextAreaElement>;
  style?: React.CSSProperties;
};

export const directionForKey = (
  key: string
): SELECTION_DIRECTION | undefined => {
  switch (key) {
    case 'ArrowDown':
      return SELECTION_DIRECTION.DOWN;
    case 'ArrowUp':
      return SELECTION_DIRECTION.UP;
    case 'ArrowLeft':
      return SELECTION_DIRECTION.LEFT;
    case 'ArrowRight':
      return SELECTION_DIRECTION.RIGHT;
    default:
      return undefined;
  }
};

export const CellInputField = ({
  selectionRange = undefined,
  className = '',
  disabled = false,
  value: propsValue = '',
  isQuickEdit: propsIsQuickEdit = true,
  onChange = () => undefined,
  onCancel = () => undefined,
  onDone = () => undefined,
  onContextMenu = () => undefined,
  style = {},
}: CellInputFieldProps): JSX.Element => {
  const inputField = useRef<HTMLTextAreaElement>(null);
  // Use a ref for `isCancelled` as we need to know when it's cancelled after it's called by the event handlers as well
  const isCancelled = useRef<boolean>(false);
  const [initialValue] = useState(propsValue);
  const [isChanged, setIsChanged] = useState(false);
  const [isQuickEdit, setIsQuickEdit] = useState(propsIsQuickEdit);
  const [value, setValue] = useState(propsValue);

  // Init field selection
  useEffect(
    function selectInputField() {
      const { current: field } = inputField;
      if (field == null) {
        return;
      }

      field.focus();
      if (selectionRange) {
        field.setSelectionRange(selectionRange[0], selectionRange[1]);
      } else {
        field.setSelectionRange(field.value.length, field.value.length);
      }
    },
    [selectionRange]
  );

  const sendUpdate = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value: newValue } = event.target;
      setValue(newValue);
      setIsChanged(true);
      sendUpdate(newValue);
    },
    [sendUpdate, setValue, setIsChanged]
  );

  const handleCancel = useCallback(() => {
    isCancelled.current = true;
    if (isChanged) {
      sendUpdate(initialValue);
    }

    setIsChanged(false);
    onCancel();
  }, [initialValue, isChanged, onCancel, sendUpdate]);

  const handleClick = useCallback(() => {
    setIsQuickEdit(false);
  }, [setIsQuickEdit]);

  const handleCommit = useCallback(
    (direction?: SELECTION_DIRECTION | null, fillRange = false) => {
      onDone(value, { direction, fillRange });
    },
    [onDone, value]
  );

  const handleBlur = useCallback(() => {
    if (isCancelled.current) {
      return;
    }

    handleCommit(null);
  }, [isCancelled, handleCommit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleCancel();
          break;
        case 'Enter':
          event.preventDefault();
          if (GridUtils.isModifierKeyDown(event)) {
            handleCommit(undefined, true);
          } else if (event.altKey) {
            const newValue = `${value}\n`;
            setValue(newValue);
            setIsChanged(true);
            sendUpdate(newValue);
          } else {
            handleCommit(
              event.shiftKey ? SELECTION_DIRECTION.UP : SELECTION_DIRECTION.DOWN
            );
          }
          break;
        case 'Tab':
          event.preventDefault();
          handleCommit(
            event.shiftKey
              ? SELECTION_DIRECTION.LEFT
              : SELECTION_DIRECTION.RIGHT
          );
          break;
        case 'ArrowDown':
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (isQuickEdit) {
            event.preventDefault();
            handleCommit(directionForKey(event.key));
          }
          break;
        default:
          break;
      }
    },
    [
      handleCancel,
      handleCommit,
      isQuickEdit,
      setValue,
      setIsChanged,
      sendUpdate,
      value,
    ]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTextAreaElement, MouseEvent>) => {
      onContextMenu(event);
    },
    [onContextMenu]
  );

  return (
    <textarea
      ref={inputField}
      className={classNames('grid-cell-input-field', className)}
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      disabled={disabled}
      style={style}
    />
  );
};

CellInputField.propTypes = {
  selectionRange: PropTypes.arrayOf(PropTypes.number),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isQuickEdit: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onDone: PropTypes.func,
  onContextMenu: PropTypes.func,
  style: PropTypes.shape({}),
};

CellInputField.defaultProps = {
  selectionRange: null,
  className: '',
  disabled: false,
  value: '',
  isQuickEdit: true,
  onChange: () => undefined,
  onCancel: () => undefined,
  onDone: () => undefined,
  onContextMenu: () => undefined,
  style: {},
};

export default CellInputField;
