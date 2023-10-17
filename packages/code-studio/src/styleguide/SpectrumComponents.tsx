/* eslint-disable react/style-prop-object */
import React from 'react';
import {
  ActionButton,
  Button,
  Cell,
  Checkbox,
  Content,
  ContextualHelp,
  Column,
  ComboBox,
  Form,
  Heading,
  Grid,
  Icon,
  IllustratedMessage,
  Item,
  minmax,
  repeat,
  Row,
  Slider,
  Switch,
  TableBody,
  TableHeader,
  TableView,
  Text,
  TextField,
  ToggleButton,
  View,
  Well,
} from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsEmptyWindow, vsStarFull } from '@deephaven/icons';

export function SpectrumComponents(): JSX.Element {
  return (
    <>
      <h2 className="ui-title">Spectrum Components</h2>
      <Grid gap={20} columns={minmax('0px', '1fr')}>
        <View>
          <h3>Buttons</h3>
          <ButtonsSample />
        </View>
        <View>
          <h3>Forms</h3>
          <FormsSample />
        </View>
        <View>
          <h3>Icons</h3>
          <IconSample />
        </View>
        <View>
          <h3>Illustrated Message</h3>
          <IllustratedMessageSample />
        </View>
        <View>
          <h3>Contextual Help</h3>
          <ContextualHelpSample />
        </View>
        <View>
          <h3>Table View</h3>
          <TableViewSample />
        </View>
        <View>
          <h3>Wells</h3>
          <Well>This is a well.</Well>
        </View>
      </Grid>
    </>
  );
}

export default SpectrumComponents;

function ButtonsSample(): JSX.Element {
  return (
    <Grid
      autoFlow="column"
      columnGap={14}
      columns={repeat(3, 'size-1600')}
      rows={repeat(6, 'size-500')}
    >
      <label>style=&quot;outline&quot;</label>
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

      <label>style=&quot;fill&quot;</label>
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
  );
}

function ContextualHelpSample(): JSX.Element {
  return (
    <ContextualHelp variant="info">
      <Heading>Need help?</Heading>
      <Content>
        <Text>
          This is a helpful description of the thing you need help with.
        </Text>
      </Content>
    </ContextualHelp>
  );
}

function FormsSample(): JSX.Element {
  return (
    <Form>
      <Grid gap={20} columns={repeat('auto-fit', '210px')}>
        <TextField label="Text Field" />
        <ComboBox label="Combobox" menuTrigger="focus" defaultSelectedKey="two">
          <Item key="one">One</Item>
          <Item key="two">Two</Item>
          <Item key="three">Three</Item>
        </ComboBox>
        <Checkbox>Checkbox</Checkbox>
      </Grid>
    </Form>
  );
}

function IconSample(): JSX.Element {
  return (
    <Icon>
      <FontAwesomeIcon icon={vsStarFull} />
    </Icon>
  );
}

function IllustratedMessageSample(): JSX.Element {
  return (
    <IllustratedMessage>
      <Icon size="XL">
        <FontAwesomeIcon icon={vsEmptyWindow} />
      </Icon>
      <Heading>No results</Heading>
      <Content>Try another search</Content>
    </IllustratedMessage>
  );
}

function TableViewSample(): JSX.Element {
  return (
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
  );
}
