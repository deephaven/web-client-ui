import * as React from 'react';

function SvgHistogramIcon(
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path fill="#C1C0C0" d="M44 43v1H4v-1z" />
        <path
          fill="#7DA4FF"
          d="M7 34h4v8H7zM12 31h4v11h-4zM17 27h4v15h-4zM22 22h4v20h-4zM27 27h4v15h-4zM32 29h4v13h-4zM37 31h4v11h-4z"
        />
      </g>
    </svg>
  );
}

export default SvgHistogramIcon;
