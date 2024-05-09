import React, { Component, ReactElement } from 'react';
import { Flex } from '@adobe/react-spectrum';
import { Button, ButtonOld, SocketedButton } from '@deephaven/components';
import { dhTruck } from '@deephaven/icons';
import SampleSection from './SampleSection';

function noOp(): void {
  return undefined;
}

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
      <SampleSection
        key={type}
        name={`buttons-${type.length ? 'outline' : 'regular'}`}
      >
        <h5>{type.length ? 'Outline' : 'Regular'}</h5>
        {brands}
      </SampleSection>
    );
  }

  static renderLinks(): ReactElement {
    const levelMap = {
      primary: 'accent',
      secondary: 'neutral',
      success: 'positive',
      info: 'info',
      warning: 'notice',
      danger: 'negative',
    };

    return (
      <SampleSection name="links" style={{ paddingTop: '1rem' }}>
        <h5>Links</h5>
        <Flex gap="1rem">
          {Object.entries(levelMap).map(([level, semantic]) => (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a key={level} className={`text-${level}`}>
              {level} ({semantic})
            </a>
          ))}
        </Flex>
      </SampleSection>
    );
  }

  static renderSocketedButtons(): ReactElement {
    return (
      <SampleSection name="buttons-socketed">
        <h5>Socketed Buttons (for linker)</h5>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          onClick={noOp}
        >
          Unlinked
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinked
          onClick={noOp}
        >
          Linked
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinkedSource
          onClick={noOp}
        >
          Linked Source
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          isLinked
          isInvalid
          onClick={noOp}
        >
          Error
        </SocketedButton>
        <SocketedButton
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          disabled
          onClick={noOp}
        >
          Disabled
        </SocketedButton>
      </SampleSection>
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
      <SampleSection name="buttons-inline" style={{ padding: '1rem 0' }}>
        <h5>Inline Buttons</h5>
        Regular btn-inline:
        <Button
          className="mx-2"
          kind="inline"
          icon={dhTruck}
          tooltip="test"
          onClick={noOp}
        />
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
        <Button className="mx-2" kind="inline" disabled onClick={noOp}>
          Disabled
        </Button>
        With Text:
        <Button className="mx-2" kind="inline" icon={dhTruck} onClick={noOp}>
          <span>Text Button</span>
        </Button>
        <br />
        <br />
        <span>btn-link-icon (no text):</span>
        <Button kind="ghost" icon={dhTruck} tooltip="test" onClick={noOp} />
        <span className="mx-2">btn-link:</span>
        <Button kind="ghost" onClick={noOp}>
          Text Button
        </Button>
        <span className="mx-2">btn-link (text w/ optional with icon):</span>
        <Button kind="ghost" icon={dhTruck} onClick={noOp}>
          Text Button
        </Button>
      </SampleSection>
    );
  }

  render(): React.ReactElement {
    const buttons = ['', 'outline'].map(type => Buttons.renderButtons(type));
    const inlineButtons = this.renderInlineButtons();
    const socketedButtons = Buttons.renderSocketedButtons();
    const links = Buttons.renderLinks();

    return (
      <div>
        <h2 className="ui-title">Buttons</h2>
        <div style={{ padding: '1rem 0' }}>
          {buttons}
          {inlineButtons}
          {socketedButtons}
          {links}
        </div>
      </div>
    );
  }
}

export default Buttons;
