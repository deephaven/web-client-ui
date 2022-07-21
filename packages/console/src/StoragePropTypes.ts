import PropTypes from 'prop-types';

const CommandHistoryStorage = PropTypes.shape({
  addItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  getTable: PropTypes.func.isRequired,
});

const CommandHistoryTable = PropTypes.shape({
  size: PropTypes.number.isRequired,
  getSnapshot: PropTypes.func.isRequired,
});

const StoragePropTypes = Object.freeze({
  CommandHistoryStorage,
  CommandHistoryTable,
});

export default StoragePropTypes;
