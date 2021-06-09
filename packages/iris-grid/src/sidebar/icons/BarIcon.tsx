import * as React from 'react';

function SvgBarIcon(
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path fill="#C1C0C0" d="M44 43v1H4v-1z" />
        <path
          fill="#7DA4FF"
          d="M8 26h4v15H8zM15 17h4v24h-4zM22 21h4v20h-4zM29 17h4v24h-4zM36 11h4v30h-4z"
        />
      </g>
    </svg>
  );
}

export default SvgBarIcon;
