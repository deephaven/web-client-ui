/* eslint-disable react/jsx-props-no-spreading */
import React, { Component, ReactElement } from 'react';
import { Button, ButtonOld, SocketedButton } from '@deephaven/components';
import { dhTruck } from '@deephaven/icons';
import { sampleSectionIdAndClasses } from './utils';

interface ButtonsState {
  toggle: boolean;
}
class Buttons extends Component<Record<string, never>, ButtonsState> {
  static renderButtonBrand(type: string, brand: string): ReactElement {
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

  static renderButtons(type: string): ReactElement {
    const brands = [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
      // Temporarily putting this at end of list for easier regression comparison.
      // Once the colors are finalized, this should semantically go between
      // success and warning
      'info',
    ].map((brand: string) => Buttons.renderButtonBrand(type, brand));

    return (
      <div
        key={type}
        {...sampleSectionIdAndClasses(
          `buttons-${type.length ? 'outline' : 'regular'}`
        )}
      >
        <h5>{type.length ? 'Outline' : 'Regular'}</h5>
        {brands}
      </div>
    );
  }

  static renderSocketedButtons(): ReactElement {
    return (
      <div {...sampleSectionIdAndClasses('buttons-socketed')}>
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

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      toggle: true,
    };
  }

  renderInlineButtons(): ReactElement {
    const { toggle } = this.state;

    return (
      <div
        {...sampleSectionIdAndClasses('buttons-inline')}
        style={{ padding: '1rem 0' }}
      >
        <h5>Inline Buttons</h5>
        Regular btn-inline:
        <Button className="mx-2" kind="inline" icon={dhTruck} tooltip="test" />
        Toggle button (class active):
        <Button
          className="mx-2"
          onClick={() => {
            this.setState({ toggle: !toggle });
          }}
          active={toggle}
          kind="inline"
          icon={dhTruck}
          tooltip="test"
        />
        Disabled:
        <Button className="mx-2" kind="inline" disabled>
          Disabled
        </Button>
        With Text:
        <Button className="mx-2" kind="inline" icon={dhTruck}>
          <span>Text Button</span>
        </Button>
        <br />
        <br />
        <span>btn-link-icon (no text):</span>
        <Button kind="ghost" icon={dhTruck} tooltip="test" />
        <span className="mx-2">btn-link:</span>
        <Button kind="ghost">Text Button </Button>
        <span className="mx-2">btn-link (text w/ optional with icon):</span>
        <Button kind="ghost" icon={dhTruck}>
          Text Button
        </Button>
      </div>
    );
  }

  render(): React.ReactElement {
    const buttons = ['', 'outline'].map(type => Buttons.renderButtons(type));
    const inlineButtons = this.renderInlineButtons();
    const socketedButtons = Buttons.renderSocketedButtons();

    return (
      <div>
        <h2 className="ui-title">Buttons</h2>
        <div style={{ padding: '1rem 0' }}>
          {buttons}
          {inlineButtons}
          {socketedButtons}
        </div>
      </div>
    );
  }
}

export default Buttons;
