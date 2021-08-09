import PropTypes from 'prop-types';

const Column = PropTypes.shape({
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  description: PropTypes.string,
  constituentType: PropTypes.string,
});

const FilterCondition = PropTypes.shape({
  not: PropTypes.func.isRequired,
  and: PropTypes.func.isRequired,
  or: PropTypes.func.isRequired,
});

const Sort = PropTypes.shape({
  asc: PropTypes.func.isRequired,
  desc: PropTypes.func.isRequired,
  abs: PropTypes.func.isRequired,
  column: Column.isRequired,
  direction: PropTypes.string.isRequired,
  isAbs: PropTypes.bool.isRequired,
});

const Table = PropTypes.shape({
  columns: PropTypes.arrayOf(Column).isRequired,
  customColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  filter: PropTypes.arrayOf(FilterCondition),
  addEventListener: PropTypes.func.isRequired,
  removeEventListener: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  sort: PropTypes.arrayOf(PropTypes.any),
  copy: PropTypes.func.isRequired,
  applyFilter: PropTypes.func.isRequired,
  applySort: PropTypes.func.isRequired,
  applyCustomColumns: PropTypes.func.isRequired,
  description: PropTypes.string,
});

const TreeTable = PropTypes.shape({
  columns: PropTypes.arrayOf(Column),
  filter: PropTypes.arrayOf(PropTypes.any),
  isExpanded: PropTypes.func.isRequired,
  saveExpandedState: PropTypes.func.isRequired,
  addEventListener: PropTypes.func.isRequired,
  removeEventListener: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  sort: PropTypes.arrayOf(PropTypes.any),
  applyFilter: PropTypes.func.isRequired,
  applySort: PropTypes.func.isRequired,
});

const VariableDefinition = PropTypes.shape({
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
});

const VariableChanges = PropTypes.shape({
  created: PropTypes.arrayOf(VariableDefinition).isRequired,
  updated: PropTypes.arrayOf(VariableDefinition).isRequired,
  removed: PropTypes.arrayOf(VariableDefinition).isRequired,
});

const RollupConfig = PropTypes.shape({
  groupingColumns: PropTypes.arrayOf(PropTypes.string),
  aggregations: PropTypes.shape({}),
  includeConstituents: PropTypes.bool,
  includeOriginalColumns: PropTypes.bool,
  includeDescriptions: PropTypes.bool,
});

const User = PropTypes.shape({
  name: PropTypes.string.isRequired,
  operateAs: PropTypes.string.isRequired,
});

const IdeSession = PropTypes.shape({
  addEventListener: PropTypes.func.isRequired,
  removeEventListener: PropTypes.func.isRequired,
  onLogMessage: PropTypes.func,
  getTable: PropTypes.func.isRequired,
  runCode: PropTypes.func.isRequired,
});

const DhPropTypes = Object.freeze({
  Column,
  FilterCondition,
  IdeSession,
  RollupConfig,
  Sort,
  Table,
  TreeTable,
  User,
  VariableChanges,
  VariableDefinition,
});

export default DhPropTypes;
