import * as React from 'react';

function SvgBarIcon(
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
      <rect x="4" y="16" width="40" height="4" fill="#FFD95C" />
      <rect x="4" y="10" width="40" height="4" fill="#78DCE8" />
      <rect x="4" y="34" width="40" height="4" fill="#78DCE8" />
    </svg>
  );
}

export default SvgBarIcon;
