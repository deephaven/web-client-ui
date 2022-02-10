import * as React from 'react';

function FormatColumnWhereIcon(
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
): JSX.Element {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <rect width="48" height="48" fill="none" />
      <rect x="26" y="10" width="15" height="4" fill="#9FDE70" />
      <rect x="26" y="22" width="15" height="4" fill="#9FDE70" />
      <rect x="26" y="28" width="15" height="4" fill="#FFD95C" />
      <rect x="26" y="34" width="15" height="4" fill="#9FDE70" />
    </svg>
  );
}

export default SvgBarIcon;
