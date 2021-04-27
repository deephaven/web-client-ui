import React from 'react';
import {
  Grid as GridComponent,
  MockGridModel,
  MockTreeGridModel,
} from '@deephaven/grid';
import { IrisGrid as IrisGridComponent } from '../iris-grid';
import MockIrisGridTreeModel from './MockIrisGridTreeModel';

const irisGridModel = new MockIrisGridTreeModel(new MockTreeGridModel());
const model = new MockGridModel();
const theme = { rowFooterWidth: 30 };
const treeModel = new MockTreeGridModel();
const treeTheme = { allowRowReorder: false, autoSelectRow: true };

export default {
  title: 'Grids',
};

const GridTemplate = args => (
  <div style={{ height: 500 }}>
    <GridComponent model={args.model} theme={args.theme} />
  </div>
);

export const Grid = GridTemplate.bind({});
Grid.args = {
  model,
  theme,
};

export const TreeGrid = GridTemplate.bind({});
TreeGrid.args = {
  model: treeModel,
  theme: treeTheme,
};

const IrisGridTemplate = args => (
  <div style={{ height: 500 }}>
    <IrisGridComponent model={args.model} />
  </div>
);

export const IrisGrid = IrisGridTemplate.bind({});
IrisGrid.args = {
  model: irisGridModel,
};
