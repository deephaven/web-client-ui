import React, { memo } from 'react';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { type IconDefinition, vsClose } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { NavTabItem } from './NavTabList';
import Button from '../Button';
import ContextActions from '../context-actions/ContextActions';
import { type ResolvableContextAction } from '../context-actions';
import { Tooltip } from '../popper';

interface NavTabProps {
  tab: NavTabItem;
  onSelect: (key: string) => void;
  onClose?: (key: string) => void;
  isActive: boolean;
  activeRef: React.RefObject<HTMLDivElement>;
  index: number;
  isDraggable: boolean;
  contextActions?: ResolvableContextAction | ResolvableContextAction[];
}

const NavTab = memo(
  ({
    tab,
    onClose,
    onSelect,
    isActive,
    activeRef,
    index,
    isDraggable,
    contextActions,
  }: NavTabProps) => {
    const { key, isClosable = onClose != null, title, icon } = tab;

    let iconElem: JSX.Element | undefined;
    if (icon != null) {
      iconElem = React.isValidElement(icon) ? (
        icon
      ) : (
        <FontAwesomeIcon icon={icon as IconDefinition} />
      );
    }

    return (
      <Draggable
        draggableId={key}
        key={key}
        index={index}
        isDragDisabled={!isDraggable}
      >
        {(provided, snapshot) => (
          <div
            className="context-menu-wrapper"
            ref={isActive ? activeRef : null}
          >
            <div
              ref={provided.innerRef}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.draggableProps}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.dragHandleProps}
              className={classNames(
                'btn btn-link btn-nav-tab',
                { active: isActive },
                { dragging: snapshot.isDragging }
              )}
              data-testid={`btn-nav-tab-${title}`}
              role="tab"
              tabIndex={0}
              onAuxClick={e => {
                // Middle mouse button was clicked, and no buttons remain pressed
                if (isClosable && e.button === 1 && e.buttons === 0) {
                  onClose?.(key);
                }
              }}
              onClick={e => {
                // have to have seperate check onClick for Safari not supporting AuxClick
                if (isClosable && e.button === 1 && e.buttons === 0) {
                  onClose?.(key);
                  return;
                }
                // Left mouse button was clicked, and no buttons remain pressed
                if (e.button === 0 && e.buttons === 0) {
                  // focus is normally set on mousedown, but dnd calls preventDefault for drag purposes
                  // so we can call focus on the firing of the actual click event manually
                  (e.target as HTMLDivElement).focus();

                  onSelect(key);
                }
              }}
              onKeyPress={event => {
                if (event.key === 'Enter') onSelect(key);
              }}
            >
              {iconElem}
              <span className="btn-nav-tab-title">
                {title}
                <Tooltip>{title}</Tooltip>
              </span>
              {isClosable && (
                <Button
                  kind="ghost"
                  className="btn-nav-tab-close"
                  onClick={event => {
                    onClose?.(key);
                    event.stopPropagation();
                    event.preventDefault();
                  }}
                  icon={vsClose}
                  tooltip="Close"
                />
              )}
            </div>
            <ContextActions actions={contextActions} />
          </div>
        )}
      </Draggable>
    );
  }
);

NavTab.displayName = 'NavTab';

export default NavTab;
