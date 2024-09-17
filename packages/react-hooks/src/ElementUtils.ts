import {
  Component,
  FunctionComponent,
  isValidElement,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
} from 'react';

/**
 * Extracts the props type from a React component type.
 */
export type InferComponentProps<T> = T extends FunctionComponent<infer P>
  ? P
  : T extends Component<infer P>
  ? P
  : never;

/**
 * Check if a node is a React element of a specific type.
 * @param node The node to check
 * @param type The type to check against
 * @returns True if the node is a React element of the specified type
 */
export function isElementOfType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends string | JSXElementConstructor<any> =
    | string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | JSXElementConstructor<any>,
>(node: ReactNode, type: T): node is ReactElement<InferComponentProps<T>, T> {
  return isValidElement(node) && node.type === type;
}

export default isElementOfType;
