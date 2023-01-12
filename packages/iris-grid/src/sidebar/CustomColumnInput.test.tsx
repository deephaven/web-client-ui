import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import CustomColumnInput, { CustomColumnInputProps } from './CustomColumnInput';

const TEST_ID = 'TEST_ID';

function Input({
  eventKey = TEST_ID,
  inputIndex = 0,
  name = '',
  formula = '',
  onChange = jest.fn(),
  onDeleteColumn = jest.fn(),
  onTabInEditor = jest.fn(),
  invalid = false,
  isDuplicate = false,
}: Partial<CustomColumnInputProps>) {
  return (
    <div>
      <DragDropContext onDragEnd={jest.fn()}>
        <Droppable droppableId="test-droppable">
          {() => (
            <CustomColumnInput
              eventKey={eventKey}
              inputIndex={inputIndex}
              name={name}
              formula={formula}
              onChange={onChange}
              onDeleteColumn={onDeleteColumn}
              onTabInEditor={onTabInEditor}
              invalid={invalid}
              isDuplicate={isDuplicate}
            />
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

test('Fires change events', async () => {
  const user = userEvent.setup();
  const mockOnChange = jest.fn();
  render(<Input onChange={mockOnChange} />);
  await user.type(screen.getByPlaceholderText('Column Name'), 'a');
  expect(mockOnChange).toBeCalledWith(TEST_ID, 'name', 'a');

  mockOnChange.mockClear();
  await user.click(screen.getByText('Column Formula'));
  await user.keyboard('b');
  expect(mockOnChange).toBeCalledWith(TEST_ID, 'formula', 'b');
  await user.keyboard('[Backspace]');
  expect(mockOnChange).toBeCalledWith(TEST_ID, 'formula', 'b');
});

test('Fires delete event', async () => {
  const user = userEvent.setup();
  const mockDelete = jest.fn();
  render(<Input onDeleteColumn={mockDelete} />);
  await user.click(screen.getByLabelText('Delete custom column'));
  expect(mockDelete).toBeCalledWith(TEST_ID);
});

test('Displays validation errors', async () => {
  const { rerender } = render(<Input isDuplicate />);
  expect(screen.getByText('Duplicate name')).toBeInTheDocument();

  rerender(<Input name=":abc" />);
  expect(screen.getByText('Invalid name')).toBeInTheDocument();
});
