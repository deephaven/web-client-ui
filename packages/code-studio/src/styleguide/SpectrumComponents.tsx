/* eslint-disable react/style-prop-object */
import React, { useMemo } from 'react';
import {
  ActionButton,
  Button,
  Cell,
  Column,
  ComboBox,
  Grid,
  Item,
  repeat,
  Row,
  TableBody,
  TableHeader,
  TableView,
  Well,
} from '@adobe/react-spectrum';

export function SpectrumComponents(): JSX.Element {
  const samples = useMemo(
    () => [
      {
        title: 'Buttons',
        content: (
          <Grid autoFlow="column" columnGap={10} rows={repeat(6, 'size-500')}>
            <label>Outline Style</label>
            <Button variant="primary" style="outline">
              Primary
            </Button>
            <Button variant="secondary" style="outline">
              Secondary
            </Button>
            <Button variant="accent" style="outline">
              Accent
            </Button>
            <Button variant="negative" style="outline">
              Negative
            </Button>
            <Button variant="primary" isDisabled style="outline">
              Disabled
            </Button>

            <label>Fill Style</label>
            <Button variant="primary" style="fill">
              Primary
            </Button>
            <Button variant="secondary" style="fill">
              Secondary
            </Button>
            <Button variant="accent" style="fill">
              Accent
            </Button>
            <Button variant="negative" style="fill">
              Negative
            </Button>
            <Button variant="primary" isDisabled style="fill">
              Disabled
            </Button>

            <label>Action Button</label>
            <ActionButton>Normal</ActionButton>
            <ActionButton isQuiet>Quiet</ActionButton>
            <ActionButton isDisabled>Disabled</ActionButton>
          </Grid>
        ),
      },
      {
        title: 'Combobox',
        content: (
          <ComboBox menuTrigger="focus">
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </ComboBox>
        ),
      },
      {
        title: 'Table View',
        content: (
          <TableView selectionMode="multiple">
            <TableHeader>
              <Column title="Person">
                <Column allowsResizing>Name</Column>
                <Column>Age</Column>
              </Column>
              <Column title="Address">
                <Column allowsResizing>City</Column>
                <Column>State</Column>
              </Column>
            </TableHeader>
            <TableBody>
              <Row>
                <Cell>John</Cell>
                <Cell>42</Cell>
                <Cell>San Francisco</Cell>
                <Cell>CA</Cell>
              </Row>
              <Row>
                <Cell>Jane</Cell>
                <Cell>38</Cell>
                <Cell>San Francisco</Cell>
                <Cell>CA</Cell>
              </Row>
              <Row>
                <Cell>Becky</Cell>
                <Cell>12</Cell>
                <Cell>San Francisco</Cell>
                <Cell>CA</Cell>
              </Row>
            </TableBody>
          </TableView>
        ),
      },
      { title: 'Wells', content: <Well>This is a well.</Well> },
    ],
    []
  );

  return (
    <>
      <h2 className="ui-title">Spectrum Components</h2>
      <Grid gap={20} columns={repeat('auto-fit', 'size-4600')}>
        {samples.map(({ title, content }) => (
          <div key={title}>
            <h3>{title}</h3>
            <div>{content}</div>
          </div>
        ))}
      </Grid>
    </>
  );
}

export default SpectrumComponents;
