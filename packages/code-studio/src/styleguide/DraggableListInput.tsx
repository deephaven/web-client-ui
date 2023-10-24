/* eslint no-console: "off" */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { DraggableItemList } from '@deephaven/components';
import { Range } from '@deephaven/utils';

interface DraggableListInputProps {
  draggablePrefix: string;
  droppableId: string;
  isDragDisabled: boolean;
  isDropDisabled: boolean;
  isMultiSelect: boolean;
  items: Array<unknown>;
  onSelectionChange: (listSelectedRanges: readonly Range[]) => void;
  selectedRanges: Range[];
}
interface DraggableListInputState {
  topRow: number | null;
  bottomRow: number | null;
}

interface DraggableListInput {
  itemList: React.RefObject<DraggableItemList<unknown>>;
  selectedItems: Array<unknown>;
}
class DraggableListInput extends PureComponent<
  DraggableListInputProps,
  DraggableListInputState
> {
  static propTypes: {
    draggablePrefix: PropTypes.Requireable<string>;
    droppableId: PropTypes.Requireable<string>;
    isDragDisabled: PropTypes.Requireable<boolean>;
    isDropDisabled: PropTypes.Requireable<boolean>;
    isMultiSelect: PropTypes.Requireable<boolean>;
    items: PropTypes.Requireable<unknown[]>;
    onSelectionChange: PropTypes.Requireable<(...args: unknown[]) => unknown>;
    selectedRanges: PropTypes.Requireable<
      ((number | null | undefined)[] | null | undefined)[]
    >;
  };

  static defaultProps: {
    items: never[];
    draggablePrefix: string;
    droppableId: string;
    isDragDisabled: boolean;
    isDropDisabled: boolean;
    isMultiSelect: boolean;
    onSelectionChange: () => void;
    selectedRanges: never[];
  };

  constructor(props: DraggableListInputProps) {
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

  focusItem(itemIndex: number): void {
    if (this.itemList.current) {
      this.itemList.current.focusItem(itemIndex);
    }
  }

  handleSelectionChange(selectedRanges: readonly Range[]): void {
    console.log('Selection changed', selectedRanges);

    const { onSelectionChange } = this.props;
    onSelectionChange(selectedRanges);
  }

  handleViewportChange(top: number, bottom: number): void {
    const { items } = this.props;

    const viewportSize = bottom - top + 1;
    const topRow = Math.max(0, top - viewportSize);
    const bottomRow = Math.min(bottom + viewportSize, items.length);

    this.setState({ topRow, bottomRow });
  }

  getViewportItems = memoize(
    (
      topRow: number | null,
      bottomRow: number | null,
      items: Array<unknown>
    ): Array<unknown> => {
      if (topRow == null || bottomRow == null) {
        return [];
      }

      return items.slice(topRow, bottomRow);
    }
  );

  render(): React.ReactElement {
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

export default DraggableListInput;
