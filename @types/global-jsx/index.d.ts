// react-markdown 8 still references the global JSX namespace, which @types/react 19 removed
import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}
