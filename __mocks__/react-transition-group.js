/* eslint-disable react/prop-types */
export function Transition({ children, in: inProp }) {
  return inProp ? children : null;
}

export function CSSTransition({ children, in: inProp }) {
  return inProp ? children : null;
}

export function TransitionGroup({ children }) {
  return children;
}

export default {
  Transition,
  CSSTransition,
};
