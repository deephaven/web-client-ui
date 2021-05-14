import React, { Component } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonOld, SocketedButton } from '@deephaven/components';
import { dhTruck } from '@deephaven/icons';
// import {
//   BarIcon,
//   HistogramIcon,
//   LineIcon,
//   PieIcon,
//   ScatterIcon,
// } from '@deephaven/iris-grid/src/sidebar/icons';

class Buttons extends Component {
  static renderButtonBrand(type, brand) {
    const className = type.length ? `btn-${type}-${brand}` : `btn-${brand}`;
    return (
      <ButtonOld
        key={brand}
        className={className}
        style={{ marginBottom: '1rem', marginRight: '1rem' }}
      >
        {brand}
      </ButtonOld>
    );
  }

  static renderButtons(type) {
    const brands = [
      'primary',
      'secondary',
      'success',
      'info',
      'danger',
    ].map(brand => Buttons.renderButtonBrand(type, brand));

    return (
      <div key={type}>
        <h5>{type.length ? 'Outline' : 'Regular'}</h5>
        {brands}
      </div>
    );
  }

  static renderIconButton(icon, text) {
    return (
      <ButtonOld
        className="btn-icon"
        style={{
          marginBottom: '1rem',
          marginRight: '1rem',
          fontSize: 'smaller',
        }}
      >
        {icon}
        {text}
      </ButtonOld>
    );
  }

  // static renderIconButtons() {
  //   return (
  //     <div>
  //       <h5>Icon Buttons</h5>
  //       {Buttons.renderIconButton(<BarIcon />, 'Bar')}
  //       {Buttons.renderIconButton(<LineIcon />, 'Line')}
  //       {Buttons.renderIconButton(<ScatterIcon />, 'Scatter')}
  //       {Buttons.renderIconButton(<PieIcon />, 'Pie')}
  //       {Buttons.renderIconButton(<HistogramIcon />, 'Histogram')}
  //     </div>
  //   );
  // }

  static renderSocketedButtons() {
    return (
      <div>
        <h5>Socketed Buttons (for linker)</h5>
        <SocketedButton style={{ marginBottom: '1rem', marginRight: '1rem' }}>
          Unlinked
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinked
        >
          Linked
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinkedSource
        >
          Linked Source
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinked
          isInvalid
        >
          Error
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          disabled
        >
          Disabled
        </SocketedButton>
      </div>
    );
  }

  constructor(props) {
    super(props);

    this.state = {
      toggle: true,
    };
  }

  renderInlineButtons() {
    const { toggle } = this.state;

    return (
      <div style={{ padding: '1rem 0' }}>
        <h5>Inline Buttons</h5>
        Regular btn-inline:
        <ButtonOld className="btn-inline mx-2">
          <FontAwesomeIcon icon={dhTruck} />
        </ButtonOld>
        Toggle button (class active):
        <ButtonOld
          className={classNames('btn-inline mx-2', { active: toggle })}
          onClick={() => {
            this.setState({ toggle: !toggle });
          }}
        >
          <FontAwesomeIcon icon={dhTruck} />
        </ButtonOld>
        Disabled:
        <ButtonOld className="btn-inline mx-2" disabled>
          <FontAwesomeIcon icon={dhTruck} />
        </ButtonOld>
        <br />
        <br />
        <span>btn-link-icon (no text):</span>
        <ButtonOld className="btn-link btn-link-icon px-2">
          {/* pad and margin horizontally as appropriate for icon shape and spacing, 
          needs btn-link and btn-link-icon classes. */}
          <FontAwesomeIcon icon={dhTruck} />
        </ButtonOld>
        <span className="mx-2">btn-link:</span>
        <ButtonOld className="btn-link">Text Button</ButtonOld>
        <span className="mx-2">btn-link (text w/ optional with icon):</span>
        <ButtonOld className="btn-link">
          <FontAwesomeIcon icon={dhTruck} />
          Add Item
        </ButtonOld>
      </div>
    );
  }

  render() {
    const buttons = ['', 'outline'].map(type => Buttons.renderButtons(type));
    const iconButtons = Buttons.renderIconButtons();
    const inlineButtons = this.renderInlineButtons();
    const socketedButtons = Buttons.renderSocketedButtons();

    return (
      <div>
        <h2 className="ui-title">Buttons</h2>
        <div style={{ padding: '1rem 0' }}>
          {buttons}
          {iconButtons}
          {inlineButtons}
          {socketedButtons}
        </div>
      </div>
    );
  }
}

export default Buttons;
