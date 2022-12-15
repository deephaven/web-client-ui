import React, { PureComponent } from 'react';
import { SelectValueList } from '@deephaven/components';

interface SelectValueListInput {
  selectedItems: number[];
}

interface Item {
  value: string;
  isSelected: boolean;
}
interface SelectValueListInputState {
  itemCount: number;
  items: Item[];
  offset: number;
}

class SelectValueListInput extends PureComponent<
  unknown,
  SelectValueListInputState
> {
  constructor(props: unknown) {
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

  handleSelect(itemIndex: number): void {
    const selectedIndex = this.selectedItems.indexOf(itemIndex);
    if (selectedIndex >= 0) {
      this.selectedItems.splice(selectedIndex, 1);
    } else {
      this.selectedItems.push(itemIndex);
    }

    const isSelected = selectedIndex < 0;
    const { offset } = this.state;
    let { items } = this.state;
    items = ([] as Item[]).concat(items);
    const visibleItemIndex = itemIndex - offset;
    if (visibleItemIndex >= 0 && visibleItemIndex < items.length) {
      items[visibleItemIndex].isSelected = isSelected;
    }

    this.setState({ items });
  }

  handleViewportChange(top: number, bottom: number): void {
    const { itemCount } = this.state;

    const viewportSize = bottom - top + 1;
    const topRow = Math.max(0, top - viewportSize);
    const bottomRow = Math.min(bottom + viewportSize, itemCount);

    const items = [];
    for (let i = topRow; i <= bottomRow && i <= itemCount; i += 1) {
      const value = `Item ${i}`;
      const isSelected = this.selectedItems.indexOf(i) >= 0;
      items.push({ value, isSelected });
    }

    const offset = topRow;
    this.setState({ offset, items });
  }

  render(): React.ReactElement {
    const { offset, items, itemCount } = this.state;
    return (
      <SelectValueList
        itemCount={itemCount}
        items={items}
        offset={offset}
        onSelect={this.handleSelect}
        onViewportChange={this.handleViewportChange}
      />
    );
  }
}

export default SelectValueListInput;
