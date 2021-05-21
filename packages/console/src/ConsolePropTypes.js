import PropTypes from 'prop-types';

const CommandHistoryItem = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
});

const ConsolePropTypes = Object.freeze({
  CommandHistoryItem,
});

export default ConsolePropTypes;
