import {
  isValidElement,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
} from 'react';
import { InferComponentProps } from '@deephaven/utils';

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
