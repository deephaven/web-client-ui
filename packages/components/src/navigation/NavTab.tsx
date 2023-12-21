import React, { memo } from 'react';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { vsClose } from '@deephaven/icons';
import type { NavTabItem } from './NavTabList';
import Button from '../Button';
import ContextActions from '../context-actions/ContextActions';
import { ResolvableContextAction } from '../context-actions';

interface NavTabProps {
  tab: NavTabItem;
  onSelect: (key: string) => void;
  onClose?: (key: string) => void;
  isActive: boolean;
  activeRef: React.RefObject<HTMLDivElement>;
  index: number;
  isDraggable: boolean;
  contextActions?: ResolvableContextAction[];
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
    const { key, isClosable = false, title } = tab;

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
              onClick={e => {
                (e.target as HTMLDivElement).focus();
                // focus is normally set on mousedown, but dnd calls preventDefault for drag purposes
                // so we can call focus on the firing of the actual click event manually

                onSelect(key);
              }}
              onKeyPress={event => {
                if (event.key === 'Enter') onSelect(key);
              }}
            >
              {title}
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
