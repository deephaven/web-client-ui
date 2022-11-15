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
  isSelected: boolean;
  comparisonOperator: FilterTypeValue;
  comparisonOperators: DropdownActions;
};

export type LinkerOverlayContentProps = {
  disabled?: boolean;
  links: Link[];
  messageText: string;
  onLinkSelected: (linkId: string, deleteLink: boolean) => void;
  onAllLinksDeleted: () => void;
  onCancel: () => void;
  onDone: () => void;
  panelManager: PanelManager;
};

export type LinkerOverlayContentState = {
  mouseX?: number;
  mouseY?: number;
  isAltPressed: boolean;
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
    this.handleComparisonOperatorChanged = this.handleComparisonOperatorChanged.bind(
      this
    );

    this.state = {
      mouseX: undefined,
      mouseY: undefined,
      isAltPressed: false,
    };
  }

  componentDidMount(): void {
    window.addEventListener('mousemove', this.handleMouseMove, true);
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

  getComparisonOperators = memoize(
    (linkId: string, columnType: string): DropdownActions =>
      TableUtils.getFilterTypes(columnType).flatMap(type => {
        // Remove case-insensitive operators
        if (type === 'eqIgnoreCase' || type === `notEqIgnoreCase`) {
          return [];
        }
        return [
          {
            title: LinkerOverlayContent.getLabelForFilter(columnType, type),
            action: () => this.handleComparisonOperatorChanged(linkId, type),
            order: 10,
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

  handleComparisonOperatorChanged(linkId: string, type: FilterTypeValue): void {
    const { links } = this.props;
    for (let i = 0; i < links.length; i += 1) {
      if (links[i].id === linkId) {
        links[i].comparisonOperator = type;
      }
    }
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
        isAltPressed: true,
      });
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      this.setState({
        isAltPressed: false,
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
      messageText,
      onLinkSelected,
      onAllLinksDeleted,
      onDone,
    } = this.props;

    const { mouseX, mouseY, isAltPressed } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, isSelected, start, end } = link;
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
            { 'link-is-selected': isSelected },
            { 'alt-pressed': isAltPressed }
          );
          const comparisonOperators = this.getComparisonOperators(
            id,
            start.columnType ?? ''
          );
          return {
            x1,
            y1,
            x2,
            y2,
            id,
            className,
            isSelected,
            comparisonOperators,
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
          'alt-pressed': isAltPressed,
        })}
      >
        <svg>
          {visibleLinks.map(
            ({
              x1,
              y1,
              x2,
              y2,
              id,
              className,
              isSelected,
              comparisonOperators,
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
                isSelected={isSelected}
                comparisonOperators={comparisonOperators}
              />
            )
          )}
        </svg>
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
