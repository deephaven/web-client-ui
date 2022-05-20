import React, { PureComponent } from 'react';
import './SelectValueList.scss';
import memoize from 'memoizee';
import Checkbox from './Checkbox';

export interface SelectItem<T> {
  value: T;
  displayValue?: string;
  isSelected: boolean;
}

type SelectValueListProps<T> = {
  disabled: boolean;
  // Total item count
  itemCount: number;
  rowHeight: number;

  // Offset of the top item in the items array
  offset: number;
  items: SelectItem<T>[];

  onSelect(itemIndex: number, value: T | null): void;
  onViewportChange(topRow: number, bottomRow: number): void;

  'data-testid'?: string;
};

/**
 * Select values from a long scrollable list.
 * Swaps items in and out for infinite scrolling
 */
class SelectValueList<T> extends PureComponent<SelectValueListProps<T>> {
  static defaultProps = {
    disabled: false,
    rowHeight: 21,
    'data-testid': undefined,
  };

  constructor(props: SelectValueListProps<T>) {
    super(props);

    this.handleScroll = this.handleScroll.bind(this);
    this.handleSelect = this.handleSelect.bind(this);

    this.list = React.createRef();
    this.topRow = null;
    this.bottomRow = null;
  }

  componentDidMount(): void {
    this.sendViewportUpdate();
  }

  componentDidUpdate(): void {
    this.sendViewportUpdate();
  }

  list: React.RefObject<HTMLDivElement>;

  topRow: number | null;

  bottomRow: number | null;

  getCachedItem = memoize(
    (
      itemIndex: number,
      key: number,
      value: T,
      displayValue: string | undefined,
      rowHeight: number,
      isSelected: boolean,
      disabled: boolean
    ): JSX.Element => {
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
    (
      items: SelectItem<T>[],
      rowHeight: number,
      offset: number,
      disabled: boolean
    ): React.ReactNode => {
      const itemElements: JSX.Element[] = [];
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

  handleScroll(): void {
    this.sendViewportUpdate();
  }

  handleSelect(itemIndex: number): void {
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

  sendViewportUpdate(): void {
    if (!this.list.current || this.list.current.clientHeight === 0) {
      return;
    }

    const { onViewportChange, rowHeight } = this.props;
    const top = this.list.current.scrollTop;
    const bottom = top + this.list.current.clientHeight;

    const topRow = Math.floor(top / rowHeight);
    const bottomRow = Math.ceil(bottom / rowHeight);

    if (this.topRow !== topRow || this.bottomRow !== bottomRow) {
      this.topRow = topRow;
      this.bottomRow = bottomRow;
      onViewportChange(topRow, bottomRow);
    }
  }

  render(): JSX.Element {
    const {
      disabled,
      items,
      itemCount,
      offset,
      rowHeight,
      'data-testid': dataTestId,
    } = this.props;
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
        ref={this.list}
        data-testid={dataTestId}
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

export default SelectValueList;
