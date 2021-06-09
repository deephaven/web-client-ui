import * as React from 'react';

function SvgLineIcon(
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path fill="#C1C0C0" d="M4 4h1v40H4zM44 43v1H5v-1z" />
        <path
          stroke="#7DA4FF"
          d="M7.984 32.44l7.982-11.378 5.273 3.739 9.952-10.838 2.826 1.894 7.45-5.802"
        />
        <path
          stroke="#BECDEF"
          d="M8.244 37.926L17 33.496l5 .87 10.637-10.35 10.615-1.381"
        />
      </g>
    </svg>
  );
}

export default SvgLineIcon;
