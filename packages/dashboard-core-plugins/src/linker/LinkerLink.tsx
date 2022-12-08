import React, { Component, MouseEvent } from 'react';
import { Button, DropdownAction, DropdownMenu } from '@deephaven/components';
import { vsTrash, vsTriangleDown } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
  getLabelForNumberFilter,
  getLabelForTextFilter,
  getLabelForDateFilter,
} from '@deephaven/filters';
import Log from '@deephaven/log';
import { TableUtils } from '@deephaven/jsapi-utils';
import memoize from 'memoize-one';

import './LinkerLink.scss';
import classNames from 'classnames';

const log = Log.module('LinkerLink');

/** The constant for how droopy the links are. Increase for more droopiness. */
const DROOP = 0.015;
const DROOP_EXPONENT = 1.5;
const TRIANGLE_HEIGHT = 12;
const TRIANGLE_BASE = 12;
const TRIANGLE_TIP = 2;
const TRIANGLE_HYPOTENUSE = Math.sqrt(
  (TRIANGLE_BASE * 0.5) ** 2 + TRIANGLE_HEIGHT ** 2
);
const TRIANGLE_THETA = Math.asin((TRIANGLE_BASE * 0.5) / TRIANGLE_HEIGHT);
const CLIP_RADIUS = 15;
const HALF_PI = Math.PI * 0.5;

export type LinkerLinkProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: string;
  className: string;
  operator: FilterTypeValue;
  isSelected: boolean;
  startColumnType: string | null;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onOperatorChanged: (id: string, type: FilterTypeValue) => void;
};

export type LinkerLinkState = {
  isHovering?: boolean;
};

export class LinkerLink extends Component<LinkerLinkProps, LinkerLinkState> {
  static defaultProps = {
    className: '',
    isSelected: false,
    onClick(): void {
      // no-op
    },
    onDelete(): void {
      // no-op
    },
  };

  /**
   * Make an SVG path for a circle at the specified coordinates.
   * @param x The x coordinate for the centre of the circle
   * @param y The y coordinate for the centre of the circle
   * @param r Radius of the circle
   * @returns The SVG string path
   */
  static makeCirclePath(x: number, y: number, r: number): string {
    return `M ${x} ${y} m -${r},0 a ${r},${r} 0 1,0 ${
      r * 2
    },0 a ${r},${r} 0 1,0 -${r * 2},0 z`;
  }

  static getLabelForLinkFilter(
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
        if (filterType === FilterType.eq) {
          return 'is equal to';
        }
        if (filterType === FilterType.notEq) {
          return 'is not equal to';
        }
      }
      throw new Error(`Unrecognized column type: ${columnType}`);
    } catch (e) {
      log.warn(e);
      return '';
    }
  }

  constructor(props: LinkerLinkProps) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.getDropdownActions = this.getDropdownActions.bind(this);

    this.state = {
      isHovering: undefined,
    };
  }

  getOperators = memoize(
    (linkId: string, columnType: string): DropdownAction[] => {
      const { onOperatorChanged } = this.props;
      let filterTypes = TableUtils.getFilterTypes(columnType);
      if (TableUtils.isBooleanType(columnType)) {
        filterTypes = [FilterType.eq, FilterType.notEq];
      }
      return filterTypes.flatMap((type, index) => {
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
            title: LinkerLink.getLabelForLinkFilter(columnType, type),
            icon: <b>{symbol}</b>,
            action: () => onOperatorChanged(linkId, type),
            order: index,
          },
        ];
      });
    }
  );

  handleClick(event: MouseEvent<SVGPathElement>): void {
    event.stopPropagation();
    event.preventDefault();

    const { id, onClick, onDelete } = this.props;
    if (event.altKey) {
      onDelete(id);
    } else {
      onClick(id);
    }
  }

  handleMouseEnter(): void {
    this.setState({
      isHovering: true,
    });
  }

  handleMouseLeave(): void {
    this.setState({
      isHovering: false,
    });
  }

  handleDelete(): void {
    const { id, onDelete } = this.props;
    onDelete(id);
  }

  getDropdownActions(): DropdownAction[] {
    const { id, startColumnType } = this.props;
    if (startColumnType != null) {
      return this.getOperators(id, startColumnType);
    }
    return [];
  }

  render(): JSX.Element {
    const {
      className,
      operator,
      isSelected,
      x1,
      y1,
      x2,
      y2,
      id,
      startColumnType,
    } = this.props;
    const { isHovering } = this.state;

    // Path between the two points
    const len = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const theta = Math.atan2(y2 - y1, x2 - x1);
    const xMult = Math.sin(theta);
    const yMult = Math.cos(theta) + 2;
    const maxX = window.innerWidth;
    const maxY = window.innerHeight;
    const minX = 0;
    const minY = 0;
    const qx = Math.max(
      minX,
      Math.min(
        x1 + (x2 - x1) / 2 + xMult * (len * DROOP) ** DROOP_EXPONENT,
        maxX
      )
    );
    const qy = Math.max(
      minY,
      Math.min(
        y1 + (y2 - y1) / 2 + yMult * (len * DROOP) ** DROOP_EXPONENT,
        maxY
      )
    );
    const path = `M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`;

    // path for a 100%, 100% rect, then two paths for circles at point
    const selectClipPath = `M ${minX} ${minY} L ${minX} ${maxY} L ${maxX} ${maxY} L ${maxX} ${minY} z
    ${LinkerLink.makeCirclePath(x1, y1, CLIP_RADIUS)}
    ${LinkerLink.makeCirclePath(x2, y2, CLIP_RADIUS)}`;
    const clipPathId = `link-select-clip-${id}`;

    // Calculate location of the end triangle
    // We draw it instead of using markers to allow for transitions in the style
    const endTheta = Math.atan2(y2 - qy, x2 - qx);
    const t2theta = endTheta - TRIANGLE_THETA + Math.PI;
    const t3theta = endTheta + TRIANGLE_THETA + Math.PI;
    const tx1 = x2 + Math.cos(endTheta) * TRIANGLE_TIP;
    const ty1 = y2 + Math.sin(endTheta) * TRIANGLE_TIP;
    const tx2 = tx1 + Math.cos(t2theta) * TRIANGLE_HYPOTENUSE;
    const ty2 = ty1 + Math.sin(t2theta) * TRIANGLE_HYPOTENUSE;
    const tx3 = tx1 + Math.cos(t3theta) * TRIANGLE_HYPOTENUSE;
    const ty3 = ty1 + Math.sin(t3theta) * TRIANGLE_HYPOTENUSE;
    const points = `${tx1},${ty1} ${tx2},${ty2} ${tx3},${ty3}`;

    // Button offset calculations
    const midX = 0.25 * x1 + 0.5 * qx + 0.25 * x2;
    const midY = 0.25 * y1 + 0.5 * qy + 0.25 * y2;
    const dMidX = qx - x1 + (x2 - qx);
    const dMidY = qy - y1 + (y2 - qy);
    const slopeAtMid = dMidY / dMidX;
    const DISTANCE_FROM_MID = 20;
    let dropdownOffsetX = DISTANCE_FROM_MID / Math.sqrt(1 + slopeAtMid ** 2);
    let dropdownOffsetY = dropdownOffsetX * slopeAtMid;
    let deleteOffsetX = dropdownOffsetX * -1;
    let deleteOffsetY = dropdownOffsetY * -1;
    if (!Number.isFinite(slopeAtMid)) {
      deleteOffsetX = 10;
      deleteOffsetY = 5;
      dropdownOffsetX = 10;
      dropdownOffsetY = -35;
    } else if (slopeAtMid > 0) {
      dropdownOffsetX *= -1;
      dropdownOffsetY *= -1;
      deleteOffsetX *= -1;
      deleteOffsetY *= -1;
      deleteOffsetX -= 50 - 10 * (Math.abs(theta) % HALF_PI);
      deleteOffsetY += 10 * (Math.abs(theta) % HALF_PI);
      dropdownOffsetX -= 50 - 10 * (Math.abs(theta) % HALF_PI);
      dropdownOffsetY += 10 * (Math.abs(theta) % HALF_PI);
    } else if (slopeAtMid < 0) {
      deleteOffsetX += 10 * (Math.abs(theta) % HALF_PI);
      deleteOffsetY += 10 * (Math.abs(theta) % HALF_PI);
      dropdownOffsetX += 10 * (Math.abs(theta) % HALF_PI);
      dropdownOffsetY += 10 * (Math.abs(theta) % HALF_PI);
    } else {
      deleteOffsetX = 15;
      deleteOffsetY = 10;
      dropdownOffsetX = -25;
      dropdownOffsetY = 10;
    }

    let symbol = '';
    if (operator !== undefined) {
      if (operator === 'startsWith') {
        symbol = 'a*';
      } else if (operator === 'endsWith') {
        symbol = '*z';
      } else {
        symbol = TableUtils.getFilterOperatorString(operator);
      }
    }

    return (
      <>
        <svg
          className={classNames(className, {
            hovering: isHovering,
          })}
        >
          <clipPath id={clipPathId}>
            <path d={selectClipPath} clipRule="evenodd" />
          </clipPath>
          <path
            className="link-select"
            d={path}
            onClick={this.handleClick}
            clipPath={`url(#${clipPathId})`}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
          />
          <path className="link-background" d={path} />
          <path className="link-foreground" d={path} />
          <circle className="link-dot" cx={x1} cy={y1} r="5" />
          <polygon className="link-triangle" points={points} />
        </svg>
        {startColumnType != null && isSelected && (
          <>
            <Button
              kind="primary"
              className="btn-fab btn-operator"
              style={{
                top: midY + dropdownOffsetY,
                left: midX + dropdownOffsetX,
              }}
              onClick={() => {
                // no-op: click is handled in `DropdownMenu'
              }}
              icon={
                <div className="fa-md fa-layers">
                  <b>{symbol}</b>
                  <FontAwesomeIcon
                    icon={vsTriangleDown}
                    transform="right-8 down-10 shrink-6"
                  />
                </div>
              }
              tooltip="Change comparison operator"
            >
              <DropdownMenu
                actions={this.getDropdownActions}
                popperOptions={{ placement: 'bottom-start' }}
              />
            </Button>

            <Button
              kind="primary"
              className="btn-fab btn-delete"
              style={{ top: midY + deleteOffsetY, left: midX + deleteOffsetX }}
              onClick={this.handleDelete}
              icon={<FontAwesomeIcon icon={vsTrash} transform=" down-1" />}
              tooltip="Delete"
            />
          </>
        )}
      </>
    );
  }
}

export default LinkerLink;
