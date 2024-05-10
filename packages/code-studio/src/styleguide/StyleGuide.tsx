/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import cl from 'classnames';

import {
  ContextMenuRoot,
  ThemePicker,
  useTheme,
  Flex,
} from '@deephaven/components';

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
import { ISOLATED_SECTION_QUERY_CLASS, useIsolateSectionHash } from './utils';
import { GoldenLayout } from './GoldenLayout';
import { RandomAreaPlotAnimation } from './RandomAreaPlotAnimation';
import SpectrumComparison from './SpectrumComparison';
import Pickers from './Pickers';
import ListViews from './ListViews';
import ErrorViews from './ErrorViews';

const stickyProps = {
  position: 'sticky',
  justifyContent: 'end',
  zIndex: 1,
  UNSAFE_style: {
    float: 'right',
  },
} as const;

function StyleGuide(): React.ReactElement {
  const { themes } = useTheme();
  const hasMultipleThemes = themes.length > 1;

  const isIsolatedSection = useIsolateSectionHash() !== '';

  return (
    // Needs a tabindex to capture focus on popper blur
    // AppMainContainer has a tabindex of -1 in the app itself
    <div tabIndex={-1} role="main">
      <div
        className={cl(
          'container',
          'style-guide-container',
          isIsolatedSection && ISOLATED_SECTION_QUERY_CLASS
        )}
      >
        <Flex
          justifyContent="space-between"
          alignItems="center"
          marginTop="2rem"
          marginBottom="1rem"
        >
          <h1 style={{ paddingTop: '2rem' }}>Deephaven UI Components</h1>
        </Flex>

        {/* {isIsolatedSection ? null : ( */}
        <Flex
          {...stickyProps}
          UNSAFE_className={
            isIsolatedSection ? 'hide-when-isolated' : undefined
          }
          marginTop={-56}
          top={20}
          gap={10}
          alignItems="end"
        >
          {hasMultipleThemes ? <ThemePicker /> : null}
          <SamplesMenu />
        </Flex>
        {/* )} */}
        {/* {isIsolatedSection ? null : ( */}
        <Flex
          {...stickyProps}
          UNSAFE_className={
            isIsolatedSection ? 'hide-when-isolated' : undefined
          }
          top="calc(100vh - 40px)"
          marginTop={-32}
          marginEnd={hasMultipleThemes ? -234 : 0}
        >
          <GotoTopButton />
        </Flex>
        {/* )} */}

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
        <ListViews />
        <Pickers />
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
        <ErrorViews />
      </div>
    </div>
  );
}

export default StyleGuide;
