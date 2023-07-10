import PropTypes from 'prop-types';

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

const User = PropTypes.shape({
  name: PropTypes.string.isRequired,
  operateAs: PropTypes.string.isRequired,
  groups: PropTypes.arrayOf(PropTypes.string).isRequired,
  permissions: PropTypes.shape({
    canUsePanels: PropTypes.bool.isRequired,
    canCopy: PropTypes.bool.isRequired,
    canDownloadCsv: PropTypes.bool.isRequired,
    canLogout: PropTypes.bool.isRequired,
  }).isRequired,
});

const UIPropTypes = Object.freeze({
  LinkPoint,
  Link,
  Links,
  Panel,
  User,
});

export default UIPropTypes;
