import React, { PropsWithChildren } from 'react';

export function DashboardPanelWrapper({ children }: PropsWithChildren<object>) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default DashboardPanelWrapper;
