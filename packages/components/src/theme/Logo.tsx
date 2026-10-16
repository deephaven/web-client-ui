import classNames from 'classnames';
import './Logo.css';

import type { JSX } from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ className, style }: LogoProps): JSX.Element {
  return <div className={classNames('dh-logo', className)} style={style} />;
}

export default Logo;
