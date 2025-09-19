/* eslint-disable */
export * from '../../node_modules/@types/react-transition-group';

// Require nodeRef in CSSTransition to support React 19 (no findDOMNode)
import { Component } from 'react';
import { CSSTransitionProps } from '../../node_modules/@types/react-transition-group/CSSTransition';
declare class CSSTransition<Ref extends HTMLElement> extends Component<
  CSSTransitionProps<Ref> & { nodeRef: React.Ref<Ref> }
> {}
export { CSSTransition };
