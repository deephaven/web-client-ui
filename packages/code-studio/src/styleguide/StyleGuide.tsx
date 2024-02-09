/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Flex } from '@adobe/react-spectrum';
import { ContextMenuRoot, ThemePicker, useTheme } from '@deephaven/components';

import Buttons from './Buttons';
import Charts from './Charts';
import Colors from './Colors';
import ContextMenus from './ContextMenus';
import Dialog from './Dialog';
import DropdownMenus from './DropdownMenus';
import Editors from './Editors';
import Grids from './Grids';
import Icons from './Icons';
import Inputs from './Inputs';
import ItemListInputs from './ItemListInputs';
import Modals from './Modals';
import Progress from './Progress';
import TimeSliderInputs from './TimeSliderInputs';
import Tooltips from './Tooltips';
import Typograpy from './Typography';
import './StyleGuide.scss';
import DraggableLists from './DraggableLists';
import Navigations from './Navigations';
import ThemeColors from './ThemeColors';
import SpectrumComponents from './SpectrumComponents';
import SamplesMenu, { SampleMenuCategory } from './SamplesMenu';
import GotoTopButton from './GotoTopButton';
import { HIDE_FROM_E2E_TESTS_CLASS } from './utils';
import { GoldenLayout } from './GoldenLayout';
import { RandomAreaPlotAnimation } from './RandomAreaPlotAnimation';
import SpectrumComparison from './SpectrumComparison';

function StyleGuide(): React.ReactElement {
  const isTestMode = window.location.search.includes('testMode=true');
  const { themes } = useTheme();
  const hasMultipleThemes = themes.length > 1;
  const [targetSection, setTargetSection] = useState<string>(
    window.location.hash.replace('#', '')
  );

  const stickyProps = {
    position: isTestMode ? 'static' : 'sticky',
    justifyContent: 'end',
    zIndex: 1,
    UNSAFE_style: {
      float: 'right',
    },
  } as const;

  return (
    // Needs a tabindex to capture focus on popper blur
    // AppMainContainer has a tabindex of -1 in the app itself
    <div tabIndex={-1} role="main">
      <div className="container style-guide-container">
        {/* For e2e tests this allows us to isolate sections for snapshots. This 
      mitigates an issue where a change to a section in the styleguide can cause
      subtle pixel shifts in other sections */}
        {isTestMode && targetSection !== '' && (
          <style>
            {`.${HIDE_FROM_E2E_TESTS_CLASS}, .sample-section:not(#sample-section-${targetSection}), :not(.sample-section) > h2 {
          display: none;
        }`}
          </style>
        )}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          marginTop="2rem"
          marginBottom="1rem"
        >
          <h1 style={{ paddingTop: '2rem' }}>Deephaven UI Components</h1>
        </Flex>

        <Flex
          {...stickyProps}
          // UNSAFE_className={HIDE_FROM_E2E_TESTS_CLASS}
          marginTop={-56}
          top={20}
          gap={10}
          alignItems="end"
        >
          {hasMultipleThemes ? <ThemePicker /> : null}
          <SamplesMenu />
          {isTestMode && (
            <input
              type="text"
              placeholder="Isolate"
              onChange={e => setTargetSection(e.target.value)}
              value={targetSection ?? ''}
            />
          )}
        </Flex>
        {isTestMode && (
          <Flex
            {...stickyProps}
            UNSAFE_className={HIDE_FROM_E2E_TESTS_CLASS}
            top="calc(100vh - 40px)"
            marginTop={-32}
            marginEnd={hasMultipleThemes ? -234 : 0}
          >
            <GotoTopButton />
          </Flex>
        )}

        <Typograpy />

        <SampleMenuCategory data-menu-category="Colors" />
        <Colors />
        <ThemeColors />

        <SampleMenuCategory data-menu-category="Layout" />
        <GoldenLayout />

        <SampleMenuCategory data-menu-category="Components" />
        <Buttons />
        <Progress />
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
        <Icons />
        <Editors />
        <Grids />
        <Charts />
        <ContextMenuRoot />
        <RandomAreaPlotAnimation />

        <SampleMenuCategory data-menu-category="Spectrum Components" />
        <SpectrumComponents />

        <SampleMenuCategory data-menu-category="Spectrum Comparison" />
        <SpectrumComparison />
      </div>
    </div>
  );
}

export default StyleGuide;
