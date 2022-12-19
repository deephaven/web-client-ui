import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePrevious } from '@deephaven/react-hooks';
import IrisGridBottomBar from './IrisGridBottomBar';
import './PendingDataBottomBar.scss';

const HIDE_TIMEOUT = 3000;

export type ToastBottomBarProps = {
  children?: React.ReactNode;
  onEntering?: () => void;
  onEntered?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
};

export function ToastBottomBar({
  children = null,
  onEntering,
  onEntered,
  onExiting,
  onExited,
}: ToastBottomBarProps): JSX.Element {
  const [isShown, setIsShown] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const prevChildren = usePrevious(children);

  const startTimer = useCallback(() => {
    setIsShown(true);
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      setIsShown(false);
    }, HIDE_TIMEOUT);
  }, [setIsShown, timeout]);

  useEffect(() => {
    if (prevChildren !== children && children != null) {
      startTimer();
    }
  }, [children, prevChildren, setIsShown, startTimer]);

  useEffect(
    () => () => (timeout.current ? clearTimeout(timeout.current) : undefined),
    []
  );

  return (
    <IrisGridBottomBar
      className="toast-bottom-bar"
      isShown={isShown}
      onEntering={onEntering}
      onEntered={onEntered}
      onExiting={onExiting}
      onExited={onExited}
    >
      {children}
    </IrisGridBottomBar>
  );
}

export default ToastBottomBar;
