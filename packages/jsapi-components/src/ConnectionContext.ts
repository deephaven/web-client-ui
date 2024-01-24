import { createContext } from 'react';
import type { dh.IdeConnection } from '@deephaven/jsapi-types';

export const ConnectionContext = createContext<dh.IdeConnection | null>(null);

export default ConnectionContext;
