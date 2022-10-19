import React, { ReactElement, ReactNode } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Collapse } from '@deephaven/components';
import { vsTriangleDown } from '@deephaven/icons';

interface SettingsMenuSectionProps {
  children: ReactNode;
  isExpanded: boolean;
  sectionKey: string;
  title: ReactElement;
  onToggle: (sectionkey: string) => void;
}

const SettingsMenuSection = (props: SettingsMenuSectionProps): ReactElement => {
  const { children, isExpanded, sectionKey, title, onToggle } = props;
  return (
    <>
      <div>
        <Button
          kind="ghost"
          className="btn-collapse-trigger"
          onClick={() => onToggle(sectionKey)}
        >
          <div className="flex-grow-1">{title}</div>
          <div className="flex-shrink-0">
            <FontAwesomeIcon
              transform={isExpanded ? 'flip-v' : ''}
              icon={vsTriangleDown}
            />
          </div>
        </Button>
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
  onToggle: () => undefined,
};

export default SettingsMenuSection;
