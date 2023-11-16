import React from 'react';
import GoldenLayout from '@deephaven/golden-layout';

export const LayoutManagerContext: React.Context<GoldenLayout | undefined> =
  React.createContext<GoldenLayout | undefined>(undefined);

export default LayoutManagerContext;
