import React from 'react';
import { SocketedButton } from '@deephaven/components';

export default {
  title: 'Buttons/Socketed',
  component: SocketedButton,
};

// eslint-disable-next-line react/jsx-props-no-spreading
const Template = args => <SocketedButton {...args} />;

export const Unlinked = Template.bind({});

Unlinked.args = {
  children: 'Unlinked',
};

export const Linked = Template.bind({});

Linked.args = {
  children: 'Linked',
  isLinked: true,
};

export const LinkedSource = Template.bind({});

LinkedSource.args = {
  children: 'Linked Source',
  isLinkedSource: true,
};

export const Error = Template.bind({});

Error.args = {
  children: 'Error',
  isLinked: true,
  isInvalid: true,
};

export const Disabled = Template.bind({});

Disabled.args = {
  children: 'Disabled',
  disabled: true,
};

// class Buttons extends Component {
//   static renderButtonBrand(type, brand) {
//     const className = type.length ? `btn-${type}-${brand}` : `btn-${brand}`;
//     return (
//       <Button
//         key={brand}
//         className={className}
//         style={{ marginBottom: '1rem', marginRight: '1rem' }}
//       >
//         {brand}
//       </Button>
//     );
//   }

//   static renderButtons(type) {
//     const brands = ['primary', 'secondary', 'success', 'info', 'danger'].map(
//       brand => Buttons.renderButtonBrand(type, brand)
//     );

//     return (
//       <div key={type}>
//         <h5>{type.length ? 'Outline' : 'Regular'}</h5>
//         {brands}
//       </div>
//     );
//   }

//   static renderIconButton(icon, text) {
//     return (
//       <Button
//         className="btn-icon"
//         style={{
//           marginBottom: '1rem',
//           marginRight: '1rem',
//           fontSize: 'smaller',
//         }}
//       >
//         {icon}
//         {text}
//       </Button>
//     );
//   }

//   static renderIconButtons() {
//     return (
//       <div>
//         <h5>Icon Buttons</h5>
//         {Buttons.renderIconButton(<BarIcon />, 'Bar')}
//         {Buttons.renderIconButton(<LineIcon />, 'Line')}
//         {Buttons.renderIconButton(<ScatterIcon />, 'Scatter')}
//         {Buttons.renderIconButton(<PieIcon />, 'Pie')}
//         {Buttons.renderIconButton(<HistogramIcon />, 'Histogram')}
//       </div>
//     );
//   }

//   static renderSocketedButtons() {
//     return (
//       <div>
//         <h5>Socketed Buttons (for linker)</h5>
//         <SocketedButton style={{ marginBottom: '1rem', marginRight: '1rem' }}>
//           Unlinked
//         </SocketedButton>
//         <SocketedButton
//           style={{ marginBottom: '1rem', marginRight: '1rem' }}
//           isLinked
//         >
//           Linked
//         </SocketedButton>
//         <SocketedButton
//           style={{ marginBottom: '1rem', marginRight: '1rem' }}
//           isLinkedSource
//         >
//           Linked Source
//         </SocketedButton>
//         <SocketedButton
//           style={{ marginBottom: '1rem', marginRight: '1rem' }}
//           isLinked
//           isInvalid
//         >
//           Error
//         </SocketedButton>
//         <SocketedButton
//           style={{ marginBottom: '1rem', marginRight: '1rem' }}
//           disabled
//         >
//           Disabled
//         </SocketedButton>
//       </div>
//     );
//   }

//   constructor(props) {
//     super(props);

//     this.state = {
//       toggle: true,
//     };
//   }

//   renderInlineButtons() {
//     const { toggle } = this.state;

//     return (
//       <div style={{ padding: '1rem 0' }}>
//         <h5>Inline Buttons</h5>
//         Regular btn-inline:
//         <Button className="btn-inline mx-2">
//           <FontAwesomeIcon icon={dhTruck} />
//         </Button>
//         Toggle button (class active):
//         <Button
//           className={classNames('btn-inline mx-2', { active: toggle })}
//           onClick={() => {
//             this.setState({ toggle: !toggle });
//           }}
//         >
//           <FontAwesomeIcon icon={dhTruck} />
//         </Button>
//         Disabled:
//         <Button className="btn-inline mx-2" disabled>
//           <FontAwesomeIcon icon={dhTruck} />
//         </Button>
//         <br />
//         <br />
//         <span>btn-link-icon (no text):</span>
//         <Button className="btn-link btn-link-icon px-2">
//           {/* pad and margin horizontally as appropriate for icon shape and spacing,
//           needs btn-link and btn-link-icon classes. */}
//           <FontAwesomeIcon icon={dhTruck} />
//         </Button>
//         <span className="mx-2">btn-link:</span>
//         <Button className="btn-link">Text Button</Button>
//         <span className="mx-2">btn-link (text w/ optional with icon):</span>
//         <Button className="btn-link">
//           <FontAwesomeIcon icon={dhTruck} />
//           Add Item
//         </Button>
//       </div>
//     );
//   }

//   render() {
//     const buttons = ['', 'outline'].map(type => Buttons.renderButtons(type));
//     const iconButtons = Buttons.renderIconButtons();
//     const inlineButtons = this.renderInlineButtons();
//     const socketedButtons = Buttons.renderSocketedButtons();

//     return (
//       <div>
//         <h2 className="ui-title">Buttons</h2>
//         <div style={{ padding: '1rem 0' }}>
//           {buttons}
//           {iconButtons}
//           {inlineButtons}
//           {socketedButtons}
//         </div>
//       </div>
//     );
//   }
// }

// export default Buttons;
