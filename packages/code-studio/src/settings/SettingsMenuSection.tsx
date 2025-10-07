import React, { type ReactElement } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Collapse } from '@deephaven/components';
import { vsTriangleDown } from '@deephaven/icons';

type SettingsMenuSectionProps = React.PropsWithChildren<{
  isExpanded: boolean;
  sectionKey: string;
  title: ReactElement;
  onToggle: (sectionkey: string) => void;
}>;

function SettingsMenuSection(props: SettingsMenuSectionProps): ReactElement {
  const { children, isExpanded, sectionKey, title, onToggle } = props;
  return (
    <>
      <div>
        <Button
          kind="ghost"
          className="btn-collapse-trigger"
          onClick={() => onToggle(sectionKey)}
        >
          <div className="d-flex align-items-center flex-grow-1">{title}</div>
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
}

export default SettingsMenuSection;
