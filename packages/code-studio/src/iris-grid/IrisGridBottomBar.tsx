import React from 'react';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { ThemeExport } from '@deephaven/components';
import './IrisGridBottomBar.scss';

export type IrisGridBottomBarProps = {
  animation?: string;
  children: React.ReactNode;
  onClick?: () => void;
  onEntering?: () => void;
  onEntered?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
  isShown: boolean;
  className?: string;
};

export const IrisGridBottomBar = ({
  animation = 'iris-grid-bottom-bar-slide-up',
  children,
  className,
  isShown,
  onClick,
  onEntering,
  onEntered,
  onExiting,
  onExited,
}: IrisGridBottomBarProps): JSX.Element => (
  <CSSTransition
    in={isShown}
    timeout={ThemeExport.transitionMs}
    classNames={animation}
    onEntering={onEntering}
    onEntered={onEntered}
    onExiting={onExiting}
    onExited={onExited}
    mountOnEnter
    unmountOnExit
  >
    <div
      className={classNames('iris-grid-bottom-bar', className)}
      role="presentation"
      onClick={onClick}
      onKeyPress={onClick}
    >
      {children}
    </div>
  </CSSTransition>
);

export default IrisGridBottomBar;
