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
      <rect x="24" y="10" width="4" height="4" fill="#78DCE8" />
      <rect x="24" y="16" width="9" height="4" fill="#78DCE8" />
      <rect x="24" y="22" width="14" height="4" fill="#78DCE8" />
      <rect x="24" y="28" width="9" height="4" fill="#78DCE8" />
      <rect x="24" y="34" width="16" height="4" fill="#78DCE8" />
      <rect x="24" y="40" width="19" height="4" fill="#78DCE8" />
      <rect x="24" y="4" width="19" height="4" fill="#78DCE8" />
    </svg>
  );
}

export default SvgBarIcon;
