/* eslint-disable react/jsx-props-no-spreading */
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
  DialogTrigger,
  Dialog,
  Header,
  Divider,
  ButtonGroup,
  Flex,
  ListView,
} from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhTruck, vsEmptyWindow } from '@deephaven/icons';
import { SPECTRUM_COMPONENT_SAMPLES_ID } from './constants';
import { sampleSectionIdAndClassesSpectrum } from './utils';

export function SpectrumComponents(): JSX.Element {
  return (
    <div id={SPECTRUM_COMPONENT_SAMPLES_ID}>
      <h2 className="ui-title" data-no-menu>
        Spectrum Components
      </h2>
      <Grid gap={20} columns={minmax('0px', '1fr')}>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-buttons')}>
          <h3>Buttons</h3>
          <ButtonsSample />
        </View>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-collections')}>
          <h3>Collections</h3>
          <TableViewSample />
        </View>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-content')}>
          <h3>Content</h3>
          <IllustratedMessageSample />
        </View>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-forms')}>
          <h3>Forms</h3>
          <FormsSample />
        </View>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-overlays')}>
          <h3>Overlays</h3>
          <Flex gap="size-160">
            <ContextualHelpSample />
            <DialogTrigger>
              <ActionButton>Dialog Trigger</ActionButton>
              {close => (
                <Dialog>
                  <Heading>Some Heading</Heading>
                  <Header>Some Header</Header>
                  <Divider />
                  <Content>
                    <Text>Are you sure?</Text>
                  </Content>
                  <ButtonGroup>
                    <Button variant="secondary" onPress={close}>
                      Cancel
                    </Button>
                    <Button variant="accent" onPress={close}>
                      Confirm
                    </Button>
                  </ButtonGroup>
                </Dialog>
              )}
            </DialogTrigger>
          </Flex>
        </View>
        <View {...sampleSectionIdAndClassesSpectrum('spectrum-well')}>
          <h3>Wells</h3>
          <Well>This is a well.</Well>
        </View>
      </Grid>
    </div>
  );
}

export default SpectrumComponents;

function ButtonsSample(): JSX.Element {
  return (
    <>
      <ActionButton marginBottom="size-200">
        <Icon>
          <FontAwesomeIcon icon={dhTruck} />
        </Icon>
        <Text>Icon Button</Text>
      </ActionButton>
      <Grid
        autoFlow="column"
        columnGap="size-250"
        rowGap="size-150"
        columns={repeat(4, minmax(0, 'size-2000'))}
        rows={repeat(8, 'size-400')}
      >
        <label>Button style=&quot;outline&quot;</label>
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
        <Button variant="primary" staticColor="black" style="outline">
          Static Black
        </Button>
        <Button variant="primary" staticColor="white" style="outline">
          Static White
        </Button>
        <Button variant="primary" isDisabled style="outline">
          Disabled
        </Button>

        <label>Button style=&quot;fill&quot;</label>
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
        <Button variant="primary" staticColor="black" style="fill">
          Static Black
        </Button>
        <Button variant="primary" staticColor="white" style="fill">
          Static White
        </Button>
        <Button variant="primary" isDisabled style="fill">
          Disabled
        </Button>

        <label>Action Button</label>
        <ActionButton>Normal</ActionButton>
        <ActionButton gridRow="span 3" isQuiet>
          Quiet
        </ActionButton>
        <ActionButton staticColor="black">Static Black</ActionButton>
        <ActionButton staticColor="white">Static White</ActionButton>
        <ActionButton isDisabled>Disabled</ActionButton>

        <label>Toggle Button</label>
        <ToggleButton>Normal</ToggleButton>
        <ToggleButton isQuiet>Quiet</ToggleButton>
        <ToggleButton gridRow="span 2" isEmphasized>
          Emphasized
        </ToggleButton>
        <ToggleButton staticColor="black">Static Black</ToggleButton>
        <ToggleButton staticColor="white">Static White</ToggleButton>
        <ToggleButton isDisabled>Disabled</ToggleButton>
      </Grid>
    </>
  );
}

function ContextualHelpSample(): JSX.Element {
  return (
    <>
      <Text>Contextual Help</Text>
      <ContextualHelp variant="info">
        <Heading>Need help?</Heading>
        <Content>
          <Text>
            This is a helpful description of the thing you need help with.
          </Text>
        </Content>
      </ContextualHelp>
    </>
  );
}

function FormsSample(): JSX.Element {
  return (
    <Form>
      <Grid gap={20} columns={repeat('auto-fit', '210px')} alignItems="end">
        <TextField label="Text Field" />
        <ComboBox label="Combobox" menuTrigger="focus" defaultSelectedKey="two">
          <Item key="one">One</Item>
          <Item key="two">Two</Item>
          <Item key="three">Three</Item>
        </ComboBox>
        <Checkbox>Checkbox</Checkbox>
        <Slider label="Slider" defaultValue={24} />
        <Switch>Switch</Switch>
      </Grid>
    </Form>
  );
}

function IllustratedMessageSample(): JSX.Element {
  return (
    <IllustratedMessage>
      <Icon size="XL">
        <FontAwesomeIcon icon={vsEmptyWindow} />
      </Icon>
      <Heading>Illustrated Message</Heading>
      <Content>This is the content of the message.</Content>
    </IllustratedMessage>
  );
}

function TableViewSample(): JSX.Element {
  return (
    <>
      <label id="table-view-sample">List View</label>
      <ListView
        aria-labelledby="table-view-sample"
        selectionMode="multiple"
        maxWidth="size-6000"
        marginBottom="size-200"
      >
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
        <Item>Four</Item>
      </ListView>

      <label id="table-view-sample">Table View</label>
      <TableView aria-labelledby="table-view-sample" selectionMode="multiple">
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
    </>
  );
}
