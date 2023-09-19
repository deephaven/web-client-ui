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
import { Range, RangeUtils } from '@deephaven/utils';
import Button from './Button';
import ItemList from './ItemList';

export interface EditableItemListProps {
  isInvalid?: boolean;
  items: string[];
  onDelete: (items: string[]) => void;
  onAdd: (item: string) => void;
  validate?: (item: string) => Error | null;
}

// Display a list of items with an input for adding new items, and Add/Delete buttons
function EditableItemList(props: EditableItemListProps): React.ReactElement {
  const {
    isInvalid = false,
    items,
    onAdd = () => undefined,
    onDelete = () => undefined,
    validate = () => null,
  } = props;
  const [inputError, setInputError] = useState<Error | null>(null);
  const [selectedRanges, setSelectedRanges] = useState<Range[]>([]);
  const [value, setValue] = useState('');

  const handleSelectionChange = useCallback((ranges: Range[]) => {
    setSelectedRanges(ranges);
  }, []);

  const handleDelete = useCallback(() => {
    onDelete(RangeUtils.getItemsInRanges(items, selectedRanges));
    setSelectedRanges([]);
  }, [items, selectedRanges, onDelete]);

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
    setSelectedRanges([]);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleAdd();
      }
    },
    [handleAdd]
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
            isSelected: RangeUtils.isSelected(selectedRanges, index),
          }))}
          offset={0}
          selectedRanges={selectedRanges}
          onSelectionChange={handleSelectionChange}
          isMultiSelect
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
            disabled={selectedRanges.length === 0}
            icon={vsTrash}
            tooltip="Delete selected items"
            data-testid="delete-item-button"
          />
        </div>
      </div>
    </div>
  );
}

export default EditableItemList;
