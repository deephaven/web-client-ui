import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { render } from '@testing-library/react';
import DraggableItemList from './DraggableItemList';

function makeDraggableItemList({
  isDropTarget = undefined as boolean | undefined,
} = {}) {
  const items = ['A', 'B', 'C'];
  return render(
    <DragDropContext onDragEnd={jest.fn()}>
      <DraggableItemList
        itemCount={items.length}
        items={items}
        isDropTarget={isDropTarget}
      />
    </DragDropContext>
  );
}

function getScrollPane(container: HTMLElement): Element | null {
  return container.querySelector('.item-list-scroll-pane');
}

it('does not highlight the list as a drop target by default', () => {
  const { container } = makeDraggableItemList();
  expect(getScrollPane(container)).not.toHaveClass('dh-marching-ants');
});

it('highlights the list when isDropTarget is set', () => {
  const { container } = makeDraggableItemList({ isDropTarget: true });
  expect(getScrollPane(container)).toHaveClass('dh-marching-ants');
});

it('does not highlight the list when isDropTarget is false', () => {
  const { container } = makeDraggableItemList({ isDropTarget: false });
  expect(getScrollPane(container)).not.toHaveClass('dh-marching-ants');
});
