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
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
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

export type LinkerOverlayContentState = {
  mouseX?: number;
  mouseY?: number;
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
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleEscapePressed = this.handleEscapePressed.bind(this);
    this.handleOperatorChanged = this.handleOperatorChanged.bind(this);

    this.state = {
      mouseX: undefined,
      mouseY: undefined,
      mode: 'select',
    };
  }

  componentDidMount(): void {
    window.addEventListener('blur', this.handleBlur, true);
    window.addEventListener('mousemove', this.handleMouseMove, true);
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    window.removeEventListener('blur', this.handleBlur, true);
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);
  }

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

  handleMouseMove(event: MouseEvent): void {
    this.setState({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.setState({
        mode: 'delete',
      });
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

    const { mouseX, mouseY, mode } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, start, end, operator } = link;
          const startColumnType = start.columnType;
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
          };
        } catch (error) {
          log.error('Unable to get point for link', link, error);
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
          ({ x1, y1, x2, y2, id, className, operator, startColumnType }) => (
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
              onOperatorChanged={this.handleOperatorChanged}
            />
          )
        )}
        <div className="linker-toast-dialog">
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
