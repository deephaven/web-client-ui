import React, { MouseEvent, PureComponent } from 'react';

import './LinkerLink.scss';

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

export type LinkerLinkProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: string;
  className: string;
  onClick: (id: string, deleteLink: boolean) => void;
};

export class LinkerLink extends PureComponent<LinkerLinkProps> {
  static defaultProps = {
    className: '',
    onClick(): void {
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

  constructor(props: LinkerLinkProps) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event: MouseEvent<SVGPathElement>): void {
    event.stopPropagation();
    event.preventDefault();

    const { id, onClick } = this.props;
    onClick(id, event.altKey);
  }

  render(): JSX.Element {
    const { className, x1, y1, x2, y2, id } = this.props;

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

    return (
      <svg className={className}>
        <clipPath id={clipPathId}>
          <path d={selectClipPath} clipRule="evenodd" />
        </clipPath>
        <path
          className="link-select"
          d={path}
          onClick={this.handleClick}
          clipPath={`url(#${clipPathId})`}
        />
        <path className="link-background" d={path} />
        <path className="link-foreground" d={path} />
        <circle className="link-dot" cx={x1} cy={y1} r="5" />
        <polygon className="link-triangle" points={points} />
      </svg>
    );
  }
}

export default LinkerLink;
