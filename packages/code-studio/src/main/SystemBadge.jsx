import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Tooltip } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import { getServerConfigValues } from '../redux/selectors';
import './SystemBadge.scss';

const SystemBadge = ({ systemName, hostName, systemType, systemColor }) => (
  <div
    className={classNames(
      'system-badge',
      {
        'is-system-type': !systemColor,
      },
      `system-type-${systemType.toLowerCase()}`,
      { 'is-dark-bg': systemColor && ColorUtils.isDark(systemColor) }
    )}
    style={
      systemColor
        ? {
            backgroundColor: systemColor,
          }
        : {}
    }
  >
    <label>
      {systemType}
      <Tooltip>
        System: <b>{systemName}</b> - {hostName}
      </Tooltip>
    </label>
  </div>
);

SystemBadge.propTypes = {
  systemName: PropTypes.string.isRequired,
  hostName: PropTypes.string.isRequired,
  systemType: PropTypes.string.isRequired,
  systemColor: PropTypes.string,
};

SystemBadge.defaultProps = {
  systemColor: null,
};

const mapStateToProps = state => {
  const {
    systemName,
    hostName,
    systemType,
    systemColor,
  } = getServerConfigValues(state);
  return { systemName, hostName, systemType, systemColor };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  SystemBadge
);
