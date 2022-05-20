/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import {
  ButtonOld,
  Checkbox,
  DraggableItemList,
  DragUtils,
  SearchInput,
  Tooltip,
} from '@deephaven/components';
import { vsTrash, dhSortAlphaDown, dhSortAlphaUp } from '@deephaven/icons';
import { TableUtils } from '@deephaven/jsapi-utils';
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import './RollupRows.scss';
import IrisGridModel from '../IrisGridModel';

const log = Log.module('RollupRows');
const DEBOUNCE_SEARCH = 150;
const GROUPED_LIST_ID = 'grouped-rollup-rows';
const UNGROUPED_LIST_ID = 'ungrouped-rollup-rows';

class RollupRows extends Component {
  static SORT = Object.freeze({
    ASCENDING: 'ASCENDING',
    DESCENDING: 'DESCENDING',
  });

  static renderColumn({ item, isClone, selectedCount }) {
    const text = item && item.name;
    const badgeText = isClone ? `${selectedCount}` : null;
    const className = isClone ? 'item-list-item-clone' : '';
    return DraggableItemList.renderTextItem({ text, badgeText, className });
  }

  static addGroupings(
    currentGroupings,
    newGroupings,
    index = currentGroupings.length
  ) {
    if (newGroupings == null || newGroupings.length === 0) {
      return currentGroupings;
    }

    let insertIndex = index;
    const groupings = currentGroupings.filter((grouping, i) => {
      if (newGroupings.includes(grouping)) {
        if (i < insertIndex) {
          insertIndex -= 1;
        }
        return false;
      }
      return true;
    });
    groupings.splice(insertIndex, 0, ...newGroupings);
    return groupings;
  }

  static isGroupable(column) {
    return !TableUtils.isDecimalType(column.type);
  }

  constructor(props) {
    super(props);

    this.search = debounce(this.search.bind(this), DEBOUNCE_SEARCH);

    this.handleDeleteClicked = this.handleDeleteClicked.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleUngroupedSelect = this.handleUngroupedSelect.bind(this);
    this.handleUngroupedSelectionChange = this.handleUngroupedSelectionChange.bind(
      this
    );
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleGroupedSelectionChange = this.handleGroupedSelectionChange.bind(
      this
    );
    this.handleShowConstituentsChange = this.handleShowConstituentsChange.bind(
      this
    );
    this.handleShowNonAggregatedColumnsChange = this.handleShowNonAggregatedColumnsChange.bind(
      this
    );
    this.handleSortAscending = this.handleSortAscending.bind(this);
    this.handleSortDescending = this.handleSortDescending.bind(this);
    this.renderGroupedItem = this.renderGroupedItem.bind(this);

    this.ungroupedList = React.createRef();
    this.groupedList = React.createRef();

    const { config } = props;
    const {
      columns = [],
      showConstituents = true,
      showNonAggregatedColumns = true,
    } = config ?? {};

    this.state = {
      ungroupedSelectedRanges: [],
      columns,
      groupedSelectedRanges: [],
      searchFilter: '',
      showConstituents,
      showNonAggregatedColumns,
      dragSource: null,
      sort: null,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { config } = this.props;
    const { columns, showConstituents, showNonAggregatedColumns } = this.state;
    if (config !== prevProps.config) {
      this.updateFromConfig();
    } else if (
      columns !== prevState.columns ||
      showConstituents !== prevState.showConstituents ||
      showNonAggregatedColumns !== prevState.showNonAggregatedColumns
    ) {
      if (
        config == null ||
        columns !== config.columns ||
        showConstituents !== config.showConstituents ||
        showNonAggregatedColumns !== config.showNonAggregatedColumns
      ) {
        this.sendChange();
      }
    }
  }

  componentWillUnmount() {
    this.search.cancel();
  }

  handleSearchChange(event) {
    const searchFilter = event.target.value;
    this.setState({ searchFilter });
    if (!searchFilter) {
      this.search.cancel();
      this.resetSelection();
      return;
    }
    this.search(searchFilter);
  }

  handleSortAscending() {
    this.setState(({ sort }) => ({
      sort:
        sort === RollupRows.SORT.ASCENDING ? null : RollupRows.SORT.ASCENDING,
    }));
  }

  handleSortDescending() {
    this.setState(({ sort }) => ({
      sort:
        sort === RollupRows.SORT.DESCENDING ? null : RollupRows.SORT.DESCENDING,
    }));
  }

  resetSelection() {
    this.setState({ ungroupedSelectedRanges: [], groupedSelectedRanges: [] });
  }

  search(searchFilter) {
    const columns = this.getSortedUngroupedColumns();
    const selectedRanges = [];
    let focusIndex = null;
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];
      if (column.name.toLowerCase().includes(searchFilter.toLowerCase())) {
        if (focusIndex == null) {
          focusIndex = i;
        }
        selectedRanges.push([i, i]);
      }
    }
    this.setState({ ungroupedSelectedRanges: selectedRanges });

    if (selectedRanges.length > 0 && this.ungroupedList.current) {
      this.ungroupedList.current.scrollToItem(focusIndex);
    }
  }

  handleDragStart(e) {
    log.debug('handleDragStart', e);

    document.documentElement.classList.add('drag-pointer-events-none');

    this.setState({ dragSource: e.source });
  }

  handleDragEnd(e) {
    log.debug('handleDragEnd', e);

    document.documentElement.classList.remove('drag-pointer-events-none');

    this.setState({ dragSource: null });

    const { destination, source } = e;
    if (destination == null || source == null) {
      return;
    }

    // We don't allow dragging within the ungrouped list, so if we're dragging into the ungrouped list,
    // it must have came from the grouped list. Remove those grouped columns.
    if (destination.droppableId === UNGROUPED_LIST_ID) {
      this.setState(({ groupedSelectedRanges, columns }) => {
        const newColumns = [...columns];
        DragUtils.reorder(newColumns, groupedSelectedRanges, [], 0);
        return {
          columns: newColumns,
          ungroupedSelectedRanges: [],
          groupedSelectedRanges: [],
        };
      });
      return;
    }

    // Otherwise, it must be dropping into the grouped list, so we just need to check the source
    const isSameList = source.droppableId === GROUPED_LIST_ID;
    let destinationIndex = destination.index;
    if (isSameList && source.index < destination.index) {
      // react-beautiful-dnd adjusts the index when dragging within a list already, however that only supports single selection
      // We need to change it back to the index we actually want it to drop at before adjusting for the removed source index, as
      // we adjust the index based on all the selected ranges, not just the source.index.
      destinationIndex += 1;
    }
    this.setState(
      ({ columns, ungroupedSelectedRanges, groupedSelectedRanges }) => {
        const newColumns = [...columns];
        const sourceItems = isSameList
          ? newColumns
          : this.getSortedUngroupedColumns().map(c => c.name);
        const sourceRanges = isSameList
          ? groupedSelectedRanges
          : ungroupedSelectedRanges;
        const draggedItems = DragUtils.reorder(
          sourceItems,
          sourceRanges,
          newColumns,
          destinationIndex
        );

        // Select the newly dropped items
        const insertIndex = isSameList
          ? DragUtils.adjustDestinationIndex(
              destinationIndex,
              groupedSelectedRanges
            )
          : destinationIndex;
        const newSelectedRanges = [
          [insertIndex, insertIndex + draggedItems.length - 1],
        ];
        return {
          columns: newColumns,
          ungroupedSelectedRanges: [],
          groupedSelectedRanges: newSelectedRanges,
        };
      }
    );
    this.resetSelection();
  }

  handleUngroupedSelect(itemIndex) {
    log.debug('handleUngroupedSelect');

    this.setState(({ columns }) => ({
      columns: RollupRows.addGroupings(columns, [
        this.getSortedUngroupedColumns()[itemIndex].name,
      ]),
      ungroupedSelectedRanges: [],
      groupedSelectedRanges: [],
    }));
  }

  handleUngroupedSelectionChange(ungroupedSelectedRanges) {
    log.debug2('handleUngroupedSelectionChange', ungroupedSelectedRanges);
    this.setState(
      ({ ungroupedSelectedRanges: stateUngroupedSelectedRanges }) => {
        if (ungroupedSelectedRanges === stateUngroupedSelectedRanges) {
          return null;
        }

        return { ungroupedSelectedRanges, groupedSelectedRanges: [] };
      }
    );
  }

  handleGroupedSelectionChange(groupedSelectedRanges) {
    log.debug2('handleGroupedSelectedRanges', groupedSelectedRanges);
    this.setState(({ groupedSelectedRanges: stateGroupedSelectedRanges }) => {
      if (groupedSelectedRanges === stateGroupedSelectedRanges) {
        return null;
      }

      return { groupedSelectedRanges, ungroupedSelectedRanges: [] };
    });
  }

  handleDeleteClicked(index) {
    this.setState(({ columns }) => {
      const newColumns = columns.slice();
      newColumns.splice(index, 1);
      return { columns: newColumns };
    });
  }

  handleShowConstituentsChange() {
    this.setState(({ showConstituents }) => ({
      showConstituents: !showConstituents,
    }));
  }

  handleShowNonAggregatedColumnsChange() {
    this.setState(({ showNonAggregatedColumns }) => ({
      showNonAggregatedColumns: !showNonAggregatedColumns,
    }));
  }

  updateFromConfig() {
    const { config } = this.props;
    const {
      columns = [],
      showConstituents = true,
      showNonAggregatedColumns = true,
    } = config ?? {};
    this.setState({ columns, showConstituents, showNonAggregatedColumns });
  }

  sendChange() {
    const { onChange } = this.props;
    const { columns, showConstituents, showNonAggregatedColumns } = this.state;
    onChange({
      columns,
      showConstituents,
      showNonAggregatedColumns,
    });
  }

  getCachedUngroupedColumns = memoize((columns, groupedColumns) =>
    columns.filter(
      column =>
        RollupRows.isGroupable(column) &&
        !groupedColumns.find(name => name === column.name)
    )
  );

  getCachedSortedColumns = memoize((columns, sort) =>
    sort == null
      ? [...columns]
      : TableUtils.sortColumns(columns, sort === RollupRows.SORT.ASCENDING)
  );

  getUngroupedColumns() {
    const { model } = this.props;
    const { columns, searchFilter } = this.state;
    const { originalColumns } = model;

    return this.getCachedUngroupedColumns(
      originalColumns,
      columns,
      searchFilter
    );
  }

  getSortedUngroupedColumns() {
    const { sort } = this.state;
    const columns = this.getUngroupedColumns();
    return this.getCachedSortedColumns(columns, sort);
  }

  renderGroupedItem({ item, itemIndex, isClone, selectedCount }) {
    const indent = isClone ? '' : '\u00A0\u00A0'.repeat(itemIndex);
    const text = `${indent}${item}`;
    const badgeText = isClone ? `${selectedCount}` : null;
    const className = isClone ? 'item-list-item-clone' : '';
    return (
      <>
        {DraggableItemList.renderTextItem({ text, badgeText, className })}
        {!isClone && (
          <ButtonOld
            className="btn btn-link btn-link-icon btn-delete-grouping float-right"
            onClick={() => this.handleDeleteClicked(itemIndex)}
          >
            <FontAwesomeIcon icon={vsTrash} />
          </ButtonOld>
        )}
      </>
    );
  }

  render() {
    const {
      columns,
      dragSource,
      searchFilter,
      groupedSelectedRanges,
      ungroupedSelectedRanges,
      showConstituents,
      showNonAggregatedColumns,
      sort,
    } = this.state;

    const ungroupedColumns = this.getSortedUngroupedColumns();
    let groupListHeight = columns.length * DraggableItemList.DEFAULT_ROW_HEIGHT;
    if (dragSource?.droppableId === UNGROUPED_LIST_ID) {
      groupListHeight += DraggableItemList.DEFAULT_ROW_HEIGHT;
    }
    const ungroupMaxListHeight =
      ungroupedColumns.length * DraggableItemList.DEFAULT_ROW_HEIGHT + 10;
    const ungroupMinListHeight = Math.min(
      3 * DraggableItemList.DEFAULT_ROW_HEIGHT,
      ungroupMaxListHeight
    );

    return (
      <div
        role="menu"
        className={classNames('rollup-rows', {
          'is-dragging': dragSource != null,
        })}
        tabIndex="0"
      >
        <DragDropContext
          onDragEnd={this.handleDragEnd}
          onDragStart={this.handleDragStart}
        >
          <div className="rollup-rows-group-by">
            <div className="section-title">Group By</div>
            {columns.length === 0 && (
              <Droppable isDragDisabled droppableId="placeholder">
                {(provided, snapshot) => (
                  <div
                    className={classNames('placeholder', 'text-muted', {
                      'is-dragging-from-this': snapshot.draggingFromThisWith,
                      'is-dragging-over': snapshot.isDraggingOver,
                      'is-dropping': snapshot.draggingOverWith,
                    })}
                    ref={provided.innerRef}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...provided.droppableProps}
                  >
                    Create rollup by dragging columns here, from the available
                    columns list below.
                  </div>
                )}
              </Droppable>
            )}
            {columns.length > 0 && (
              <DraggableItemList
                draggingItemClassName="rollup-rows-dragging-grouped-item"
                draggablePrefix={GROUPED_LIST_ID}
                droppableId={GROUPED_LIST_ID}
                itemCount={columns.length}
                items={columns}
                offset={0}
                onSelectionChange={this.handleGroupedSelectionChange}
                ref={this.groupedList}
                renderItem={this.renderGroupedItem}
                selectedRanges={groupedSelectedRanges}
                style={{ height: groupListHeight }}
                isMultiSelect
              />
            )}
          </div>
          <div className="rollup-rows-available-columns">
            <div className="section-title">Available Grouping Columns</div>
            <div className="top-menu">
              <SearchInput
                className="w-100"
                value={searchFilter}
                matchCount={
                  searchFilter ? ungroupedSelectedRanges.length : null
                }
                placeholder="Find column..."
                onChange={this.handleSearchChange}
              />
              <ButtonOld
                className={classNames('btn-link btn-link-icon', {
                  active: sort === RollupRows.SORT.ASCENDING,
                })}
                onClick={this.handleSortAscending}
              >
                <FontAwesomeIcon icon={dhSortAlphaDown} />
                <Tooltip>Sort ascending</Tooltip>
              </ButtonOld>
              <ButtonOld
                className={classNames('btn-link btn-link-icon', {
                  active: sort === RollupRows.SORT.DESCENDING,
                })}
                onClick={this.handleSortDescending}
              >
                <FontAwesomeIcon icon={dhSortAlphaUp} />
                <Tooltip>Sort descending</Tooltip>
              </ButtonOld>
            </div>
            <DraggableItemList
              className="rollup-available-grouping-columns"
              draggablePrefix={UNGROUPED_LIST_ID}
              droppableId={UNGROUPED_LIST_ID}
              itemCount={ungroupedColumns.length}
              items={ungroupedColumns}
              renderItem={RollupRows.renderColumn}
              offset={0}
              onSelect={this.handleUngroupedSelect}
              onSelectionChange={this.handleUngroupedSelectionChange}
              ref={this.ungroupedList}
              selectedRanges={ungroupedSelectedRanges}
              style={{
                maxHeight: ungroupMaxListHeight,
                minHeight: ungroupMinListHeight,
              }}
              isDropDisabled={dragSource?.droppableId !== GROUPED_LIST_ID}
              isMultiSelect
            />
            <div className="bottom-menu">
              <div className="label">Show:</div>
              <Checkbox
                checked={showConstituents}
                onChange={this.handleShowConstituentsChange}
              >
                Constituents
              </Checkbox>
              <Checkbox
                checked={showNonAggregatedColumns}
                onChange={this.handleShowNonAggregatedColumnsChange}
              >
                Non-Aggregated Columns
              </Checkbox>
            </div>
          </div>
        </DragDropContext>
      </div>
    );
  }
}

RollupRows.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  onChange: PropTypes.func,
  config: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    showConstituents: PropTypes.bool,
    showNonAggregatedColumns: PropTypes.bool,
  }),
};

RollupRows.defaultProps = {
  config: null,
  onChange: () => {},
};

export default RollupRows;
