/* eslint no-console: "off" */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ItemList } from '@deephaven/components';

class ItemListInput extends PureComponent {
  constructor(props) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);

    this.selectedItems = [];

    this.state = {
      items: [],
      offset: 0,
      itemCount: 500000,
    };
  }

  handleSelect(itemIndex) {
    const { itemCount } = this.state;
    console.log('Item selected at index', itemIndex, '/', itemCount);
  }

  handleViewportChange(top, bottom) {
    const { itemCount } = this.state;

    const viewportSize = bottom - top + 1;
    const topRow = Math.max(0, top - viewportSize);
    const bottomRow = Math.min(bottom + viewportSize, itemCount);

    const items = [];
    for (let i = topRow; i <= bottomRow; i += 1) {
      const value = `Item ${i}`;
      const isSelected = this.selectedItems.indexOf(i) >= 0;
      items.push({ value, isSelected });
    }

    const offset = topRow;
    this.setState({ offset, items });
  }

  render() {
    const { isMultiSelect } = this.props;
    const { offset, items, itemCount } = this.state;
    return (
      <ItemList
        isMultiSelect={isMultiSelect}
        itemCount={itemCount}
        items={items}
        offset={offset}
        onSelect={this.handleSelect}
        onViewportChange={this.handleViewportChange}
      />
    );
  }
}

ItemListInput.propTypes = {
  isMultiSelect: PropTypes.bool,
};

ItemListInput.defaultProps = {
  isMultiSelect: false,
};

export default ItemListInput;
