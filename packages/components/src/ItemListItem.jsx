import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './ItemListItem.scss';
import Log from '@deephaven/log';

const log = Log.module('ItemListItem');

class ItemListItem extends Component {
  static handleKeyDown() {
    log.log('ItemListItem.handleKeyDown false');
    return false;
  }

  constructor(props) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleClick = this.handleClick.bind(this);
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

  componentDidMount() {
    const { isKeyboardSelected, itemIndex, onKeyboardSelect } = this.props;
    if (isKeyboardSelected && this.itemRef.current) {
      onKeyboardSelect(itemIndex, this.itemRef.current);
    }
  }

  componentDidUpdate(prevProps) {
    const { isKeyboardSelected: oldIsKeyboardSelected } = prevProps;
    const {
      isKeyboardSelected,
      itemIndex,
      onKeyboardSelect,
      disableSelect,
    } = this.props;

    if (
      isKeyboardSelected &&
      !oldIsKeyboardSelected &&
      this.itemRef.current &&
      !disableSelect
    ) {
      onKeyboardSelect(itemIndex, this.itemRef.current);
    }
  }

  handleBlur(e) {
    const { itemIndex, onBlur } = this.props;
    onBlur(itemIndex, e);
  }

  handleFocus(e) {
    const { itemIndex, onFocus } = this.props;
    onFocus(itemIndex, e);
  }

  handleClick(e) {
    const { itemIndex, onClick } = this.props;
    onClick(itemIndex, e);
  }

  handleDragStart(e) {
    const { itemIndex, onDragStart } = this.props;
    onDragStart(itemIndex, e);
  }

  handleDrag(e) {
    const { itemIndex, onDrag } = this.props;
    onDrag(itemIndex, e);
  }

  handleDragOver(e) {
    // Have to call preventDefault otherwise onDrop won't get triggered
    e.preventDefault();
    const { itemIndex, onDragOver } = this.props;
    onDragOver(itemIndex, e);
  }

  handleDragEnd(e) {
    const { itemIndex, onDragEnd } = this.props;
    onDragEnd(itemIndex, e);
  }

  handleDrop(e) {
    const { itemIndex, onDrop } = this.props;
    onDrop(itemIndex, e);
  }

  handleDoubleClick(e) {
    const { itemIndex, onDoubleClick } = this.props;
    onDoubleClick(itemIndex, e);
  }

  handleMouseMove(e) {
    const { itemIndex, onMouseMove } = this.props;
    onMouseMove(itemIndex, e);
  }

  handleMouseDown(e) {
    const { itemIndex, onMouseDown } = this.props;
    onMouseDown(itemIndex, e);
  }

  handleMouseUp(e) {
    const { itemIndex, onMouseUp } = this.props;
    onMouseUp(itemIndex, e);
  }

  render() {
    const {
      isDraggable,
      isKeyboardSelected,
      isSelected,
      style,
      children,
    } = this.props;
    return (
      <div
        className={classNames(
          'item-list-item',
          { active: isSelected },
          { 'keyboard-active': isKeyboardSelected },
          { 'is-draggable': isDraggable }
        )}
        onKeyDown={ItemListItem.handleKeyDown}
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
        role="presentation"
        style={style}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        draggable={isDraggable}
      >
        {children}
      </div>
    );
  }
}

ItemListItem.propTypes = {
  isDraggable: PropTypes.bool,
  isKeyboardSelected: PropTypes.bool,
  isSelected: PropTypes.bool,
  itemIndex: PropTypes.number,
  disableSelect: PropTypes.bool,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onDragStart: PropTypes.func,
  onDrag: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyboardSelect: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseUp: PropTypes.func,
  style: PropTypes.shape({}),
  children: PropTypes.node,
};

ItemListItem.defaultProps = {
  children: null,
  isDraggable: false,
  isKeyboardSelected: false,
  isSelected: false,
  itemIndex: 0,
  disableSelect: false,

  onBlur: () => {},
  onClick: () => {},
  onDragStart: () => {},
  onDrag: () => {},
  onDragOver: () => {},
  onDragEnd: () => {},
  onDrop: () => {},
  onDoubleClick: () => {},
  onFocus: () => {},
  onKeyboardSelect: () => {},
  onMouseDown: () => {},
  onMouseMove: () => {},
  onMouseUp: () => {},

  style: {},
};

export default ItemListItem;
