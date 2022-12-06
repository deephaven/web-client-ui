import React, { Component, ErrorInfo } from 'react';
import classNames from 'classnames';
import {
  Button,
  ContextActions,
  DropdownActions,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import memoize from 'memoize-one';
import { LayoutUtils, PanelManager } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { Container } from '@deephaven/golden-layout';
import { vsGripper } from '@deephaven/icons';
import { TableUtils } from '@deephaven/jsapi-utils';
import {
  TypeValue as FilterTypeValue,
  getLabelForNumberFilter,
  getLabelForTextFilter,
  getLabelForDateFilter,
  getLabelForBooleanFilter,
} from '@deephaven/filters';
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
  operators?: DropdownActions;
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
  toastX?: number;
  toastY?: number;
  offsetX: number;
  offsetY: number;
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

  static getLabelForFilter(
    columnType: string,
    filterType: FilterTypeValue
  ): string {
    try {
      if (
        TableUtils.isNumberType(columnType) ||
        TableUtils.isCharType(columnType)
      ) {
        return getLabelForNumberFilter(filterType);
      }
      if (TableUtils.isTextType(columnType)) {
        return getLabelForTextFilter(filterType);
      }
      if (TableUtils.isDateType(columnType)) {
        return getLabelForDateFilter(filterType);
      }
      if (TableUtils.isBooleanType(columnType)) {
        return getLabelForBooleanFilter(filterType);
      }
      throw new Error(`Unrecognized column type: ${columnType}`);
    } catch (e) {
      log.warn(e);
      return '';
    }
  }

  constructor(props: LinkerOverlayContentProps) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleEscapePressed = this.handleEscapePressed.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.dialogRef = React.createRef();
    this.handleOperatorChanged = this.handleOperatorChanged.bind(this);

    this.state = {
      mouseX: undefined,
      mouseY: undefined,
      toastX: undefined,
      toastY: undefined,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      mode: 'select',
    };
  }

  componentDidMount(): void {
    window.addEventListener('mousemove', this.handleMouseMove, true);
    this.setState({
      toastX: this.dialogRef.current?.getBoundingClientRect().left,
      toastY: this.dialogRef.current?.getBoundingClientRect().top,
    });
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);
  }

  dialogRef: React.RefObject<HTMLInputElement>;

  getoperators = memoize(
    (linkId: string, columnType: string): DropdownActions =>
      TableUtils.getFilterTypes(columnType).flatMap((type, index) => {
        // Remove case-insensitive string comparisons
        if (type === 'eqIgnoreCase' || type === `notEqIgnoreCase`) {
          return [];
        }
        let symbol = '';

        if (type === 'startsWith') {
          symbol = 'a*';
        } else if (type === 'endsWith') {
          symbol = '*z';
        } else {
          symbol = TableUtils.getFilterOperatorString(type);
        }

        return [
          {
            title: LinkerOverlayContent.getLabelForFilter(columnType, type),
            icon: <b>{symbol}</b>,
            action: () => this.handleOperatorChanged(linkId, type),
            order: index,
          },
        ];
      })
  );

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
    const newLinks = links.map(link =>
      link.id === linkId ? { ...link, operator: type } : link
    ) as Link[];
    onLinksUpdated(newLinks);
  }

  handleMouseMove(event: MouseEvent): void {
    this.setState({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      this.setState({
        mode: 'delete',
      });
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      this.setState({
        mode: 'select',
      });
    }
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
      selectedIds,
      messageText,
      onLinkSelected,
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
      mode,
    } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, start, end, operator } = link;
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
          const operators =
            start.columnType != null &&
            !TableUtils.isBooleanType(start.columnType)
              ? this.getoperators(id, start.columnType)
              : undefined;
          return {
            x1,
            y1,
            x2,
            y2,
            id,
            className,
            operator,
            operators,
          };
        } catch (error) {
          log.error('Unable to get point for link', link, error);
          return null;
        }
      })
      .filter(item => item != null) as VisibleLink[];
    let top = toastY;
    let left = toastX;
    if (isDragging) {
      top = Math.min(
        Math.max(0, (mouseY ?? 0) + offsetY),
        window.innerHeight - (this.dialogRef.current?.offsetHeight ?? 0)
      );
      left = Math.min(
        Math.max(0, (mouseX ?? 0) + offsetX),
        window.innerWidth - (this.dialogRef.current?.offsetWidth ?? 0)
      );
    }

    return (
      <div
        className={classNames('linker-overlay', {
          'danger-delete': mode === 'delete',
        })}
      >
        {visibleLinks.map(
          ({ x1, y1, x2, y2, id, className, operator, operators }) => (
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
              operators={operators}
            />
          )
        )}
        <div
          className={classNames('linker-toast-dialog', {
            isLoading: toastX === undefined && isDragging === false,
          })}
          ref={this.dialogRef}
          style={{ top, left }}
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
