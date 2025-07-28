import { createContext } from 'react';
import type { dh } from '@deephaven/jsapi-types';

export const ConnectionContext = createContext<dh.IdeConnection | null>(null);
ConnectionContext.displayName = 'ConnectionContext';

export default ConnectionContext;
