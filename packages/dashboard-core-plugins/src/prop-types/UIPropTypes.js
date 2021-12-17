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

const User = PropTypes.shape({
  name: PropTypes.string.isRequired,
  operateAs: PropTypes.string.isRequired,
  groups: PropTypes.arrayOf(PropTypes.string).isRequired,
  permissions: PropTypes.shape({
    isSuperUser: PropTypes.bool.isRequired,
    isQueryViewOnly: PropTypes.bool.isRequired,
    isNonInteractive: PropTypes.bool.isRequired,
    canUsePanels: PropTypes.bool.isRequired,
    canCreateDashboard: PropTypes.bool.isRequired,
    canCreateCodeStudio: PropTypes.bool.isRequired,
    canCreateQueryMonitor: PropTypes.bool.isRequired,
    canCopy: PropTypes.bool.isRequired,
    canDownloadCsv: PropTypes.bool.isRequired,
  }).isRequired,
});

const UIPropTypes = Object.freeze({
  InputFilter,
  LinkPoint,
  Link,
  Links,
  Panel,
  User,
});

export default UIPropTypes;
