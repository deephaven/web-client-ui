import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './SelectValueList.scss';
import memoize from 'memoizee';
import Checkbox from './Checkbox';

/**
 * Select values from a long scrollable list.
 * Swaps items in and out for infinite scrolling
 */
class SelectValueList extends PureComponent {
  constructor(props) {
    super(props);

    this.handleScroll = this.handleScroll.bind(this);
    this.handleSelect = this.handleSelect.bind(this);

    this.list = null;
    this.topRow = null;
    this.bottomRow = null;
  }

  componentDidMount() {
    this.sendViewportUpdate();
  }

  componentDidUpdate() {
    this.sendViewportUpdate();
  }

  getCachedItem = memoize(
    (itemIndex, key, value, displayValue, rowHeight, isSelected, disabled) => {
      const style = {
        height: rowHeight,
      };
      const text = displayValue != null ? displayValue : value;

      return (
        <li className="value-list-item" style={style} key={key}>
          <Checkbox
            checked={isSelected}
            disabled={disabled}
            onChange={() => this.handleSelect(itemIndex)}
          >
            {text}
          </Checkbox>
        </li>
      );
    },
    { max: 1000 }
  );

  getCachedItems = memoize(
    (items, rowHeight, offset, disabled) => {
      const itemElements = [];
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const { value, displayValue, isSelected } = item;
        const itemIndex = offset + i;
        const key = itemIndex;
        const element = this.getCachedItem(
          itemIndex,
          key,
          value,
          displayValue,
          rowHeight,
          isSelected,
          disabled
        );
        itemElements.push(element);
      }
      return itemElements;
    },
    { max: 1 }
  );

  handleScroll() {
    this.sendViewportUpdate();
  }

  handleSelect(itemIndex) {
    const { items, offset, onSelect } = this.props;
    const visibleItemIndex = itemIndex - offset;
    if (visibleItemIndex >= 0 && visibleItemIndex < items.length) {
      const item = items[visibleItemIndex];
      const { value } = item;
      onSelect(itemIndex, value);
    } else {
      onSelect(itemIndex, null);
    }
  }

  sendViewportUpdate() {
    if (this.list.clientHeight === 0) {
      return;
    }

    const { onViewportChange, rowHeight } = this.props;
    const top = this.list.scrollTop;
    const bottom = top + this.list.clientHeight;

    const topRow = Math.floor(top / rowHeight);
    const bottomRow = Math.ceil(bottom / rowHeight);

    if (this.topRow !== topRow || this.bottomRow !== bottomRow) {
      this.topRow = topRow;
      this.bottomRow = bottomRow;
      onViewportChange(topRow, bottomRow);
    }
  }

  render() {
    const { disabled, items, itemCount, offset, rowHeight } = this.props;
    const itemElements = this.getCachedItems(
      items,
      rowHeight,
      offset,
      disabled
    );

    return (
      <div
        className="select-value-list-scroll-pane h-100 w-100"
        onScroll={this.handleScroll}
        ref={list => {
          this.list = list;
        }}
      >
        <div
          className="select-value-list"
          style={{ height: itemCount * rowHeight }}
        >
          <ol
            className="select-value-list-content"
            style={{
              position: 'absolute',
              height: items.length * rowHeight,
              top: offset * rowHeight,
              left: 0,
            }}
          >
            {itemElements}
          </ol>
        </div>
      </div>
    );
  }
}

SelectValueList.propTypes = {
  disabled: PropTypes.bool,
  // Total item count
  itemCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number,

  // Offset of the top item in the items array
  offset: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      displayValue: PropTypes.string,
      isSelected: PropTypes.bool.isRequired,
    })
  ).isRequired,

  onSelect: PropTypes.func.isRequired,
  onViewportChange: PropTypes.func.isRequired,
};

SelectValueList.defaultProps = {
  disabled: false,
  rowHeight: 21,
};

export default SelectValueList;
