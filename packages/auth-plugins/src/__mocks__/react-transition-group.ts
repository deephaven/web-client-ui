import type { ReactNode } from 'react';

interface TransitionProps {
  children: ReactNode;
  in: boolean;
}

export function Transition({
  children,
  in: inProp,
}: TransitionProps): ReactNode | null {
  return inProp ? children : null;
}

export function CSSTransition({
  children,
  in: inProp,
}: TransitionProps): ReactNode | null {
  return inProp ? children : null;
}

export function TransitionGroup({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}

export default {
  CSSTransition,
  Transition,
  TransitionGroup,
};
