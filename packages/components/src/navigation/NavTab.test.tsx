import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DragDropContext,
  type DropResult,
  Droppable,
  type ResponderProvided,
} from 'react-beautiful-dnd';
import NavTab from './NavTab';

const mockOnClose = jest.fn();

const defaultProps = {
  tab: { key: 'TEST', title: 'TEST', isCloseable: true },
  index: 0,
  isActive: true,
  onSelect: (key: string) => null,
  isDraggable: true,
};

function MakeNavTab() {
  const mockActiveTabRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleDragEnd = (e: DropResult, provided: ResponderProvided) => {};
  const props = {
    ...defaultProps,
    activeRef: mockActiveTabRef,
    onClose: mockOnClose,
  };
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="test-droppable-id">
        {provided => (
          <div ref={provided.innerRef}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <NavTab {...props} key="testKey" />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

it('should not delete by calling onClose on left click', async () => {
  const user = userEvent.setup();
  render(<MakeNavTab />);
  const navTabComponent = screen.getByTestId('btn-nav-tab-TEST');
  await user.pointer({ keys: '[MouseLeft]', target: navTabComponent });
  expect(mockOnClose).not.toHaveBeenCalled();
});

it('should delete by calling onClose on middle click', async () => {
  const user = userEvent.setup();
  render(<MakeNavTab />);
  const navTabComponent = screen.getByTestId('btn-nav-tab-TEST');
  await user.pointer({ keys: '[MouseMiddle]', target: navTabComponent });
  expect(mockOnClose).toHaveBeenCalled();
});
