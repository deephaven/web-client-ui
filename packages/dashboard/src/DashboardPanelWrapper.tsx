import React, { PropsWithChildren } from 'react';

export function DashboardPanelWrapper({
  children,
}: PropsWithChildren<object>): JSX.Element {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default DashboardPanelWrapper;
