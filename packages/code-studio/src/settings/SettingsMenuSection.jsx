import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Collapse } from '@deephaven/components';
import { vsTriangleDown } from '@deephaven/icons';

const SettingsMenuSection = props => {
  const { children, isExpanded, sectionKey, title, onToggle } = props;
  return (
    <>
      <div>
        <button
          type="button"
          className="btn btn-link btn-collapse-trigger"
          onClick={() => onToggle(sectionKey)}
        >
          <div className="flex-grow-1">{title}</div>
          <div className="flex-shrink-0">
            <FontAwesomeIcon
              transform={isExpanded ? 'flip-v' : ''}
              icon={vsTriangleDown}
            />
          </div>
        </button>
      </div>
      <Collapse in={isExpanded} autoFocusOnShow>
        {children}
      </Collapse>
    </>
  );
};

SettingsMenuSection.propTypes = {
  children: PropTypes.node,
  isExpanded: PropTypes.bool.isRequired,
  sectionKey: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  onToggle: PropTypes.func,
};

SettingsMenuSection.defaultProps = {
  children: null,
  onToggle: () => {},
};

export default SettingsMenuSection;
