import * as React from 'react';

function SvgPieIcon(props) {
  return (
    <svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path
          d="M24 10c7.732 0 14 6.268 14 14s-6.268 14-14 14-14-6.268-14-14h14V10z"
          fill="#80A6FF"
        />
        <path d="M10 24c0-7.732 6.268-14 14-14v14H10z" fill="#C1C0C0" />
      </g>
    </svg>
  );
}

export default SvgPieIcon;
