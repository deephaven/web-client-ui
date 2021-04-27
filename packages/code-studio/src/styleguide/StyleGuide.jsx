import React from 'react';
import { ContextMenuRoot } from '@deephaven/components';

import Alerts from './Alerts';
import Buttons from './Buttons';
import Charts from './Charts';
import Colors from './Colors';
import ContextMenus from './ContextMenus';
import Dialog from './Dialog';
import DropdownMenus from './DropdownMenus';
import Editors from './Editors';
import Grids from './Grids';
import Inputs from './Inputs';
import ItemListInputs from './ItemListInputs';
import Modals from './Modals';
import Progress from './Progress';
import TimeSliderInputs from './TimeSliderInputs';
import Tooltips from './Tooltips';
import Typograpy from './Typography';
import './StyleGuide.scss';
import DraggableLists from './DraggableLists';
import Navigations from './Navigations.tsx';

const StyleGuide = () => (
  <div className="container style-guide-container">
    <div style={{ marginTop: '2rem', paddingBottom: '1rem' }}>
      <h1 style={{ paddingTop: '2rem' }}>Deephaven UI Components</h1>
    </div>

    <Typograpy />

    <Colors />

    <Buttons />

    <Progress />

    <Alerts />

    <Inputs />

    <ItemListInputs />

    <DraggableLists />

    <TimeSliderInputs />

    <Dialog />

    <Modals />

    <ContextMenus />

    <DropdownMenus />

    <Navigations />

    <Tooltips />

    <Editors />

    <Grids />

    <Charts />

    <ContextMenuRoot />
  </div>
);

export default StyleGuide;
