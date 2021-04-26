/* eslint no-console: "off" */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { DraggableItemList } from '@deephaven/components';

class DraggableListInput extends PureComponent {
  constructor(props) {
    super(props);

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);

    this.itemList = React.createRef();
    this.selectedItems = [];

    this.state = {
      topRow: null,
      bottomRow: null,
    };
  }

  focusItem(itemIndex) {
    if (this.itemList.current) {
      this.itemList.current.focusItem(itemIndex);
    }
  }

  handleSelectionChange(selectedRanges) {
    console.log('Selection changed', selectedRanges);

    const { onSelectionChange } = this.props;
    onSelectionChange(selectedRanges);
  }

  handleViewportChange(top, bottom) {
    const { items } = this.props;

    const viewportSize = bottom - top + 1;
    const topRow = Math.max(0, top - viewportSize);
    const bottomRow = Math.min(bottom + viewportSize, items.length);

    this.setState({ topRow, bottomRow });
  }

  getViewportItems = memoize((topRow, bottomRow, items) => {
    if (topRow == null || bottomRow == null) {
      return [];
    }

    return items.slice(topRow, bottomRow);
  });

  render() {
    const {
      draggablePrefix,
      droppableId,
      isDragDisabled,
      isDropDisabled,
      isMultiSelect,
      items,
      selectedRanges,
    } = this.props;

    const { topRow, bottomRow } = this.state;
    return (
      <DraggableItemList
        draggablePrefix={draggablePrefix}
        droppableId={droppableId}
        isDragDisabled={isDragDisabled}
        isDropDisabled={isDropDisabled}
        isMultiSelect={isMultiSelect}
        itemCount={items.length}
        items={this.getViewportItems(topRow, bottomRow, items)}
        offset={topRow ?? 0}
        onSelectionChange={this.handleSelectionChange}
        onViewportChange={this.handleViewportChange}
        ref={this.itemList}
        selectedRanges={selectedRanges}
      />
    );
  }
}

DraggableListInput.propTypes = {
  draggablePrefix: PropTypes.string,
  droppableId: PropTypes.string,
  isDragDisabled: PropTypes.bool,
  isDropDisabled: PropTypes.bool,
  isMultiSelect: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.any),
  onSelectionChange: PropTypes.func,
  selectedRanges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

DraggableListInput.defaultProps = {
  items: [],
  draggablePrefix: 'draggable-item',
  droppableId: 'droppable-item-list',
  isDragDisabled: false,
  isDropDisabled: false,
  isMultiSelect: false,
  onSelectionChange: () => {},
  selectedRanges: [],
};

export default DraggableListInput;
