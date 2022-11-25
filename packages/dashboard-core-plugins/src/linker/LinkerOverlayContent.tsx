import React, { Component, ErrorInfo } from 'react';
import classNames from 'classnames';
import {
  Button,
  ContextActions,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import { LayoutUtils, PanelManager } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { Container } from '@deephaven/golden-layout';
import { vsGripper } from '@deephaven/icons';
import {
  isLinkableFromPanel,
  Link,
  LinkerCoordinate,
  LinkPoint,
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
};

export type LinkerOverlayContentProps = {
  disabled?: boolean;
  links: Link[];
  messageText: string;
  onLinkDeleted: (linkId: string) => void;
  onAllLinksDeleted: () => void;
  onCancel: () => void;
  onDone: () => void;
  panelManager: PanelManager;
};

export type LinkerOverlayContentState = {
  mouseX?: number;
  mouseY?: number;
  toastX?: number;
  toastY?: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
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

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleEscapePressed = this.handleEscapePressed.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.dialogRef = React.createRef();

    this.state = {
      mouseX: undefined,
      mouseY: undefined,
      toastX: undefined,
      toastY: undefined,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
    };
  }

  componentDidMount(): void {
    window.addEventListener('mousemove', this.handleMouseMove, true);
    this.setState({
      toastX: this.dialogRef.current?.getBoundingClientRect().left,
      toastY: this.dialogRef.current?.getBoundingClientRect().top,
    });
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
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

  handleMouseMove(event: MouseEvent): void {
    this.setState({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  handleEscapePressed(): void {
    const { onCancel } = this.props;
    onCancel();
  }

  handleMouseDown(): void {
    const { mouseX, mouseY, toastX, toastY } = this.state;
    let offsetX = 0;
    let offsetY = 0;
    if (
      mouseX !== undefined &&
      mouseY !== undefined &&
      toastX !== undefined &&
      toastY !== undefined
    ) {
      offsetX = toastX - mouseX;
      offsetY = toastY - mouseY;
    }
    this.setState({
      isDragging: true,
      offsetX,
      offsetY,
    });
  }

  handleMouseUp(): void {
    const { mouseX, mouseY, offsetX, offsetY } = this.state;
    this.setState({
      isDragging: false,
      toastX: (mouseX ?? 0) + offsetX,
      toastY: (mouseY ?? 0) + offsetY,
    });
  }

  render(): JSX.Element {
    const {
      disabled,
      links,
      messageText,
      onLinkDeleted,
      onAllLinksDeleted,
      onDone,
    } = this.props;

    const {
      mouseX,
      mouseY,
      toastX,
      toastY,
      offsetX,
      offsetY,
      isDragging,
    } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, start, end } = link;
          let [x1, y1] = this.getPointFromLinkPoint(start);
          let x2 = mouseX ?? x1;
          let y2 = mouseY ?? y1;
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
            { interactive: link.end == null }
          );
          return { x1, y1, x2, y2, id, className };
        } catch (error) {
          log.error('Unable to get point for link', link, error);
          return null;
        }
      })
      .filter(item => item != null) as VisibleLink[];

    return (
      <div className="linker-overlay">
        <svg>
          {visibleLinks.map(({ x1, y1, x2, y2, id, className }) => (
            <LinkerLink
              className={className}
              id={id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              key={id}
              onClick={onLinkDeleted}
            />
          ))}
        </svg>
        <div
          className={classNames('linker-toast-dialog', {
            isLoading: toastX === undefined && isDragging === false,
          })}
          ref={this.dialogRef}
          style={
            isDragging
              ? {
                  top: (mouseY ?? 0) + (offsetY ?? 0),
                  left: (mouseX ?? 0) + (offsetX ?? 0),
                }
              : {
                  top: toastY,
                  left: toastX,
                }
          }
        >
          <Button
            draggable
            kind="inline"
            className="btn-drag-handle"
            tooltip="Drag to reposition"
            icon={vsGripper}
            onClick={() => {
              // no-op
            }}
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
          />
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
