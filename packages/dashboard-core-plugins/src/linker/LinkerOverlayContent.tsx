import React, { Component, ErrorInfo } from 'react';
import classNames from 'classnames';
import {
  Button,
  ContextActions,
  GLOBAL_SHORTCUTS,
  Tooltip,
} from '@deephaven/components';
import { LayoutUtils, PanelManager } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { Container } from '@deephaven/golden-layout';
import { vsGripper } from '@deephaven/icons';
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
import clamp from 'lodash.clamp';
import {
  isLinkableFromPanel,
  Link,
  LinkerCoordinate,
  LinkPoint,
  LinkType,
} from './LinkerUtils';
import LinkerLink from './LinkerLink';
import './LinkerOverlayContent.scss';

const log = Log.module('LinkerOverlayContent');

export type VisibleLink = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: string;
  className: string;
  type: LinkType;
  operator: FilterTypeValue;
  startColumnType: string | null;
};

export type LinkerOverlayContentProps = {
  disabled?: boolean;
  links: Link[];
  selectedIds: Set<string>;
  messageText: string;
  onLinkSelected: (linkId: string) => void;
  onLinkDeleted: (linkId: string) => void;
  onAllLinksDeleted: () => void;
  onLinksUpdated: (newLinks: Link[]) => void;
  onCancel: () => void;
  onDone: () => void;
  panelManager: PanelManager;
};

type Point = { x: number; y: number };

export type LinkerOverlayContentState = {
  mouse?: Point;
  dialog?: Point;
  offset: Point;
  isDragging: boolean;
  mode: 'select' | 'delete';
};

export class LinkerOverlayContent extends Component<
  LinkerOverlayContentProps,
  LinkerOverlayContentState
> {
  static defaultProps = {
    disabled: 'false',
  };

  constructor(props: LinkerOverlayContentProps) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleEscapePressed = this.handleEscapePressed.bind(this);
    this.handleOperatorChanged = this.handleOperatorChanged.bind(this);

    this.dialogRef = React.createRef();

    this.state = {
      mouse: undefined,
      dialog: undefined,
      offset: { x: 0, y: 0 },
      isDragging: false,
      mode: 'select',
    };
  }

  componentDidMount(): void {
    window.addEventListener('blur', this.handleBlur, true);
    window.addEventListener('mousemove', this.handleMouseMove, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);
    window.addEventListener('resize', this.handleResize, true);
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    window.removeEventListener('blur', this.handleBlur, true);
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);
    window.removeEventListener('resize', this.handleResize, true);
  }

  dialogRef: React.RefObject<HTMLInputElement>;

  /** Gets the on screen points for a link start or end spec */
  getPointFromLinkPoint(linkPoint: LinkPoint): LinkerCoordinate {
    const { panelManager } = this.props;
    const { panelId, columnName } = linkPoint;
    const panel = panelManager.getOpenedPanelById(panelId);
    if (panel != null) {
      if (!isLinkableFromPanel(panel)) {
        throw new Error(
          `Panel does not have getCoordinateForColumn method: ${panelId}`
        );
      }
      try {
        // TODO: remove try/catch when IDS-7371 is fixed.
        // getCoordinateForColumn throws an exception when accessing
        // columns on a model while it reconnects
        const coordinate = panel.getCoordinateForColumn(columnName);
        if (coordinate != null) {
          return coordinate;
        }
      } catch (e) {
        log.error('Could not get coordinate for column', columnName, panel);
      }
    }
    // Fallback to panel container if the panel itself
    // crashed, unmounted, and removed from openedPanelMap.
    const glContainer = panelManager.getContainerByPanelId(panelId);
    if (glContainer == null) {
      throw new Error(`Unable to find panel container for id: ${panelId}`);
    }
    return LayoutUtils.getTabPoint((glContainer as unknown) as Container);
  }

  handleOperatorChanged(linkId: string, type: FilterTypeValue): void {
    const { links, onLinksUpdated } = this.props;
    const newLinks: Link[] = links.map(link =>
      link.id === linkId ? { ...link, operator: type } : link
    );
    onLinksUpdated(newLinks);
  }

  handleBlur(): void {
    this.setState({ mode: 'select' });
  }

  handleResize(): void {
    const { dialog } = this.state;
    if (dialog && this.dialogRef.current) {
      const rect = this.dialogRef.current.getBoundingClientRect();
      const dialogX = clamp(dialog.x, 0, window.innerWidth - rect.width);
      const dialogY = clamp(dialog.y, 0, window.innerHeight - rect.height);
      this.setState({
        dialog: { x: dialogX, y: dialogY },
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    const { offset, isDragging } = this.state;
    this.setState({
      mouse: { x: event.clientX, y: event.clientY },
    });

    if (isDragging && this.dialogRef.current) {
      const rect = this.dialogRef.current.getBoundingClientRect();
      const dialogX = clamp(
        window.innerWidth - (event.clientX + rect.width + offset.x),
        0,
        window.innerWidth - rect.width
      );

      const dialogY = clamp(
        window.innerHeight - (event.clientY + rect.height + offset.y),
        0,
        window.innerHeight - rect.height
      );

      this.setState({
        dialog: { x: dialogX, y: dialogY },
      });
    }
  }

  handleMouseDown(event: React.MouseEvent): void {
    const offset: Point = { x: 0, y: 0 };
    if (this.dialogRef.current) {
      const rect = this.dialogRef.current.getBoundingClientRect();
      offset.x = rect.right - (rect.width + event.clientX);
      offset.y = rect.bottom - (rect.height + event.clientY);
    }
    this.setState({
      isDragging: true,
      offset,
    });
  }

  handleMouseUp(): void {
    this.setState({
      isDragging: false,
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.setState({
        mode: 'delete',
      });
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      const { selectedIds, onLinkDeleted } = this.props;
      event.preventDefault();
      selectedIds.forEach(id => onLinkDeleted(id));
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.setState({
        mode: 'select',
      });
    }
  }

  handleEscapePressed(): void {
    const { onCancel } = this.props;
    onCancel();
  }

  render(): JSX.Element {
    const {
      disabled,
      links,
      selectedIds,
      messageText,
      onLinkSelected,
      onLinkDeleted,
      onAllLinksDeleted,
      onDone,
    } = this.props;

    const { mouse, dialog, isDragging, mode } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, start, end, operator } = link;
          const startColumnType = start.columnType;
          let [x1, y1] = this.getPointFromLinkPoint(start);
          let x2 = mouse?.x ?? x1;
          let y2 = mouse?.y ?? y1;
          if (end != null) {
            [x2, y2] = this.getPointFromLinkPoint(end);
          }
          if (isReversed != null && isReversed) {
            const [tmpX, tmpY] = [x1, y1];
            [x1, y1] = [x2, y2];
            [x2, y2] = [tmpX, tmpY];
          }
          const className = classNames(
            'linker-link',
            { disabled },
            { 'link-filter-source': type === 'filterSource' },
            { 'link-invalid': type === 'invalid' },
            { interactive: link.end == null },
            { 'link-is-selected': selectedIds.has(id) },
            { 'danger-delete': mode === 'delete' }
          );
          return {
            x1,
            y1,
            x2,
            y2,
            id,
            className,
            operator,
            startColumnType,
            type,
          };
        } catch (error) {
          log.warn('Unable to get point for link', link, error);
          return null;
        }
      })
      .filter(item => item != null) as VisibleLink[];

    return (
      <div
        className={classNames('linker-overlay', {
          'danger-delete': mode === 'delete',
        })}
      >
        {visibleLinks.map(
          ({
            x1,
            y1,
            x2,
            y2,
            id,
            className,
            operator,
            startColumnType,
            type,
          }) => (
            <LinkerLink
              className={className}
              id={id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              key={id}
              onClick={onLinkSelected}
              onDelete={onLinkDeleted}
              isSelected={selectedIds.has(id)}
              operator={operator}
              startColumnType={startColumnType}
              type={type}
              onOperatorChanged={this.handleOperatorChanged}
            />
          )
        )}
        <div
          className={classNames('linker-toast-dialog', {
            dragging: isDragging,
          })}
          ref={this.dialogRef}
          style={{ bottom: dialog?.y, right: dialog?.x }}
        >
          <Button
            draggable
            kind="inline"
            className="btn-drag-handle"
            icon={vsGripper}
            onClick={() => {
              // no-op
            }}
            onMouseDown={this.handleMouseDown}
          >
            {!isDragging && <Tooltip>Drag to reposition</Tooltip>}
          </Button>
          <div className="toast-body">{messageText}</div>
          <div className="toast-footer">
            <Button kind="secondary" onClick={onAllLinksDeleted}>
              Clear All
            </Button>
            <Button kind="primary" onClick={onDone}>
              Done
            </Button>
          </div>
        </div>
        <ContextActions
          actions={[
            {
              action: this.handleEscapePressed,
              shortcut: GLOBAL_SHORTCUTS.LINKER_CLOSE,
              isGlobal: true,
            },
          ]}
        />
      </div>
    );
  }
}

export default LinkerOverlayContent;
