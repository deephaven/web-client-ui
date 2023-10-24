import { createContext } from 'react';
import type { IdeConnection } from '@deephaven/jsapi-types';

export const ConnectionContext = createContext<IdeConnection | null>(null);

export default ConnectionContext;
