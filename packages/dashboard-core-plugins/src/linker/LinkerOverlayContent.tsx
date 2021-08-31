import React, { Component, ErrorInfo } from 'react';
import classNames from 'classnames';
import { ContextActions, GLOBAL_SHORTCUTS } from '@deephaven/components';
import Log from '@deephaven/log';
import { PanelManager } from '../../../dashboard/panels';
import LayoutUtils from '../../../layout/LayoutUtils';
import { Link, LinkPoint } from './LinkerUtils';
import LinkerLink from './LinkerLink';
import './LinkerOverlayContent.scss';

const log = Log.module('LinkerOverlayContent');

// [x,y] screen coordinates used by the Linker
export type LinkerCoordinate = [number, number];

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

    this.state = {
      mouseX: undefined,
      mouseY: undefined,
    };
  }

  componentDidMount(): void {
    window.addEventListener('mousemove', this.handleMouseMove, true);
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
  }

  /** Gets the on screen points for a link start or end spec */
  getPointFromLinkPoint(linkPoint: LinkPoint): LinkerCoordinate {
    const { panelManager } = this.props;
    const { panelId, columnName } = linkPoint;
    const panel = panelManager.getOpenedPanelById(panelId);
    if (panel != null) {
      if (!panel.getCoordinateForColumn) {
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
    return LayoutUtils.getTabPoint(glContainer) as LinkerCoordinate;
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

  render(): JSX.Element {
    const {
      disabled,
      links,
      messageText,
      onLinkDeleted,
      onAllLinksDeleted,
      onDone,
    } = this.props;

    const { mouseX, mouseY } = this.state;
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
          if (isReversed) {
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
        <div className="linker-toast-dialog">
          <div className="toast-body">{messageText}</div>
          <div className="toast-footer">
            <button
              className="btn btn-outline-primary"
              onClick={onAllLinksDeleted}
              type="button"
            >
              Clear All
            </button>
            <button className="btn btn-primary" onClick={onDone} type="button">
              Done
            </button>
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
