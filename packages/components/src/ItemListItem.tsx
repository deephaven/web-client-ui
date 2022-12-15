import React, { Component } from 'react';
import classNames from 'classnames';
import './ItemListItem.scss';
import Log from '@deephaven/log';

const log = Log.module('ItemListItem');

interface ItemListItemProps {
  isDraggable: boolean;
  isFocused: boolean;
  isSelected: boolean;
  itemIndex: number;
  onBlur(index: number, e: React.FocusEvent<HTMLDivElement>): void;
  onClick(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  onContextMenu(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  onDragStart(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDrag(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragOver(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragEnd(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDrop(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDoubleClick(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  onFocus(index: number, e: React.FocusEvent<HTMLDivElement>): void;
  onMouseDown(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  onMouseMove(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  onMouseUp(index: number, e: React.MouseEvent<HTMLDivElement>): void;
  style: React.CSSProperties;
  children: React.ReactNode;
  'data-testid'?: string;
}

class ItemListItem extends Component<ItemListItemProps, Record<string, never>> {
  static defaultProps = {
    children: null,
    isDraggable: false,
    isFocused: false,
    isSelected: false,
    itemIndex: 0,
    'data-testid': undefined,

    onBlur(): void {
      // no-op
    },
    onClick(): void {
      // no-op
    },
    onContextMenu(): void {
      // no-op
    },
    onDragStart(): void {
      // no-op
    },
    onDrag(): void {
      // no-op
    },
    onDragOver(): void {
      // no-op
    },
    onDragEnd(): void {
      // no-op
    },
    onDrop(): void {
      // no-op
    },
    onDoubleClick(): void {
      // no-op
    },
    onFocus(): void {
      // no-op
    },
    onMouseDown(): void {
      // no-op
    },
    onMouseMove(): void {
      // no-op
    },
    onMouseUp(): void {
      // no-op
    },
    style: {},
  };

  static handleKeyDown(): boolean {
    log.log('ItemListItem.handleKeyDown false');
    return false;
  }

  constructor(props: ItemListItemProps) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.itemRef = React.createRef();
  }

  itemRef: React.RefObject<HTMLDivElement>;

  handleBlur(e: React.FocusEvent<HTMLDivElement>): void {
    const { itemIndex, onBlur } = this.props;
    onBlur(itemIndex, e);
  }

  handleFocus(e: React.FocusEvent<HTMLDivElement>): void {
    const { itemIndex, onFocus } = this.props;
    onFocus(itemIndex, e);
  }

  handleClick(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onClick } = this.props;
    onClick(itemIndex, e);
  }

  handleContextMenu(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onContextMenu } = this.props;
    onContextMenu(itemIndex, e);
  }

  handleDragStart(e: React.DragEvent<HTMLDivElement>): void {
    const { itemIndex, onDragStart } = this.props;
    onDragStart(itemIndex, e);
  }

  handleDrag(e: React.DragEvent<HTMLDivElement>): void {
    const { itemIndex, onDrag } = this.props;
    onDrag(itemIndex, e);
  }

  handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    // Have to call preventDefault otherwise onDrop won't get triggered
    e.preventDefault();
    const { itemIndex, onDragOver } = this.props;
    onDragOver(itemIndex, e);
  }

  handleDragEnd(e: React.DragEvent<HTMLDivElement>): void {
    const { itemIndex, onDragEnd } = this.props;
    onDragEnd(itemIndex, e);
  }

  handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    const { itemIndex, onDrop } = this.props;
    onDrop(itemIndex, e);
  }

  handleDoubleClick(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onDoubleClick } = this.props;
    onDoubleClick(itemIndex, e);
  }

  handleMouseMove(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onMouseMove } = this.props;
    onMouseMove(itemIndex, e);
  }

  handleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onMouseDown } = this.props;
    onMouseDown(itemIndex, e);
  }

  handleMouseUp(e: React.MouseEvent<HTMLDivElement>): void {
    const { itemIndex, onMouseUp } = this.props;
    onMouseUp(itemIndex, e);
  }

  render(): JSX.Element {
    const {
      isDraggable,
      isFocused,
      isSelected,
      style,
      children,
      'data-testid': dataTestId,
    } = this.props;
    return (
      <div
        className={classNames(
          'item-list-item',
          { active: isSelected },
          { 'is-focused': isFocused },
          { 'is-draggable': isDraggable }
        )}
        onKeyDown={ItemListItem.handleKeyDown}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}
        onDrag={this.handleDrag}
        onDragStart={this.handleDragStart}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        onDrop={this.handleDrop}
        onDoubleClick={this.handleDoubleClick}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        tabIndex={-1}
        ref={this.itemRef}
        role="listitem"
        style={style}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        draggable={isDraggable}
        data-testid={dataTestId}
      >
        {children}
      </div>
    );
  }
}

export default ItemListItem;
