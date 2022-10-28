import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import classNames from 'classnames';
import clamp from 'lodash.clamp';
import { vsAdd, vsTrash } from '@deephaven/icons';
import { Range } from '@deephaven/utils';
import { Button, ItemList } from '.';

interface EditableItemListProps {
  isInvalid?: boolean;
  items: string[];
  onDelete: (item: string) => void;
  onAdd: (item: string) => void;
  validate?: (item: string) => Error | null;
}

// Display a list of items with an input for adding new items, and Add/Delete buttons
const EditableItemList = (props: EditableItemListProps): React.ReactElement => {
  const {
    isInvalid = false,
    items,
    onAdd = () => undefined,
    onDelete = () => undefined,
    validate = () => null,
  } = props;
  const [inputError, setInputError] = useState<Error | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [value, setValue] = useState('');

  const handleSelect = useCallback(index => {
    setSelectedIndex(index);
  }, []);

  const handleDelete = useCallback(() => {
    const newIndex =
      selectedIndex === items.length - 1 ? items.length - 2 : selectedIndex;
    if (
      selectedIndex !== undefined &&
      selectedIndex >= 0 &&
      selectedIndex < items.length
    ) {
      onDelete(items[selectedIndex]);
    }
    setSelectedIndex(newIndex === -1 ? undefined : newIndex);
  }, [items, selectedIndex, onDelete]);

  const handleAdd = useCallback(() => {
    if (value === '') {
      return;
    }
    const validationError = validate(value);
    if (validationError == null) {
      onAdd(value);
      setValue('');
    } else {
      setInputError(validationError);
    }
  }, [value, onAdd, validate]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value: inputValue } = event.target;
      setValue(inputValue);
      setInputError(inputValue === '' ? null : validate(inputValue));
    },
    [validate]
  );

  const handleInputFocus = useCallback(() => {
    setSelectedIndex(undefined);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleAdd();
      }
    },
    [handleAdd]
  );

  const selectedRanges = useMemo(
    (): Range[] =>
      selectedIndex === undefined ? [] : [[selectedIndex, selectedIndex]],
    [selectedIndex]
  );
  const containerHeight = useMemo(
    (): number => 14 + clamp(items.length, 1, 6) * ItemList.DEFAULT_ROW_HEIGHT,
    [items.length]
  );

  return (
    <div
      className={classNames('editable-item-list-container', {
        'is-invalid': isInvalid,
      })}
    >
      <div style={{ height: containerHeight }}>
        <ItemList
          itemCount={items.length}
          items={items.map((item, index) => ({
            value: item,
            isSelected: index === selectedIndex,
          }))}
          offset={0}
          onSelect={handleSelect}
          selectedRanges={selectedRanges}
        />
      </div>
      <div className="d-flex flex-row pt-2">
        <div className="d-flex flex-grow-1">
          <input
            className={classNames('form-control', {
              'is-invalid': inputError != null,
            })}
            placeholder="Enter value"
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <div className="d-flex align-items-start mt-1 ml-2">
          <Button
            kind="ghost"
            onClick={handleAdd}
            disabled={inputError != null || value === ''}
            icon={vsAdd}
            tooltip="Add new item"
            data-testid="add-item-button"
          />
          <Button
            kind="ghost"
            onClick={handleDelete}
            disabled={selectedIndex === undefined}
            icon={vsTrash}
            tooltip="Delete selected item"
            data-testid="delete-item-button"
          />
        </div>
      </div>
    </div>
  );
};

export default EditableItemList;
