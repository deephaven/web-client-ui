import React from 'react';
import type GoldenLayout from '@deephaven/golden-layout';

export const LayoutManagerContext: React.Context<GoldenLayout | undefined> =
  React.createContext<GoldenLayout | undefined>(undefined);

export default LayoutManagerContext;
