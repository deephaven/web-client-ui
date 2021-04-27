import PropTypes from 'prop-types';
import CommonPropTypes from './CommonPropTypes';

const InputFilter = PropTypes.shape({
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  value: CommonPropTypes.nullableString.isRequired,
});

const Panel = PropTypes.shape({
  state: PropTypes.shape({
    panelState: PropTypes.shape({}),
  }),
});

const LinkPoint = PropTypes.shape({
  panelId: PropTypes.string.isRequired,
  columnName: PropTypes.string.isRequired,
  columnType: PropTypes.string.isRequired,
});

const LinkPointUntyped = PropTypes.shape({
  panelId: PropTypes.string.isRequired,
  columnName: PropTypes.string.isRequired,
});

const Link = PropTypes.shape({
  start: LinkPointUntyped,
  end: LinkPointUntyped,
  id: PropTypes.string,
  isReversed: PropTypes.bool,
});

const Links = PropTypes.arrayOf(Link);

const CommandHistoryItem = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
});

const UIPropTypes = Object.freeze({
  InputFilter,
  LinkPoint,
  Link,
  Links,
  Panel,
  CommandHistoryItem,
});

export default UIPropTypes;
