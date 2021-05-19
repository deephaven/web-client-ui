import * as React from 'react';

function SvgScatterIcon(props) {
  return (
    <svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path fill="#C1C0C0" d="M44 43v1H4v-1z" />
        <path fill="#939293" d="M44 34v1H4v-1zM44 25v1H4v-1zM44 16v1H4v-1z" />
        <circle fill="#7DA4FF" cx={9.5} cy={37.5} r={1.5} />
        <circle fill="#7DA4FF" cx={16.5} cy={30.5} r={1.5} />
        <circle fill="#7DA4FF" cx={22.5} cy={36.5} r={1.5} />
        <circle fill="#7DA4FF" cx={28.5} cy={30.5} r={1.5} />
        <circle fill="#7DA4FF" cx={15.5} cy={38.5} r={1.5} />
        <circle fill="#7DA4FF" cx={23.5} cy={25.5} r={1.5} />
        <circle fill="#7DA4FF" cx={19.5} cy={19.5} r={1.5} />
        <circle fill="#7DA4FF" cx={29.5} cy={19.5} r={1.5} />
        <circle fill="#7DA4FF" cx={32.5} cy={26.5} r={1.5} />
        <circle fill="#7DA4FF" cx={36.5} cy={13.5} r={1.5} />
      </g>
    </svg>
  );
}

export default SvgScatterIcon;
